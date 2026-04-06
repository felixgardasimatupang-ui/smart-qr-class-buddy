import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Analytics } from "@vercel/analytics/react";

// Lazy loading components
const AdminLayout = lazy(() => import("@/components/layouts/AdminLayout"));
const MobileLayout = lazy(() => import("@/components/layouts/MobileLayout"));
const Auth = lazy(() => import("@/pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminStudents = lazy(() => import("@/pages/admin/Students"));
const AdminClasses = lazy(() => import("@/pages/admin/Classes"));
const AdminSessions = lazy(() => import("@/pages/admin/Sessions"));
const AdminEvaluations = lazy(() => import("@/pages/admin/Evaluations"));
const AdminReports = lazy(() => import("@/pages/admin/Reports"));

// Student pages
const StudentHome = lazy(() => import("@/pages/student/Home"));
const StudentScan = lazy(() => import("@/pages/student/Scan"));
const StudentHistory = lazy(() => import("@/pages/student/History"));

// Parent pages
const ParentDashboard = lazy(() => import("@/pages/parent/Dashboard"));
const ParentRecap = lazy(() => import("@/pages/parent/Recap"));
const ParentGrades = lazy(() => import("@/pages/parent/Grades"));
const ProfilePage = lazy(() => import("@/pages/Profile"));

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
    <Loader2 className="w-10 h-10 text-primary animate-spin" />
    <p className="text-sm font-medium text-muted-foreground animate-pulse">Memuat halaman...</p>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<Navigate to="/auth" replace />} />
              <Route path="/auth" element={<Auth />} />

              <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="students" element={<AdminStudents />} />
                <Route path="classes" element={<AdminClasses />} />
                <Route path="sessions" element={<AdminSessions />} />
                <Route path="evaluations" element={<AdminEvaluations />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              <Route path="/student" element={<ProtectedRoute allowedRoles={["student"]}><MobileLayout /></ProtectedRoute>}>
                <Route index element={<StudentHome />} />
                <Route path="scan" element={<StudentScan />} />
                <Route path="history" element={<StudentHistory />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              <Route path="/parent" element={<ProtectedRoute allowedRoles={["parent"]}><MobileLayout /></ProtectedRoute>}>
                <Route index element={<ParentDashboard />} />
                <Route path="recap" element={<ParentRecap />} />
                <Route path="grades" element={<ParentGrades />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
      <Analytics />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
