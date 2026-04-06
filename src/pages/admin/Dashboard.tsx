import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, CalendarCheck, CheckCircle } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, classes: 0, sessions: 0, todayAttendance: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [students, classes, sessions, attendance] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("classes").select("id", { count: "exact", head: true }),
        supabase.from("sessions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("attendance").select("id", { count: "exact", head: true })
          .eq("status", "hadir")
          .gte("created_at", new Date().toISOString().split("T")[0]),
      ]);
      setStats({
        students: students.count || 0,
        classes: classes.count || 0,
        sessions: sessions.count || 0,
        todayAttendance: attendance.count || 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Total Siswa", value: stats.students, icon: Users, color: "text-primary" },
    { title: "Kelas Aktif", value: stats.classes, icon: BookOpen, color: "text-[hsl(var(--success))]" },
    { title: "Sesi Aktif", value: stats.sessions, icon: CalendarCheck, color: "text-[hsl(var(--warning))]" },
    { title: "Hadir Hari Ini", value: stats.todayAttendance, icon: CheckCircle, color: "text-[hsl(var(--success))]" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
