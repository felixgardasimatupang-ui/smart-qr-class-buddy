import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export default function ProfilePage() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Profil</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><User className="h-5 w-5" />Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{user?.email}</p></div>
          <div><p className="text-sm text-muted-foreground">Role</p><p className="font-medium capitalize">{role || "-"}</p></div>
          <Button variant="destructive" className="w-full mt-4" onClick={async () => { await signOut(); navigate("/auth"); }}>
            <LogOut className="mr-2 h-4 w-4" />Keluar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
