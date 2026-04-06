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
  const { role } = useAuth();
  const nav = role === "parent" ? parentNav : studentNav;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 pb-20 overflow-auto">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {nav.map((item) => {
            const active = location.pathname === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => { e.preventDefault(); window.history.pushState({}, "", item.path); window.dispatchEvent(new PopStateEvent("popstate")); }}
                className={cn(
                  "flex flex-col items-center gap-1 text-xs transition-colors py-2 px-3 rounded-lg",
                  active ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", active && "text-primary")} />
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
