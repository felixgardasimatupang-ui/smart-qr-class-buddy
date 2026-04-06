import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, CalendarCheck, CheckCircle, UserCog, Sparkles, Plus, TrendingUp, BarChart3, Activity } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: 0, classes: 0, sessions: 0, todayAttendance: 0, users: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split("T")[0];
      const [students, classes, sessions, attendance, users] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("classes").select("id", { count: "exact", head: true }),
        supabase.from("sessions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("attendance").select("id", { count: "exact", head: true })
          .eq("status", "hadir")
          .gte("created_at", today),
        supabase.from("user_roles").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        students: students.count || 0,
        classes: classes.count || 0,
        sessions: sessions.count || 0,
        todayAttendance: attendance.count || 0,
        users: users.count || 0,
      });
    };
    fetchStats();
  }, []);

  const metricCards = [
    { title: "Total User", value: stats.users, icon: UserCog, color: "from-cyan-500/20 to-cyan-500/0 text-cyan-600", bgIcon: "bg-cyan-100 dark:bg-cyan-500/20", link: "/admin/users" },
    { title: "Total Siswa", value: stats.students, icon: Users, color: "from-blue-500/20 to-blue-500/0 text-blue-600", bgIcon: "bg-blue-100 dark:bg-blue-500/20", link: "/admin/students" },
    { title: "Kelas", value: stats.classes, icon: BookOpen, color: "from-emerald-500/20 to-emerald-500/0 text-emerald-600", bgIcon: "bg-emerald-100 dark:bg-emerald-500/20", link: "/admin/classes" },
    { title: "Sesi Aktif", value: stats.sessions, icon: CalendarCheck, color: "from-amber-500/20 to-amber-500/0 text-amber-600", bgIcon: "bg-amber-100 dark:bg-amber-500/20", link: "/admin/sessions" },
    { title: "Hadir Hari Ini", value: stats.todayAttendance, icon: CheckCircle, color: "from-primary/20 to-primary/0 text-primary", bgIcon: "bg-primary/20 text-primary", link: "/admin/sessions" },
  ];

  const quickActions = [
    { title: "Tambah User Baru", desc: "Daftarkan admin, guru, atau wali murid", icon: UserCog, action: () => navigate("/admin/users"), gradient: "from-cyan-500 to-blue-600" },
    { title: "Tambah Siswa", desc: "Input data siswa baru ke dalam sistem", icon: Users, action: () => navigate("/admin/students"), gradient: "from-blue-500 to-cyan-500" },
    { title: "Tambah Kelas", desc: "Buat mata pelajaran dan jadwal baru", icon: BookOpen, action: () => navigate("/admin/classes"), gradient: "from-emerald-500 to-teal-500" },
    { title: "Buat Sesi Absensi", desc: "Mulai sesi QR absen untuk siswa", icon: CalendarCheck, action: () => navigate("/admin/sessions"), gradient: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary/80 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Panel Manajemen
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Dashboard Admin</h1>
          <p className="text-muted-foreground mt-1 text-lg">Ringkasan aktivitas dan metrik utama aplikasi BimbelAbsen.</p>
        </div>
        <Button onClick={() => navigate("/admin/sessions")} size="lg" className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white font-semibold rounded-full px-6">
          <Plus className="mr-2 h-5 w-5" /> Buat Sesi Absen Baru
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metricCards.map((card) => (
          <Card key={card.title} className="glass group cursor-pointer hover:-translate-y-1 transition-all duration-300 overflow-hidden relative border-0 shadow-sm" onClick={() => navigate(card.link)}>
            <div className={`absolute inset-0 bg-gradient-to-b ${card.color} opacity-40`}></div>
            <CardContent className="p-5 relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div className={`p-2.5 rounded-xl ${card.bgIcon}`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold">{card.value}</div>
                <p className="text-sm font-semibold text-muted-foreground mt-1">{card.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Aksi Cepat
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Card key={action.title} className="glass group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden relative border-0" onClick={action.action}>
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                <CardContent className="p-6 flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg text-white group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{action.title}</h3>
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">{action.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Feature Guide */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Panduan Sistem
          </h2>
          <Card className="glass-card relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
            <CardContent className="p-6">
              <ul className="space-y-4 relative z-10">
                {[
                  { icon: UserCog, title: "Kelola User", desc: "Atur role Admin, Siswa, dan Orang Tua" },
                  { icon: Users, title: "Kelola Siswa", desc: "Data induk siswa dan relasi orang tua" },
                  { icon: BarChart3, title: "Sesi & Absensi", desc: "QR dinamis untuk absensi real-time" },
                  { icon: Activity, title: "Evaluasi", desc: "Pemberian nilai dan rapor anak" },
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-4">
                    <div className="mt-0.5 w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
