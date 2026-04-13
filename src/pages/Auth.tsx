import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, UserPlus, LogIn, ChevronRight, Sparkles } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  useEffect(() => {
    if (user && role) {
      const routes: Record<string, string> = { admin: "/admin", student: "/student", parent: "/parent" };
      if (routes[role]) {
        navigate(routes[role], { replace: true });
      }
    }
  }, [user, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Berhasil masuk!", description: "Selamat datang kembali." });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: "Registrasi berhasil!", description: "Silakan cek email untuk verifikasi." });
      }
    } catch (error) {
      console.error("Auth error:", error);
      const message = error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/20 blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center z-10">
        
        {/* Left Side: Branding */}
        <div className="hidden md:flex flex-col justify-center space-y-6 p-8 animate-float">
          <div className="inline-flex items-center gap-3 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-full w-fit">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium text-sm">Platform Absensi Masa Kini</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight">
            Selamat Datang di <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-500">BimbelAbsen</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
            Sistem informasi cerdas untuk memantau kehadiran, nilai, dan perkembangan anak Anda dengan mudah dan aman.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-4">
              {[1,2,3,4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt={`User ${i}`} />
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-muted-foreground">Dipercaya oleh 1,000+ pengguna</p>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <Card className="glass-card w-full max-w-md mx-auto border-0 sm:border relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500"></div>
          <CardHeader className="text-center sm:text-left space-y-3 pb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto sm:mx-0 mb-2">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold">
              {isLogin ? "Masuk ke Akun" : "Buat Akun Baru"}
            </CardTitle>
            <CardDescription className="text-base">
              {isLogin ? "Silakan masukkan kredensial Anda untuk melanjutkan" : "Daftarkan diri Anda untuk merasakan pengalaman baru"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Nama Lengkap</Label>
                  <Input 
                    id="fullName" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    required 
                    className="h-12 bg-background/50 border-white/20 focus:border-primary transition-colors"
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="h-12 bg-background/50 border-white/20 focus:border-primary transition-colors"
                  placeholder="name@example.com"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  {isLogin && <a href="#" className="text-sm text-primary hover:underline font-medium">Lupa password?</a>}
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  minLength={6} 
                  className="h-12 bg-background/50 border-white/20 focus:border-primary transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full h-12 text-base font-semibold group mt-6" disabled={loading}>
                {loading ? "Memproses..." : isLogin ? (
                  <>Masuk <LogIn className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                ) : (
                  <>Daftar <UserPlus className="ml-2 w-4 h-4" /></>
                )}
              </Button>
            </form>
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
                <button
                  type="button"
                  className="text-primary font-semibold hover:underline inline-flex items-center"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Daftar sekarang" : "Masuk di sini"}
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
