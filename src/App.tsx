import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import Dashboard from './features/dashboard/Dashboard';
import NewExpense from './features/expenses/NewExpense';
import ExpensesMonth from './features/expenses/ExpensesMonth';
import Taxes from './features/taxes/Taxes';
import Settings from './features/settings/Settings';
import NewReservation from './features/reservations/NewReservation';
import ReservationsMonth from './features/reservations/ReservationsMonth';
import Onboarding from './features/onboarding/Onboarding';
import { useAppSelector } from './store/hooks';
import { useDataSync } from './hooks/useDataSync';
import { useGoogleAuth } from './contexts/GoogleAuthContext';

// Helper to get current month in YYYY-MM format
function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const sheetId = useAppSelector(state => state.settings.sheetId);
  const authInitialized = useAppSelector(state => state.app.authInitialized);
  const dataLoading = useAppSelector(state => state.app.dataLoading);
  const dataLoaded = useAppSelector(state => state.app.dataLoaded);
  const { isSignedIn, sessionExpired, clearSessionExpired } = useGoogleAuth();

  // Initialize data sync (loads and auto-saves data)
  useDataSync();

  // Centralized navigation logic - single source of truth
  // IMPORTANT: This useEffect must be called before any early returns (Rules of Hooks)
  useEffect(() => {
    // Skip navigation if still initializing
    if (!authInitialized) return;

    const isOnboarding = location.pathname === '/onboarding';
    const isAppReady = isSignedIn && sheetId;

    // Case 1: User is signed in with sheetId but on onboarding page → go to dashboard
    if (isAppReady && isOnboarding) {
      navigate('/', { replace: true });
      return;
    }

    // Case 2: User needs setup (not signed in OR no sheetId) and NOT on onboarding → go to onboarding
    if (!isAppReady && !isOnboarding) {
      navigate('/onboarding', { replace: true });
      return;
    }
  }, [authInitialized, isSignedIn, sheetId, location.pathname, navigate]);

  // Show loading screen while auth is initializing or while loading initial data
  // This early return is AFTER all hooks are called (satisfies Rules of Hooks)
  if (!authInitialized || (isSignedIn && sheetId && !dataLoaded && dataLoading)) {
    return <LoadingScreen />;
  }

  return (
    <>
      {/* Session Expired Notification */}
      {sessionExpired && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-3 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold">Session Expired</p>
                <p className="text-sm">Your session has expired. Please sign in again to continue.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearSessionExpired}
                className="ml-2 text-white hover:text-yellow-100 transition-colors"
                aria-label="Dismiss notification"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/expenses" element={<Navigate to={`/expenses/${getCurrentMonth()}`} replace />} />
        <Route path="/expenses/new/:month" element={<NewExpense />} />
        <Route path="/expenses/:month" element={<Layout><ExpensesMonth /></Layout>} />
        <Route path="/taxes/:month?" element={<Layout><Taxes /></Layout>} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/reservations/new/:month" element={<Layout><NewReservation /></Layout>} />
        <Route path="/reservations/:month" element={<Layout><ReservationsMonth /></Layout>} />
      </Routes>
    </>
  );
}

export default App;
