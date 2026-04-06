import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck } from "lucide-react";

export default function StudentHome() {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: sessions } = await supabase.from("sessions").select("*, classes(*)").eq("status", "active").eq("date", today);
      setActiveSessions(sessions || []);

      const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single();
      if (student) {
        const { data: att } = await supabase.from("attendance").select("*, sessions(*, classes(*))").eq("student_id", student.id)
          .gte("created_at", today);
        setTodayAttendance(att || []);
      }
    };
    fetch();
  }, [user]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Selamat Datang! 👋</h1>
      
      <h2 className="text-lg font-semibold mb-3">Sesi Aktif Hari Ini</h2>
      {activeSessions.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Tidak ada sesi aktif hari ini</CardContent></Card>
      ) : activeSessions.map((s) => (
        <Card key={s.id} className="mb-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              {s.classes?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{s.classes?.subject} • {s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}</p>
            <Badge className="mt-2 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30" variant="outline">Aktif</Badge>
          </CardContent>
        </Card>
      ))}

      <h2 className="text-lg font-semibold mt-6 mb-3">Kehadiran Hari Ini</h2>
      {todayAttendance.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada catatan kehadiran hari ini</p>
      ) : todayAttendance.map((a) => (
        <Card key={a.id} className="mb-2">
          <CardContent className="py-3 flex justify-between items-center">
            <span className="text-sm font-medium">{a.sessions?.classes?.name}</span>
            <Badge variant="outline" className={
              a.status === "hadir" ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" :
              a.status === "izin" ? "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" :
              "bg-destructive/10 text-destructive"
            }>{a.status.charAt(0).toUpperCase() + a.status.slice(1)}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
