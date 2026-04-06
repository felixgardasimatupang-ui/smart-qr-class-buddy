import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { QrCode, CheckCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

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
    } catch (err: any) {
      toast({ title: "Error", description: "Tidak dapat mengakses kamera", variant: "destructive" });
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
    setResult("Absensi berhasil! ✅");
    toast({ title: "Berhasil!", description: "Kehadiran Anda telah dicatat" });
  };

  useEffect(() => {
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Scan QR Code</h1>
      
      {result ? (
        <Card className="text-center">
          <CardContent className="py-12">
            <CheckCircle className="h-16 w-16 text-[hsl(var(--success))] mx-auto mb-4" />
            <p className="text-lg font-semibold">{result}</p>
            <button className="mt-4 text-primary hover:underline text-sm" onClick={() => { setResult(null); startScanner(); }}>
              Scan lagi
            </button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
            {!scanning && (
              <button
                onClick={startScanner}
                className="mt-4 w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Mulai Scan
              </button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
