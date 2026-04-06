import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/layouts/AdminLayout";
import MobileLayout from "@/components/layouts/MobileLayout";
import Auth from "@/pages/Auth";
import NotFound from "./pages/NotFound.tsx";

import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminStudents from "@/pages/admin/Students";
import AdminClasses from "@/pages/admin/Classes";
import AdminSessions from "@/pages/admin/Sessions";
import AdminEvaluations from "@/pages/admin/Evaluations";
import AdminReports from "@/pages/admin/Reports";

import StudentHome from "@/pages/student/Home";
import StudentScan from "@/pages/student/Scan";
import StudentHistory from "@/pages/student/History";

import ParentDashboard from "@/pages/parent/Dashboard";
import ParentRecap from "@/pages/parent/Recap";
import ParentGrades from "@/pages/parent/Grades";
import ProfilePage from "@/pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
