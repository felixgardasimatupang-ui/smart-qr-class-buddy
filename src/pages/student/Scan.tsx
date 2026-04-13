import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { QrCode, CheckCircle, Smartphone, Camera, Sparkles } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";

export default function StudentScan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    setScanning(true);
    setResult(null);
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scanner.stop();
          scannerRef.current = null;
          setScanning(false);
          await handleScan(decodedText);
        },
        () => {}
      );
    } catch {
      toast({ title: "Error", description: "Tidak dapat mengakses kamera smartphone Anda", variant: "destructive" });
      setScanning(false);
    }
  };

  const handleScan = async (qrCode: string) => {
    if (!user) return;
    const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single();
    if (!student) { toast({ title: "Error", description: "Data siswa tidak ditemukan", variant: "destructive" }); return; }

    const { data: session } = await supabase.from("sessions").select("id").eq("qr_code", qrCode).eq("status", "active").single();
    if (!session) { toast({ title: "Error", description: "Sesi tidak ditemukan atau tidak aktif", variant: "destructive" }); return; }

    const { error } = await supabase.from("attendance").upsert({
      session_id: session.id,
      student_id: student.id,
      status: "hadir",
      scanned_at: new Date().toISOString(),
    }, { onConflict: "session_id,student_id" });

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setResult("Absensi Berhasil! ✅");
    toast({ title: "Berhasil!", description: "Kehadiran Anda telah tercatat di sistem." });
  };

  useEffect(() => {
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-md mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="text-center space-y-2 mt-4 mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-primary/20 to-purple-500/20 mb-2">
           <QrCode className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Scan Kehadiran</h1>
        <p className="text-sm text-muted-foreground max-w-[250px] mx-auto font-medium">Arahkan kamera ke QR Code sesi kelas yang aktif.</p>
      </div>

      {result ? (
        <Card className="glass-card overflow-hidden border-0 shadow-2xl relative text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--success))]/10 to-transparent"></div>
          <CardContent className="py-12 relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-[hsl(var(--success))]/20 rounded-full flex items-center justify-center mb-6 animate-in zoom-in spin-in-12 duration-700 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
               <CheckCircle className="h-12 w-12 text-[hsl(var(--success))]" />
            </div>
            <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--success))] to-emerald-500">{result}</p>
            <p className="text-muted-foreground text-sm font-medium mt-2">Data absensi telah masuk ke sistem pusat.</p>
            
            <Button onClick={() => { setResult(null); startScanner(); }} className="mt-8 rounded-full px-8 shadow-lg" variant="outline">
              <QrCode className="mr-2 h-4 w-4" /> Scan Code Lain
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card border-0 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500 z-20"></div>
          <CardContent className="p-0">
            <div className="bg-black/5 relative aspect-square w-full">
              <div id="qr-reader" className="w-full h-full [&>img]:hidden [&>div]:border-0 rounded-t-xl overflow-hidden shadow-inner" />
              
              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10 p-6 text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-4 rotate-12">
                     <Camera className="w-10 h-10 text-primary -rotate-12" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">Kamera Siap</h3>
                  <p className="text-sm text-muted-foreground font-medium mb-6">Pastikan pencahayaan cukup dan izinkan akses kamera</p>
                  
                  <Button
                    onClick={startScanner}
                    size="lg"
                    className="w-full rounded-2xl h-14 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl shadow-primary/20 text-md font-bold"
                  >
                    <Smartphone className="mr-2 h-5 w-5" /> Buka Kamera
                  </Button>
                </div>
              )}

              {/* Scanning visual overlay */}
              {scanning && <div className="absolute inset-0 border-4 border-primary/50 m-8 rounded-3xl z-10 pointer-events-none"></div>}
              {scanning && <div className="absolute top-1/2 left-8 right-8 h-1 bg-primary z-10 shadow-[0_0_10px_rgba(100,100,255,0.8)] animate-[float_2s_ease-in-out_infinite] pointer-events-none"></div>}
            </div>
            
            {scanning && (
               <div className="p-4 flex items-center justify-center gap-2 text-sm font-semibold text-primary animate-pulse">
                 <Sparkles className="w-4 h-4" /> Sedang memindai QR Code...
               </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
