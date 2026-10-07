// Redirige al login si no hay token
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
