import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from './ui/Loader.jsx';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader text="Authenticating..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  return children;
}