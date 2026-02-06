import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerApi } from "../services/authApi";

export default function RegisterPage() {
  const nav = useNavigate();
  const [userName, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!userName || !email || !password) {
      setError("Nhập đủ username / email / password.");
      return;
    }

    setLoading(true);
    try {
      const res = await registerApi({ userName, email, password });
      setSuccess(`Đăng ký OK: userId=${res.userId}`);
      // đưa về login sau 800ms cho dễ nhìn
      setTimeout(() => nav("/login"), 800);
    } catch (err: any) {
      setError(err?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Register</h1>

        <form onSubmit={onSubmit} className="form">
          <label className="label">
            Username
            <input className="input" value={userName} onChange={(e) => setUsername(e.target.value)} />
          </label>

          <label className="label">
            Email
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </label>

          <label className="label">
            Password
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </label>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="muted">
          Đã có tài khoản? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
