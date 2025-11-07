import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './features/dashboard/Dashboard';
import NewExpense from './features/expenses/NewExpense';
import ExpensesMonth from './features/expenses/ExpensesMonth';
import Taxes from './features/taxes/Taxes';
import Settings from './features/settings/Settings';
import NewReservation from './features/reservations/NewReservation';
import ReservationsMonth from './features/reservations/ReservationsMonth';

// Helper to get current month in YYYY-MM format
function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function App() {
  return (
    <Routes>
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
