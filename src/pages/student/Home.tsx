import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, User, Clock, CheckCircle, Sparkles, BookOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Tables } from "@/integrations/supabase/types";

type Session = Tables<"sessions">;
type Attendance = Tables<"attendance">;
type Student = Tables<"students">;
type Profile = Tables<"profiles">;

export default function StudentHome() {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: sessions } = await supabase.from("sessions").select("*, classes(*)").eq("status", "active").eq("date", today);
      setActiveSessions(sessions || []);

      const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      setProfile(prof);

      const { data: student } = await supabase.from("students").select("*").eq("user_id", user.id).single();
      setStudentInfo(student);
      
      if (student) {
        const { data: att } = await supabase.from("attendance").select("*, sessions(*, classes(*))").eq("student_id", student.id)
          .gte("created_at", today);
        setTodayAttendance(att || []);
      }
    };
    fetch();
  }, [user]);

  const displayName = profile?.full_name || studentInfo?.full_name || 'Pelajar';
  const displayAvatar = profile?.avatar_url || `https://i.pravatar.cc/150?u=${user?.id}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Header Profile Section */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center gap-6 relative z-10">
          <Avatar className="w-20 h-20 border-4 border-background shadow-xl">
            <AvatarImage src={displayAvatar} className="object-cover" />
            <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary/80 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Siswa Aktif
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Halo, {displayName} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              NIS: {studentInfo?.nis || '-'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Sessions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <CalendarCheck className="h-4 w-4 text-primary" />
              </div>
              Sesi Aktif Hari Ini
            </h2>
            <Badge variant="secondary" className="font-semibold">{activeSessions.length} Kelas</Badge>
          </div>

          {activeSessions.length === 0 ? (
            <Card className="glass-card border-dashed border-2">
              <CardContent className="py-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-foreground">Tidak ada sesi aktif</p>
                <p className="text-sm text-muted-foreground mt-1">Belum ada kelas yang dimulai hari ini.</p>
              </CardContent>
            </Card>
          ) : activeSessions.map((s) => (
            <Card key={s.id} className="glass group hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="p-5 flex justify-between items-center relative z-10">
                <div>
                  <h3 className="font-bold text-lg">{s.classes?.name}</h3>
                  <p className="text-sm font-medium text-muted-foreground line-clamp-1">{s.classes?.subject}</p>
                  <div className="flex items-center gap-2 mt-3 text-xs font-semibold text-primary bg-primary/10 w-fit px-2.5 py-1 rounded-md">
                    <Clock className="w-3.5 h-3.5" />
                    {s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}
                  </div>
                </div>
                <Badge className="bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-0 font-bold px-3 py-1 shadow-sm">Aktif</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Attendance Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--success))]/20 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-[hsl(var(--success))]" />
              </div>
              Kehadiran Saya
            </h2>
            <Badge variant="secondary" className="font-semibold">{todayAttendance.length} Riwayat</Badge>
          </div>

          {todayAttendance.length === 0 ? (
            <Card className="glass-card border-dashed border-2">
              <CardContent className="py-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-foreground">Belum ada kehadiran</p>
                <p className="text-sm text-muted-foreground mt-1">Anda belum melakukan scan absen hari ini.</p>
              </CardContent>
            </Card>
          ) : todayAttendance.map((a) => (
            <Card key={a.id} className="glass transition-all duration-300">
              <CardContent className="p-4 flex justify-between items-center bg-gradient-to-r from-background to-transparent">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <span className="text-sm font-bold block">{a.sessions?.classes?.name}</span>
                    <span className="text-xs font-medium text-muted-foreground">{a.sessions?.classes?.subject}</span>
                  </div>
                </div>
                <Badge variant="outline" className={
                  a.status === "hadir" ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30 font-bold" :
                  a.status === "izin" ? "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30 font-bold" :
                  "bg-destructive/15 text-destructive border-destructive/30 font-bold"
                }>{a.status.charAt(0).toUpperCase() + a.status.slice(1)}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
