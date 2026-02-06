import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginApi } from "../services/authApi";
import { authStorage } from "../storage/authStorage";

export default function LoginPage() {
  const nav = useNavigate();
  const location = useLocation() as any;

  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!userName || !password) {
      setError("Nhập đủ userName / password.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginApi({ userName, password });
      authStorage.setAccessToken(res.accessToken);
      authStorage.setRefreshToken(res.refreshToken);
      authStorage.setExpiresIn(res.expiresIn);
      authStorage.setIsAdmin(res.isAdmin);
      authStorage.setUserId(res.userId);
      authStorage.setIsProUser(res.isProUser);
      authStorage.setUsername(userName);
      
      const to = location?.state?.from || "/home";
      nav(to, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cf-paper">
      <div className="cf-titlebar">
        <div>
          <div className="cf-title">Login</div>
          <div className="cf-subtitle">Enter your credentials to access the system</div>
        </div>
      </div>

      <div className="cf-content">
        <form onSubmit={onSubmit}>
          <div className="form-row" style={{ marginBottom: 12 }}>
            <label className="label" style={{ minWidth: 100 }}>Username</label>
            <input className="input" value={userName} onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div className="form-row" style={{ marginBottom: 12 }}>
            <label className="label" style={{ minWidth: 100 }}>Password</label>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </div>

          {error && <div className="alert alert--bad" style={{ marginBottom: 12 }}>{error}</div>}

          <div className="form-row">
            <button className="btn btn--primary" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        <div className="hint" style={{ marginTop: 12 }}>
          Chưa có tài khoản? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}
