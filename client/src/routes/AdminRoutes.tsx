// src/routes/AdminRoutes.tsx
import { Navigate, Outlet } from "react-router-dom";
import { authStorage } from "../storage/authStorage";

export default function AdminRoutes() {
  if (!authStorage.isLoggedIn()) return <Navigate to="/login" replace />;
  if (!authStorage.getIsAdmin()) return <Navigate to="/" replace />;
  return <Outlet />;
}
