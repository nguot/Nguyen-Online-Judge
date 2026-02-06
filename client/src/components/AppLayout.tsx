import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import "./ui.css";

export default function AppLayout() {
  return (
    <div className="cf-shell">
      <NavBar />
      <div className="cf-page">
        <Outlet />
      </div>
    </div>
  );
}
