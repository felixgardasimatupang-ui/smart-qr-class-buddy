import { Outlet, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Users, UserCog, BookOpen, CalendarCheck, ClipboardList, BarChart3, User, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Kelola User", url: "/admin/users", icon: UserCog },
  { title: "Siswa", url: "/admin/students", icon: Users },
  { title: "Kelas", url: "/admin/classes", icon: BookOpen },
  { title: "Sesi Absensi", url: "/admin/sessions", icon: CalendarCheck },
  { title: "Evaluasi", url: "/admin/evaluations", icon: ClipboardList },
  { title: "Laporan", url: "/admin/reports", icon: BarChart3 },
  { title: "Profil", url: "/admin/profile", icon: User },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" className="border-r border-white/10 bg-card/60 backdrop-blur-xl">
      <SidebarContent>
        <div className="p-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0">
             <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              BimbelAbsen
            </h1>
          )}
        </div>
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-muted-foreground/80 font-semibold mb-2">MENU UTAMA</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="hover:bg-primary/10 hover:text-primary transition-all rounded-lg py-2.5"
                      activeClassName="bg-primary/15 text-primary font-bold shadow-sm"
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="mt-auto p-4 mb-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg py-6"
            onClick={async () => { await signOut(); navigate("/auth"); }}
          >
            <LogOut className="mr-2 h-5 w-5" />
            {!collapsed && <span className="font-semibold">Keluar Sistem</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminLayout() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("user_id", user.id).single()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative selection:bg-primary/30">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center gap-4 border-b border-white/10 glass px-6 z-10 sticky top-0">
            <SidebarTrigger className="hover:bg-primary/10 hover:text-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">Admin Portal</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Manajemen Sistem</span>
            </div>
            {/* Top Right Avatar */}
            <div className="ml-auto">
              <Avatar className="w-9 h-9 border border-primary/20 shadow-sm cursor-pointer hover:border-primary transition-colors">
                <AvatarImage src={profile?.avatar_url} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {profile?.full_name?.charAt(0) || <User className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
