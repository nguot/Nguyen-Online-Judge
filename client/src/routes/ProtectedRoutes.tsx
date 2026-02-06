import { Navigate, Outlet } from "react-router-dom";
import { isLoggedIn } from "../storage/authStorage";

export default function ProtectedRoutes() {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return <Outlet />;
}
