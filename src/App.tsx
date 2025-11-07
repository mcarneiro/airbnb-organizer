import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
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

// Helper to get current month in YYYY-MM format
function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function App() {
  const navigate = useNavigate();
  const sheetId = useAppSelector(state => state.settings.sheetId);

  // Initialize data sync (loads and auto-saves data)
  useDataSync();

  // Check if we need onboarding (just need sheet ID, client ID is in config)
  const needsOnboarding = !sheetId;

  // Redirect to onboarding if not set up
  useEffect(() => {
    if (needsOnboarding && window.location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [needsOnboarding, navigate]);

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/" element={<Layout><Dashboard /></Layout>} />
      <Route path="/expenses" element={<Navigate to={`/expenses/${getCurrentMonth()}`} replace />} />
      <Route path="/expenses/new" element={<NewExpense />} />
      <Route path="/expenses/:month" element={<ExpensesMonth />} />
      <Route path="/taxes" element={<Layout><Taxes /></Layout>} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/reservations/new" element={<NewReservation />} />
      <Route path="/reservations/:month" element={<ReservationsMonth />} />
    </Routes>
  );
}

export default App;
