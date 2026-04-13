import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tables } from "@/integrations/supabase/types";

type Student = Tables<"students">;
type Evaluation = Tables<"evaluations">;

export default function ParentGrades() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Record<string, Evaluation[]>>({});

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: kids } = await supabase.from("students").select("*").eq("parent_user_id", user.id);
      setChildren(kids || []);
      if (kids) {
        const map: Record<string, Evaluation[]> = {};
        for (const kid of kids) {
          const { data } = await supabase.from("evaluations").select("*, sessions(*, classes(*))").eq("student_id", kid.id).order("created_at", { ascending: false });
          map[kid.id] = data || [];
        }
        setGrades(map);
      }
    };
    fetch();
  }, [user]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Nilai & Catatan</h1>
      {children.map((c) => (
        <div key={c.id} className="mb-6">
          <h2 className="text-lg font-semibold mb-3">{c.full_name}</h2>
          {(grades[c.id] || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada nilai</p>
          ) : (grades[c.id] || []).map((e) => (
            <Card key={e.id} className="mb-2">
              <CardContent className="py-3">
                <div className="flex justify-between items-center">
                  <div><p className="font-medium text-sm">{e.sessions?.classes?.name}</p><p className="text-xs text-muted-foreground">{e.sessions?.date}</p></div>
                  <span className="text-lg font-bold text-primary">{e.score ?? "-"}</span>
                </div>
                {e.notes && <p className="text-sm text-muted-foreground mt-2 border-t pt-2">{e.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
      {children.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Belum ada data anak terhubung</p>}
    </div>
  );
}
