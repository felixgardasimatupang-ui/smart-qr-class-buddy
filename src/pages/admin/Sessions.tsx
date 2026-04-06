import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, QrCode, Play, Square } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

type Session = Tables<"sessions">;
type Class = Tables<"classes">;

export default function AdminSessions() {
  const [sessions, setSessions] = useState<(Session & { classes?: Class })[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [open, setOpen] = useState(false);
  const [qrSession, setQrSession] = useState<Session | null>(null);
  const [form, setForm] = useState({ class_id: "", date: "", start_time: "", end_time: "" });
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = async () => {
    const [sessionsRes, classesRes] = await Promise.all([
      supabase.from("sessions").select("*, classes(*)").order("date", { ascending: false }),
      supabase.from("classes").select("*"),
    ]);
    if (sessionsRes.data) setSessions(sessionsRes.data as any);
    if (classesRes.data) setClasses(classesRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    const qr_code = `bimbel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const { error } = await supabase.from("sessions").insert({
      ...form,
      teacher_id: user?.id,
      qr_code,
      status: "scheduled",
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Sesi berhasil dibuat" });
    setOpen(false);
    setForm({ class_id: "", date: "", start_time: "", end_time: "" });
    fetchData();
  };

  const toggleStatus = async (session: Session) => {
    const newStatus = session.status === "active" ? "completed" : "active";
    await supabase.from("sessions").update({ status: newStatus }).eq("id", session.id);
    fetchData();
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      scheduled: { label: "Terjadwal", className: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30" },
      active: { label: "Aktif", className: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30" },
      completed: { label: "Selesai", className: "bg-muted text-muted-foreground" },
    };
    const s = map[status] || map.scheduled;
    return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sesi Absensi</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Buat Sesi</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Buat Sesi Baru</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Kelas</Label>
                <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} - {c.subject}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Tanggal</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Jam Mulai</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
                <div><Label>Jam Selesai</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
              </div>
              <Button onClick={handleCreate} className="w-full">Buat Sesi</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {qrSession && (
        <Dialog open={!!qrSession} onOpenChange={() => setQrSession(null)}>
          <DialogContent className="max-w-sm text-center">
            <DialogHeader><DialogTitle>QR Code Sesi</DialogTitle></DialogHeader>
            <div className="flex justify-center py-6">
              <QRCodeSVG value={qrSession.qr_code || ""} size={256} level="H" />
            </div>
            <p className="text-sm text-muted-foreground">Scan QR code ini untuk absensi</p>
          </DialogContent>
        </Dialog>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kelas</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada sesi</TableCell></TableRow>
              ) : sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{(s as any).classes?.name || "-"}</TableCell>
                  <TableCell>{s.date}</TableCell>
                  <TableCell>{s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}</TableCell>
                  <TableCell>{statusBadge(s.status)}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => setQrSession(s)}><QrCode className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleStatus(s)}>
                      {s.status === "active" ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
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
