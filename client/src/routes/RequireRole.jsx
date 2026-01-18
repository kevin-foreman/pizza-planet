import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function routeForRole(role) {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff/orders";
  return "/menu";
}

export default function RequireRole({ role, children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={routeForRole(user.role)} replace />;

  return children;
}
