import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

// Auth
import LoginPage from './pages/auth/LoginPage';
import ProfilePage from './pages/auth/ProfilePage';

// Supervisor
import SupervisorDashboard from './pages/supervisor/Dashboard';
import StudentsPage from './pages/supervisor/StudentsPage';
import SectionsPage from './pages/supervisor/SectionsPage';
import SubjectsPage from './pages/supervisor/SubjectsPage';
import ExamsPage from './pages/supervisor/ExamsPage';
import SupervisorReportsPage from './pages/supervisor/ReportsPage';

// Manager
import ManagerDashboard from './pages/manager/Dashboard';
import ManagerReportsPage from './pages/manager/ReportsPage';

// Student
import StudentDashboard from './pages/student/Dashboard';
import ExamTakingPage from './pages/student/ExamTakingPage';
import ResultsPage from './pages/student/ResultsPage';
import StudentExamsPage from './pages/student/ExamsPage';

// Guest
import GuestPage from './pages/guest/GuestPage';

import { ReactNode, useState } from 'react';
import { HiOutlineMenu } from 'react-icons/hi';

function DashboardLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 lg:pl-64 pr-0 lg:pr-64 pb-10 transition-all duration-300 print:p-0 print:m-0 print:lg:pr-0">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed top-4 right-4 z-30 p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 shadow-lg"
          aria-label="فتح القائمة الجانبية">
          <HiOutlineMenu className="h-6 w-6" />
        </button>
        <div className="p-4 pt-16 md:p-8 md:pt-8 space-y-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-200">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mb-4" />
        <p className="text-lg">جاري التحميل...</p>
      </div>
    );
  if (!user) return <Navigate to="/login" />;
  const routes: Record<string, string> = {
    supervisor: '/supervisor',
    manager: '/manager',
    student: '/student',
  };
  return <Navigate to={routes[user.role.name] || '/login'} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            border: '1px solid #334155',
          },
        }}
      />
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/guest" element={<GuestPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <HomeRedirect />
              </ProtectedRoute>
            }
          />

          {/* Supervisor */}
          <Route
            path="/supervisor"
            element={
              <ProtectedRoute roles={['supervisor']}>
                <DashboardLayout>
                  <SupervisorDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor/profile"
            element={
              <ProtectedRoute roles={['supervisor']}>
                <DashboardLayout>
                  <ProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor/students"
            element={
              <ProtectedRoute roles={['supervisor']}>
                <DashboardLayout>
                  <StudentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor/sections"
            element={
              <ProtectedRoute roles={['supervisor']}>
                <DashboardLayout>
                  <SectionsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor/subjects"
            element={
              <ProtectedRoute roles={['supervisor']}>
                <DashboardLayout>
                  <SubjectsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor/exams"
            element={
              <ProtectedRoute roles={['supervisor']}>
                <DashboardLayout>
                  <ExamsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor/reports"
            element={
              <ProtectedRoute roles={['supervisor']}>
                <DashboardLayout>
                  <SupervisorReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Manager */}
          <Route
            path="/manager"
            element={
              <ProtectedRoute roles={['manager']}>
                <DashboardLayout>
                  <ManagerDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/profile"
            element={
              <ProtectedRoute roles={['manager']}>
                <DashboardLayout>
                  <ProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/reports"
            element={
              <ProtectedRoute roles={['manager']}>
                <DashboardLayout>
                  <ManagerReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Student */}
          <Route
            path="/student"
            element={
              <ProtectedRoute roles={['student']}>
                <DashboardLayout>
                  <StudentDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exams"
            element={
              <ProtectedRoute roles={['student']}>
                <DashboardLayout>
                  <StudentExamsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exam/:id"
            element={
              <ProtectedRoute roles={['student']}>
                <DashboardLayout>
                  <ExamTakingPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/results"
            element={
              <ProtectedRoute roles={['student']}>
                <DashboardLayout>
                  <ResultsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
