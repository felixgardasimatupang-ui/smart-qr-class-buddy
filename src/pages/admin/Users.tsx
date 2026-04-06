import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, UserCog, UserPlus, Info } from "lucide-react";

interface UserWithRole {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<UserWithRole[]>([]);
    const [open, setOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<{ id: string; email: string; role: string } | null>(null);
    const [newUserRole, setNewUserRole] = useState<"admin" | "student" | "parent">("student");
    const { toast } = useToast();

    const fetchUsers = async () => {
        const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
        const { data: roles } = await supabase.from("user_roles").select("user_id, role");
        const usersWithRoles: UserWithRole[] = [];

        if (profiles && !profilesError) {
            for (const profile of profiles) {
                const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: profile.user_id });
                usersWithRoles.push({ id: profile.user_id, email: "", full_name: profile.full_name || "-", role: roleData || "No role", created_at: profile.created_at });
            }
        }
        if (roles) {
            const existingIds = new Set(usersWithRoles.map(u => u.id));
            roles.forEach(r => {
                if (!existingIds.has(r.user_id)) {
                    usersWithRoles.push({ id: r.user_id, email: "", full_name: "-", role: r.role, created_at: new Date().toISOString() });
                }
            });
        }
        setUsers(usersWithRoles);
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleUpdateRole = async (userId: string, newRole: string) => {
        await supabase.from("user_roles").delete().eq("user_id", userId);
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as "admin" | "student" | "parent" });
        if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
        toast({ title: "Role Diupdate!", description: "Akses identitas pengguna berhasil diubah." });
        setOpen(false); setSelectedUser(null); fetchUsers();
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm("Cabut seluruh akses pengguna ini dalam sistem (hapus role)?")) return;
        await supabase.from("user_roles").delete().eq("user_id", id);
        toast({ title: "Akses Dicabut", description: "Role sistem pengguna berhasil dihilangkan. Hapus manual dari dashboard Supabase untuk kill email seutuhnya." });
        fetchUsers();
    };

    const roleBadge = (role: string) => {
        const map: Record<string, { label: string; className: string }> = {
            admin: { label: "Administrator", className: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 font-bold" },
            student: { label: "Siswa Aktif", className: "bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold" },
            parent: { label: "Orang Tua Wali", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold" },
        };
        const r = map[role] || { label: role, className: "bg-gray-500/10 text-gray-600 border-gray-500/20" };
        return <Badge variant="outline" className={`px-2.5 py-0.5 ${r.className}`}>{r.label}</Badge>;
    };

    return (
        <div className="animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                            <UserCog className="h-5 w-5 text-cyan-600" />
                        </div>
                        Kelola Autentikasi Pengguna
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium pl-12 text-balance">
                        Tentukan klasifikasi peran pengguna antara *Admin*, *Siswa*, dan *Orang Tua*.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="glass-card shadow-sm rounded-full flex-1 sm:flex-none">
                                <UserCog className="mr-2 h-4 w-4" /> Atur Role Cepat
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md glass-card border-0">
                            <DialogHeader>
                                <DialogTitle className="text-xl">Modifikasi Role Pengguna</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-5 mt-2">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground">Pilih Identitas Akun</Label>
                                    <Select onValueChange={(v) => setSelectedUser(JSON.parse(v))}>
                                        <SelectTrigger className="h-12 bg-background/50 border-white/10"><SelectValue placeholder="Pilih yang relevan..." /></SelectTrigger>
                                        <SelectContent>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={JSON.stringify({ id: user.id, email: user.email, full_name: user.full_name, role: user.role })}>
                                                    <span className="font-semibold">{user.full_name}</span> - <span className="text-muted-foreground ml-1 text-xs">{user.role}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground">Klasifikasi Baru</Label>
                                    <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as any)}>
                                        <SelectTrigger className="h-12 bg-background/50 border-white/10"><SelectValue placeholder="Pilih role..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Administrator Sistem</SelectItem>
                                            <SelectItem value="student">Siswa Bimbingan</SelectItem>
                                            <SelectItem value="parent">Wali Orang Tua Siswa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={() => { if (selectedUser) handleUpdateRole(selectedUser.id, newUserRole); }} className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 pt-1 mt-4 text-base font-bold shadow-lg shadow-cyan-500/20">
                                    Berikan Hak Akses
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button className="bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-500/20 text-white rounded-full flex-1 sm:flex-none" onClick={() => window.open('/auth', '_blank')}>
                        <UserPlus className="mr-2 h-4 w-4" /> Daftarkan di Port
                    </Button>
                </div>
            </div>

            <Card className="glass-card border-0 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-cyan-500/5">
                            <TableRow className="border-b-cyan-500/10">
                                <TableHead className="font-bold text-cyan-900/50 dark:text-cyan-100/50">Profil / Nama Akun</TableHead>
                                <TableHead className="font-bold text-cyan-900/50 dark:text-cyan-100/50">Kredensial Login</TableHead>
                                <TableHead className="font-bold text-cyan-900/50 dark:text-cyan-100/50">Hak Sistem / Role</TableHead>
                                <TableHead className="font-bold text-cyan-900/50 dark:text-cyan-100/50">Tanggal Daftar</TableHead>
                                <TableHead className="text-right font-bold text-cyan-900/50 dark:text-cyan-100/50 pr-6">Alat</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-16 font-medium">Sistem bersih. Belum ada entitas user.</TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id} className="border-b-white/5 hover:bg-cyan-500/5">
                                        <TableCell className="font-bold text-base py-4">{user.full_name || "-"}</TableCell>
                                        <TableCell className="font-medium text-muted-foreground">{user.email || "-"}</TableCell>
                                        <TableCell>{roleBadge(user.role)}</TableCell>
                                        <TableCell className="text-sm font-medium text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2 pr-6">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="hover:bg-primary/20 hover:text-primary rounded-full transition-colors"><Pencil className="h-4 w-4" /></Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-sm glass-card border-0">
                                                    <DialogHeader><DialogTitle>Quick Edit Role</DialogTitle></DialogHeader>
                                                    <div className="space-y-4">
                                                        <div className="p-3 bg-secondary rounded-xl text-sm">
                                                          <span className="block font-bold mb-1">{user.full_name}</span>
                                                          <code className="text-xs text-muted-foreground">ID: {user.id.slice(0, 16)}...</code>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs uppercase font-bold text-muted-foreground">Pilih Mutasi Role</Label>
                                                            <Select defaultValue={user.role} onValueChange={(v) => handleUpdateRole(user.id, v)}>
                                                                <SelectTrigger className="h-10 bg-background/50 border-white/10"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="admin">Admin C-Level</SelectItem>
                                                                    <SelectItem value="student">Siswa Pelajar</SelectItem>
                                                                    <SelectItem value="parent">Wali Murid</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <Button onClick={() => handleUpdateRole(user.id, user.role === 'admin' ? 'student' : 'admin')} className="w-full text-base font-bold shadow-lg mt-2">Flip Switch to Mutate</Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                            <Button variant="ghost" size="icon" className="hover:bg-destructive/20 hover:text-destructive rounded-full transition-colors" onClick={() => handleDeleteUser(user.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="mt-8 p-4 glass-card border flex items-start gap-4">
               <div className="w-10 h-10 shrink-0 bg-blue-500/20 text-blue-600 rounded-full flex items-center justify-center">
                  <Info className="w-5 h-5" />
               </div>
                <div className="text-sm font-medium text-muted-foreground/90 leading-relaxed">
                    <p className="font-bold text-foreground mb-1 text-base">Panduan Autentikasi Pengguna</p>
                    Sebagai Admin, Anda dapat menambahkan pengguna baru ke ekosistem BimbelAbsen melalui menu pendaftaran luar.<br/>
                    Supabase Auth menangani manajemen logaritma secara solid. Setelah pembuatan akun, Anda bisa kembali kesini untuk *binding* role menjadi siswa atau orang tua. 
                </div>
            </div>
        </div>
    );
}
