import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Class = Tables<"classes">;

export default function AdminClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);
  const [form, setForm] = useState({ name: "", subject: "", day_of_week: "", start_time: "", end_time: "" });
  const { toast } = useToast();

  const fetchClasses = async () => {
    const { data } = await supabase.from("classes").select("*").order("created_at", { ascending: false });
    if (data) setClasses(data);
  };

  useEffect(() => { fetchClasses(); }, []);

  const handleSave = async () => {
    const payload = { ...form, start_time: form.start_time || null, end_time: form.end_time || null, day_of_week: form.day_of_week || null };
    if (editing) {
      const { error } = await supabase.from("classes").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Kelas berhasil diperbarui" });
    } else {
      const { error } = await supabase.from("classes").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Kelas berhasil ditambahkan" });
    }
    setOpen(false); setEditing(null); setForm({ name: "", subject: "", day_of_week: "", start_time: "", end_time: "" });
    fetchClasses();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("classes").delete().eq("id", id);
    toast({ title: "Kelas berhasil dihapus" });
    fetchClasses();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Kelola Kelas</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm({ name: "", subject: "", day_of_week: "", start_time: "", end_time: "" }); } }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Tambah Kelas</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit Kelas" : "Tambah Kelas Baru"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nama Kelas</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Mata Pelajaran</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
              <div><Label>Hari</Label><Input value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })} placeholder="Senin" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Jam Mulai</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
                <div><Label>Jam Selesai</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
              </div>
              <Button onClick={handleSave} className="w-full">{editing ? "Simpan" : "Tambah"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Mapel</TableHead>
                <TableHead>Hari</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada kelas</TableCell></TableRow>
              ) : classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.subject}</TableCell>
                  <TableCell>{c.day_of_week || "-"}</TableCell>
                  <TableCell>{c.start_time && c.end_time ? `${c.start_time.slice(0,5)} - ${c.end_time.slice(0,5)}` : "-"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setForm({ name: c.name, subject: c.subject, day_of_week: c.day_of_week || "", start_time: c.start_time || "", end_time: c.end_time || "" }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
