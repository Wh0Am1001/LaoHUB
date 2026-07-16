import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/ui/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute, GuestOnlyRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const EditProfilePage = lazy(() => import('./pages/profile/EditProfilePage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));

function PageFallback() {
  return (
    <div className="min-h-[50svh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />

                <Route element={<GuestOnlyRoute />}>
                  <Route element={<AuthLayout />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  </Route>
                </Route>

                <Route element={<AuthLayout />}>
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/feed" element={<FeedPage />} />
                    <Route path="/profile/edit" element={<EditProfilePage />} />
                    <Route path="/profile/:username" element={<ProfilePage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
            <ToastContainer />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
