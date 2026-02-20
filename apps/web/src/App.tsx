import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SetupPage } from './pages/SetupPage';
import { CalendarPage } from './pages/CalendarPage';
import { ShoppingPage } from './pages/ShoppingPage';
import { ChoresPage } from './pages/ChoresPage';
import { FamilyPage } from './pages/FamilyPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './api';
import { MessagesPage } from './pages/MessagesPage';
import { KioskLoginPage } from './pages/KioskloginPage';
import { PaidChoresPage } from './pages/PaidChoresPage';
import { BudgetPage } from './pages/BudgetPage';
import { RecipesPage } from './pages/RecipesPage';
import { MealsPage } from './pages/MealsPage';
import { StorePage } from './pages/StorePage';
import { useIdleTimeout, useDayRollover } from './hooks';
import { IdleWarningModal } from './components/common/IdleWarningModal';
import { ErrorBoundary } from './components/ErrorBoundary';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [warningSeconds, setWarningSeconds] = useState(60);

  const isKiosk = !!user?.isKiosk;
  const idleTimeoutMs = isKiosk ? 15 * 60 * 1000 : 30 * 60 * 1000;

  // Handle idle timeout warning
  const handleIdleWarning = useCallback((secondsRemaining: number) => {
    setWarningSeconds(secondsRemaining);
    setShowIdleWarning(true);
  }, []);

  const handleIdleLogout = useCallback(() => {
    setShowIdleWarning(false);
    navigate(isKiosk ? '/kiosk' : '/login');
  }, [navigate, isKiosk]);

  const { resetTimer } = useIdleTimeout({
    enabled: !!user,
    timeoutMs: idleTimeoutMs,
    onWarning: handleIdleWarning,
    onLogout: handleIdleLogout,
  });

  // Dismiss warning and reset timer
  const handleDismissWarning = useCallback(() => {
    setShowIdleWarning(false);
    resetTimer();
  }, [resetTimer]);

  // Auto-reload at midnight to refresh stale data
  useDayRollover();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      {children}
      <IdleWarningModal
        isOpen={showIdleWarning}
        initialSeconds={warningSeconds}
        onDismiss={handleDismissWarning}
        onTimeout={handleIdleLogout}
        sessionType={isKiosk ? 'kiosk' : 'regular'}
      />
    </Layout>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-purple-800 to-rose-400 relative">
      <div className="absolute inset-0 bg-stars pointer-events-none"></div>
      <div className="text-center relative z-10">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shopping"
        element={
          <ProtectedRoute>
            <ShoppingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chores"
        element={
          <ProtectedRoute>
            <ChoresPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/paid-chores"
        element={
          <ProtectedRoute>
            <PaidChoresPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/family"
        element={
          <ProtectedRoute>
            <FamilyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/budgets"
        element={
          <ProtectedRoute>
            <BudgetPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recipes"
        element={
          <ProtectedRoute>
            <RecipesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meals"
        element={
          <ProtectedRoute>
            <MealsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/store"
        element={
          <ProtectedRoute>
            <StorePage />
          </ProtectedRoute>
        }
      />
      <Route path="/kiosk" element={<KioskLoginPage />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppWithBootstrapCheck() {
  const [bootstrapStatus, setBootstrapStatus] = useState<'loading' | 'needed' | 'complete'>(
    'loading',
  );

  const checkBootstrap = async () => {
    try {
      const status = await api.getBootstrapStatus();
      setBootstrapStatus(status.bootstrapped ? 'complete' : 'needed');
    } catch {
      // If we can't reach the API, assume we need setup
      // Or show an error - for now let's try showing login
      setBootstrapStatus('complete');
    }
  };

  useEffect(() => {
    checkBootstrap();
  }, []);

  if (bootstrapStatus === 'loading') {
    return <LoadingScreen />;
  }

  if (bootstrapStatus === 'needed') {
    return <SetupPage onComplete={() => setBootstrapStatus('complete')} />;
  }

  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </AuthProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppWithBootstrapCheck />
    </BrowserRouter>
  );
}

export default App;
