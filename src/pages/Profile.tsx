import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, User, Camera, Save, Phone, Mail, ShieldCheck, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState({ full_name: "", phone: "", avatar_url: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfile = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user?.id)
      .single();

    if (data && !error) {
      setProfile({
        full_name: data.full_name || "",
        phone: data.phone || "",
        avatar_url: data.avatar_url || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let error;
    if (existingProfile) {
      const result = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          full_name: profile.full_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
        });
      error = result.error;
    }

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Berhasil!", description: "Profil berhasil diperbarui." });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfile({ ...profile, avatar_url: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Profil Saya</h1>
        <Button variant="ghost" size="icon" className="rounded-full bg-secondary/50 text-muted-foreground hover:text-primary transition-colors">
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      <Card className="glass-card overflow-hidden border-0 shadow-lg relative">
        <div className="h-32 bg-gradient-to-r from-primary to-purple-600 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        </div>
        
        <CardContent className="p-6 sm:p-8 relative">
          <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-end -mt-20 mb-8 z-10 relative">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-background shadow-2xl">
                <AvatarImage src={profile.avatar_url || `https://i.pravatar.cc/150?u=${user?.id}`} className="object-cover" />
                <AvatarFallback className="text-4xl font-bold bg-primary/20 text-primary">{profile.full_name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <Label 
                htmlFor="avatar-upload" 
                className="absolute bottom-2 right-2 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform group-hover:bg-primary/90"
              >
                <Camera className="w-5 h-5" />
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </Label>
            </div>
            
            <div className="flex-1 pb-2">
              <h2 className="text-2xl font-bold">{profile.full_name || 'Pengguna'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {role || "user"}
                </span>
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="space-y-3">
              <Label htmlFor="full_name" className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Nama Lengkap</Label>
               <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="pl-10 h-12 bg-background/50 border-white/20 dark:border-white/10"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Email</Label>
               <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input 
                  id="email" 
                  value={user?.email || ""} 
                  disabled 
                  className="pl-10 h-12 bg-muted/50 opacity-70 border-white/20 dark:border-white/10" 
                />
              </div>
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label htmlFor="phone" className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Nomor Telepon</Label>
               <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="pl-10 h-12 bg-background/50 border-white/20 dark:border-white/10"
                  placeholder="Contoh: 081234567890"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <Button onClick={handleSave} disabled={saving} className="flex-1 h-12 text-base shadow-lg shadow-primary/20">
              <Save className="mr-2 h-5 w-5" />
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>

            <Button variant="destructive" className="h-12 px-8 shadow-lg shadow-destructive/20" onClick={async () => { await signOut(); navigate("/auth"); }}>
              <LogOut className="mr-2 h-5 w-5" />Keluar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
