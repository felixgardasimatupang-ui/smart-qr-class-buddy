import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tables } from "@/integrations/supabase/types";

type Attendance = Tables<"attendance">;
type Evaluation = Tables<"evaluations">;

export default function StudentHistory() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single();
      if (!student) return;
      const [attRes, evalRes] = await Promise.all([
        supabase.from("attendance").select("*, sessions(*, classes(*))").eq("student_id", student.id).order("created_at", { ascending: false }),
        supabase.from("evaluations").select("*, sessions(*, classes(*))").eq("student_id", student.id).order("created_at", { ascending: false }),
      ]);
      setAttendance(attRes.data || []);
      setEvaluations(evalRes.data || []);
    };
    fetch();
  }, [user]);

  const statusBadge = (status: string) => {
    const cls = status === "hadir" ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" :
      status === "izin" ? "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" : "bg-destructive/10 text-destructive";
    return <Badge variant="outline" className={cls}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Riwayat</h1>
      <Tabs defaultValue="attendance">
        <TabsList className="w-full"><TabsTrigger value="attendance" className="flex-1">Kehadiran</TabsTrigger><TabsTrigger value="grades" className="flex-1">Nilai</TabsTrigger></TabsList>
        <TabsContent value="attendance" className="mt-4 space-y-2">
          {attendance.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Belum ada riwayat</p> :
            attendance.map((a) => (
              <Card key={a.id}><CardContent className="py-3 flex justify-between items-center">
                <div><p className="font-medium text-sm">{a.sessions?.classes?.name}</p><p className="text-xs text-muted-foreground">{a.sessions?.date}</p></div>
                {statusBadge(a.status)}
              </CardContent></Card>
            ))}
        </TabsContent>
        <TabsContent value="grades" className="mt-4 space-y-2">
          {evaluations.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Belum ada nilai</p> :
            evaluations.map((e) => (
              <Card key={e.id}><CardContent className="py-3">
                <div className="flex justify-between items-center"><p className="font-medium text-sm">{e.sessions?.classes?.name}</p><span className="text-lg font-bold text-primary">{e.score ?? "-"}</span></div>
                <p className="text-xs text-muted-foreground mt-1">{e.sessions?.date}</p>
                {e.notes && <p className="text-sm text-muted-foreground mt-2">{e.notes}</p>}
              </CardContent></Card>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
