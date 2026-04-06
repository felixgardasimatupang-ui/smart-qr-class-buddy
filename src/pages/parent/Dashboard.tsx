import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle } from "lucide-react";

export default function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: kids } = await supabase.from("students").select("*").eq("parent_user_id", user.id);
      setChildren(kids || []);
      if (kids && kids.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        const ids = kids.map((k) => k.id);
        const { data: att } = await supabase.from("attendance").select("*, students(*), sessions(*, classes(*))")
          .in("student_id", ids).gte("created_at", today);
        setTodayAttendance(att || []);
      }
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
      <h1 className="text-xl font-bold mb-4">Dashboard Orang Tua 👨‍👩‍👧</h1>
      
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" />Anak Saya</h2>
      {children.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada data anak terhubung</CardContent></Card>
      ) : children.map((c) => (
        <Card key={c.id} className="mb-3">
          <CardContent className="py-3"><p className="font-medium">{c.full_name}</p><p className="text-sm text-muted-foreground">NIS: {c.nis || "-"}</p></CardContent>
        </Card>
      ))}

      <h2 className="text-lg font-semibold mt-6 mb-3 flex items-center gap-2"><CheckCircle className="h-4 w-4" />Kehadiran Hari Ini</h2>
      {todayAttendance.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada data kehadiran hari ini</p>
      ) : todayAttendance.map((a) => (
        <Card key={a.id} className="mb-2">
          <CardContent className="py-3 flex justify-between items-center">
            <div><p className="font-medium text-sm">{a.students?.full_name}</p><p className="text-xs text-muted-foreground">{a.sessions?.classes?.name}</p></div>
            {statusBadge(a.status)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
