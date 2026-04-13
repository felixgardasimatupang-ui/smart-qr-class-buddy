import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, UserPlus, LogIn, ChevronRight, Sparkles, Mail } from "lucide-react";

type OAuthProvider = "google" | "apple" | "facebook";

const handleOAuthSignIn = async (provider: OAuthProvider) => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) {
    console.error("OAuth error:", error);
  }
};

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
<div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">atau masuk dengan</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => handleOAuthSignIn("google")}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => handleOAuthSignIn("apple")}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="currentColor">
                  <path d="M12.152 6.896c-.948 0-2.415-1.178-3.96-1.178-2.825 0-4.464 2.066-4.464 4.146 0 2.034 1.35 3.433 2.891 3.433.963 0 1.74-.634 2.844-.94 1.166.458 2.647 1.035 3.853 1.035 2.587 0 4.778-1.83 4.778-4.997 0-2.385-1.65-3.966-3.878-3.966-1.334 0-2.59.543-3.498.934-.786-.543-1.747-.934-2.855-.934zM8.687 0c-2.196 0-4.137 1.807-4.137 4.138 0 2.051 1.478 4.188 3.728 4.188.958 0 1.796-.337 2.404-.772.679.572 1.694 1.255 2.866 1.255 2.198 0 3.937-1.91 3.937-4.188 0-2.063-1.478-3.937-3.937-3.937-1.224 0-2.27.478-2.95.998-.665-.434-1.488-.798-2.398-.798z"/>
                </svg>
                Apple
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
