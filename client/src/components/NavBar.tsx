import { NavLink, useNavigate } from "react-router-dom";
import { authStorage, getIsAdmin, isLoggedIn } from "../storage/authStorage";
import "./ui.css";

export default function NavBar() {
  const nav = useNavigate();
  const logged = isLoggedIn();
  const isAdmin = getIsAdmin();
  const username = authStorage.getUsername();

  const onLogout = () => {
    authStorage.clear();
    nav("/login");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) => (isActive ? "active" : "");

  return (
    <div className="cf-topbar">
      <div className="cf-topbar__inner">
        <a
          className="cf-logo"
          href="/home"
          onClick={(e) => {
            e.preventDefault();
            nav("/home");
          }}
        >
          <span className="cf-logo__dots">
            <span />
            <span />
            <span />
          </span>
          <span className="cf-logo__text">CP Platform</span>
        </a>

        <div className="cf-menu">
          <NavLink to="/home" className={linkClass}>
            HOME
          </NavLink>

          <NavLink to="/problems" className={linkClass}>
            PROBLEMSET
          </NavLink>

          <NavLink to="/sandbox" className={linkClass}>
            SANDBOX
          </NavLink>

          {/* ✅ Contest */}
          <NavLink to="/contests/draft" className={linkClass}>
            CONTESTS (DRAFT)
          </NavLink>

          <NavLink to="/contests/official" className={linkClass}>
            CONTESTS (OFFICIAL)
          </NavLink>

          <NavLink to="/groups" className={linkClass}>
            GROUPS
          </NavLink>
          <NavLink to="/users" className={linkClass}>
            USERS
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              ADMIN
            </NavLink>
          )}

        </div>

        <div className="cf-user">
          {<NavLink
            to={"/user/" + username}
            className="badge"
            style={{ cursor: "pointer" }}
          >
            {username}
          </NavLink>
          }

          {logged ? (
            <button className="btn btn--primary" onClick={onLogout}>
              Logout
            </button>
          ) : (
            <button className="btn btn--primary" onClick={() => nav("/login")}>
              Login
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
