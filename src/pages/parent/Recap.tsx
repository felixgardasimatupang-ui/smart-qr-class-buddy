import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Tables } from "@/integrations/supabase/types";

type Student = Tables<"students">;

export default function ParentRecap() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [recaps, setRecaps] = useState<Record<string, { hadir: number; absen: number; izin: number; total: number }>>({});

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: kids } = await supabase.from("students").select("*").eq("parent_user_id", user.id);
      setChildren(kids || []);
      if (kids) {
        const map: typeof recaps = {};
        for (const kid of kids) {
          const { data: att } = await supabase.from("attendance").select("status").eq("student_id", kid.id);
          const list = att || [];
          map[kid.id] = {
            hadir: list.filter((a) => a.status === "hadir").length,
            absen: list.filter((a) => a.status === "absen").length,
            izin: list.filter((a) => a.status === "izin").length,
            total: list.length,
          };
        }
        setRecaps(map);
      }
    };
    fetch();
  }, [user]);

  const pct = (n: number, t: number) => t ? Math.round((n / t) * 100) : 0;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Rekap Kehadiran</h1>
      {children.map((c) => {
        const r = recaps[c.id] || { hadir: 0, absen: 0, izin: 0, total: 0 };
        return (
          <Card key={c.id} className="mb-4">
            <CardHeader className="pb-2"><CardTitle className="text-base">{c.full_name}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><div className="flex justify-between text-sm mb-1"><span>Hadir</span><span className="text-[hsl(var(--success))]">{pct(r.hadir, r.total)}%</span></div><Progress value={pct(r.hadir, r.total)} className="h-2" /></div>
              <div><div className="flex justify-between text-sm mb-1"><span>Absen</span><span className="text-destructive">{pct(r.absen, r.total)}%</span></div><Progress value={pct(r.absen, r.total)} className="h-2" /></div>
              <div><div className="flex justify-between text-sm mb-1"><span>Izin</span><span className="text-[hsl(var(--warning))]">{pct(r.izin, r.total)}%</span></div><Progress value={pct(r.izin, r.total)} className="h-2" /></div>
              <p className="text-xs text-muted-foreground">Total {r.total} sesi</p>
            </CardContent>
          </Card>
        );
      })}
      {children.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Belum ada data anak terhubung</p>}
    </div>
  );
}
