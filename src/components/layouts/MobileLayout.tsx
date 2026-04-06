import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, QrCode, History, User, BarChart3, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const studentNav: NavItem[] = [
  { label: "Home", icon: Home, path: "/student" },
  { label: "Scan", icon: QrCode, path: "/student/scan" },
  { label: "Riwayat", icon: History, path: "/student/history" },
  { label: "Profil", icon: User, path: "/student/profile" },
];

const parentNav: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/parent" },
  { label: "Rekap", icon: BarChart3, path: "/parent/recap" },
  { label: "Nilai", icon: BookOpen, path: "/parent/grades" },
  { label: "Profil", icon: User, path: "/parent/profile" },
];

export default function MobileLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuth();
  const nav = role === "parent" ? parentNav : studentNav;

  return (
    <div className="min-h-screen flex flex-col bg-background relative selection:bg-primary/30">
      <main className="flex-1 pb-24 overflow-auto">
        <Outlet />
      </main>
      
      {/* Floating Modern Navigation Bar */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 pointer-events-none">
        <div className="flex justify-around items-center h-[72px] max-w-sm mx-auto glass rounded-3xl shadow-2xl pointer-events-auto px-2">
          {nav.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center justify-center gap-1 w-16 h-full transition-all duration-300"
              >
                {active && (
                  <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-[0_0_8px_rgba(100,100,255,0.8)]"></div>
                )}
                <div className={cn(
                  "p-2 rounded-2xl transition-all duration-300",
                  active ? "bg-primary/10 text-primary scale-110" : "text-muted-foreground hover:bg-muted"
                )}>
                  <item.icon className={cn("h-6 w-6 stroke-[2.5px]")} />
                </div>
                <span className={cn(
                  "text-[10px] transition-all duration-300",
                  active ? "font-bold text-primary opacity-100" : "font-semibold text-muted-foreground opacity-70"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
