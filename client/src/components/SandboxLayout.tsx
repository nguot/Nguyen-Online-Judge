import { Outlet, Navigate, NavLink } from "react-router-dom";

export default function SandboxLayout() {
  return (
    <div>
      {/* Sandbox Tabs */}
      <div className="sandbox-tabs">
        <NavLink to="problems">Problems</NavLink>
        <NavLink to="contests">Contests</NavLink>
      </div>

      <div className="sandbox-content">
        <Outlet />
      </div>
    </div>
  );
}
