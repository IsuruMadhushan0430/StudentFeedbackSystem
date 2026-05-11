import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ children, role, roles }) => {
  const { user, loading } = useContext(AuthContext);

  const allowedRoles = Array.isArray(roles) ? roles : role ? [role] : [];

  if (loading) return <div>Loading...</div>;

  if (!user || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;