import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminReports() {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [evalData, setEvalData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ hadir: 0, absen: 0, izin: 0, total: 0 });

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
      <h1 className="text-2xl font-bold mb-6">Laporan</h1>
      <div className="mb-6 max-w-md">
        <Label>Pilih Siswa</Label>
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
          <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
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
