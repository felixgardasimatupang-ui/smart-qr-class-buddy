import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Session = Tables<"sessions">;
type Student = Tables<"students">;
type Class = Tables<"classes">;

type SessionWithClass = Session & { classes?: Class };

export default function AdminEvaluations() {
  const [sessions, setSessions] = useState<SessionWithClass[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, { score: string; notes: string }>>({});
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("sessions").select("*, classes(*)").order("date", { ascending: false })
      .then(({ data }) => { if (data) setSessions(data as SessionWithClass[]); });
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    const fetchData = async () => {
      const session = sessions.find((s) => s.id === selectedSession);
      if (!session) return;
      const { data: cs } = await supabase.from("class_students").select("student_id, students(*)").eq("class_id", session.class_id);
      const studs = (cs || []).map((c) => (c as { students?: Student }).students).filter(Boolean);
      setStudents(studs);
      const { data: evals } = await supabase.from("evaluations").select("*").eq("session_id", selectedSession);
      const map: Record<string, { score: string; notes: string }> = {};
      studs.forEach((s: Student) => {
        const ev = evals?.find((e) => e.student_id === s.id);
        map[s.id] = { score: ev?.score?.toString() || "", notes: ev?.notes || "" };
      });
      setEvaluations(map);
    };
    fetchData();
  }, [selectedSession, sessions]);

  const handleSave = async () => {
    for (const [studentId, val] of Object.entries(evaluations)) {
      await supabase.from("evaluations").upsert({
        session_id: selectedSession,
        student_id: studentId,
        score: val.score ? parseFloat(val.score) : null,
        notes: val.notes || null,
      }, { onConflict: "session_id,student_id" });
    }
    toast({ title: "Evaluasi berhasil disimpan" });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Input Evaluasi</h1>
      <div className="mb-6 max-w-md">
        <Label>Pilih Sesi</Label>
        <Select value={selectedSession} onValueChange={setSelectedSession}>
          <SelectTrigger><SelectValue placeholder="Pilih sesi" /></SelectTrigger>
          <SelectContent>
            {sessions.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.classes?.name} - {s.date}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedSession && students.length > 0 && (
        <div className="space-y-4">
          {students.map((student) => (
            <Card key={student.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{student.full_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nilai</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={evaluations[student.id]?.score || ""}
                      onChange={(e) => setEvaluations({ ...evaluations, [student.id]: { ...evaluations[student.id], score: e.target.value } })}
                    />
                  </div>
                  <div>
                    <Label>Catatan</Label>
                    <Textarea
                      value={evaluations[student.id]?.notes || ""}
                      onChange={(e) => setEvaluations({ ...evaluations, [student.id]: { ...evaluations[student.id], notes: e.target.value } })}
                      placeholder="Catatan pengajar..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" />Simpan Evaluasi</Button>
        </div>
      )}

      {selectedSession && students.length === 0 && (
        <p className="text-muted-foreground">Belum ada siswa di kelas ini. Tambahkan siswa ke kelas terlebih dahulu.</p>
      )}
    </div>
  );
}
