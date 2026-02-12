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
import { useKioskIdleTimeout } from './hooks';
import { ErrorBoundary } from './components/ErrorBoundary';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showIdleWarning, setShowIdleWarning] = useState(false);

  // Handle kiosk idle timeout
  const handleIdleWarning = useCallback((secondsRemaining: number) => {
    setShowIdleWarning(true);
  }, []);

  const handleIdleLogout = useCallback(() => {
    setShowIdleWarning(false);
    navigate('/kiosk');
  }, [navigate]);

  const { resetTimer } = useKioskIdleTimeout({
    enabled: !!user?.isKiosk,
    timeoutMs: 15 * 60 * 1000, // 15 minutes
    onWarning: handleIdleWarning,
    onLogout: handleIdleLogout,
  });

  // Dismiss warning and reset timer
  const handleDismissWarning = useCallback(() => {
    setShowIdleWarning(false);
    resetTimer();
  }, [resetTimer]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      {children}
      {/* Kiosk idle warning modal */}
      {showIdleWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 text-center shadow-xl">
            <div className="text-4xl mb-4">⏰</div>
            <h2 className="text-xl font-bold mb-2">Still there?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You'll be logged out in 1 minute due to inactivity.
            </p>
            <button
              onClick={handleDismissWarning}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              I'm still here
            </button>
          </div>
        </div>
      )}
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
