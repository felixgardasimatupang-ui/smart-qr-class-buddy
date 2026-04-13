import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, Activity, Sparkles, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Tables } from "@/integrations/supabase/types";

type Student = Tables<"students">;
type Attendance = Tables<"attendance">;
type Profile = Tables<"profiles">;

export default function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      setProfile(prof);

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
    const cls = status === "hadir" ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30" :
      status === "izin" ? "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30" : "bg-destructive/15 text-destructive border-destructive/30";
    return <Badge variant="outline" className={`font-bold ${cls}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const displayName = profile?.full_name || 'Bapak/Ibu Pendaftar';
  const displayAvatar = profile?.avatar_url || `https://i.pravatar.cc/150?u=${user?.id}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-primary/10 to-cyan-600/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center gap-6 relative z-10">
          <Avatar className="w-20 h-20 border-4 border-background shadow-xl">
            <AvatarImage src={displayAvatar} className="object-cover" />
            <AvatarFallback className="bg-cyan-600/20 text-cyan-600 text-xl font-bold">
              {displayName.charAt(0) || <User />}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Dashboard Orang Tua
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Halo, {displayName} 👨‍👩‍👧
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-medium max-w-md line-clamp-2">
              Pantau perkembangan dan kehadiran anak Anda hari ini.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Children Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
               <Users className="h-4 w-4 text-primary" />
            </div>
            Anak Saya
          </h2>
          {children.length === 0 ? (
            <Card className="glass-card border-dashed border-2">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                Belum ada data anak terhubung
              </CardContent>
            </Card>
          ) : children.map((c, idx) => (
            <Card key={c.id} className="glass group hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="w-14 h-14 border-2 border-background shadow-sm">
                  <AvatarImage src={`https://i.pravatar.cc/150?u=${c.id}`} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{c.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{c.full_name}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-0.5">NIS: {c.nis || "-"}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Today's Attendance Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
               <Activity className="h-4 w-4 text-cyan-500" />
            </div>
            Aktivitas Kehadiran
          </h2>
          {todayAttendance.length === 0 ? (
            <Card className="glass-card border-dashed border-2">
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                Belum ada data kehadiran hari ini
              </CardContent>
            </Card>
          ) : todayAttendance.map((a) => (
            <Card key={a.id} className="glass">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-start gap-3">
                   <div className="w-2 h-12 rounded-full bg-gradient-to-b from-primary to-cyan-500"></div>
                   <div>
                    <p className="font-bold text-sm tracking-tight">{a.students?.full_name}</p>
                    <p className="text-xs font-semibold text-muted-foreground mt-0.5">{a.sessions?.classes?.name}</p>
                   </div>
                </div>
                {statusBadge(a.status)}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
