import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { Download, FileDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminReports() {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [evalData, setEvalData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ hadir: 0, absen: 0, izin: 0, total: 0 });

  const handleExport = () => {
    if (!attendanceData.length) return;
    const studentName = students.find(s => s.id === selectedStudent)?.full_name || "Laporan";
    const headers = ["Tanggal", "Kelas", "Status\n"];
    const rows = attendanceData.map(a => 
      `${a.sessions?.date},${a.sessions?.classes?.name || "-"},${a.status}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_${studentName.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    supabase.from("students").select("*").order("full_name").then(({ data }) => { if (data) setStudents(data); });
  }, []);

  useEffect(() => {
    if (!selectedStudent) return;
    const fetch = async () => {
      const [attRes, evalRes] = await Promise.all([
        supabase.from("attendance").select("*, sessions(*, classes(*))").eq("student_id", selectedStudent).order("created_at", { ascending: false }),
        supabase.from("evaluations").select("*, sessions(*, classes(*))").eq("student_id", selectedStudent).order("created_at", { ascending: false }),
      ]);
      const att = attRes.data || [];
      setAttendanceData(att);
      setEvalData(evalRes.data || []);
      setSummary({
        hadir: att.filter((a) => a.status === "hadir").length,
        absen: att.filter((a) => a.status === "absen").length,
        izin: att.filter((a) => a.status === "izin").length,
        total: att.length,
      });
    };
    fetch();
  }, [selectedStudent]);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      hadir: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
      absen: "bg-destructive/10 text-destructive border-destructive/30",
      izin: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30",
    };
    return <Badge variant="outline" className={map[status] || ""}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const pct = (n: number) => summary.total ? Math.round((n / summary.total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-1">
            <Sparkles className="w-3 h-3" />
            Statistik Kehadiran
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Siswa</h1>
        </div>
        {selectedStudent && attendanceData.length > 0 && (
          <Button onClick={handleExport} variant="outline" className="glass-card shadow-sm rounded-full gap-2 text-xs font-bold">
            <FileDown className="w-4 h-4" /> Download CSV (Excel)
          </Button>
        )}
      </div>

      <div className="mb-8 max-w-md p-6 glass-card rounded-2xl border-0">
        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2 block">Pilih Nama Siswa</Label>
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="h-12 bg-background/50 border-white/10"><SelectValue placeholder="Pilih siswa..." /></SelectTrigger>
          <SelectContent className="glass-card border-white/10 pointer-events-auto">{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {selectedStudent && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Sesi</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.total}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-[hsl(var(--success))]">Hadir</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.hadir} ({pct(summary.hadir)}%)</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-destructive">Absen</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.absen} ({pct(summary.absen)}%)</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-[hsl(var(--warning))]">Izin</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.izin} ({pct(summary.izin)}%)</div></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Riwayat Kehadiran</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Kelas</TableHead><TableHead>Tanggal</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {attendanceData.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.sessions?.classes?.name || "-"}</TableCell>
                        <TableCell>{a.sessions?.date}</TableCell>
                        <TableCell>{statusBadge(a.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Nilai & Evaluasi</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Kelas</TableHead><TableHead>Tanggal</TableHead><TableHead>Nilai</TableHead><TableHead>Catatan</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {evalData.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.sessions?.classes?.name || "-"}</TableCell>
                        <TableCell>{e.sessions?.date}</TableCell>
                        <TableCell className="font-semibold">{e.score ?? "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{e.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
