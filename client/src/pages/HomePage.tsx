import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authStorage } from "../storage/authStorage";
import { logoutApi } from "../services/authApi";

export default function HomePage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const accessToken = authStorage.getAccessToken();
  const refreshToken = authStorage.getRefreshToken();
  const expiresIn = authStorage.getExpiresIn();
  const isAdmin = authStorage.getIsAdmin();

  async function onLogout() {
    setErr(null);
    setLoading(true);
    try {
      const rt = authStorage.getRefreshToken();
      if (rt) await logoutApi({ refreshToken: rt });
    } catch (e: any) {
      // logout fail vẫn clear local cho user thoát
      setErr(e?.message || "Logout failed");
    } finally {
      authStorage.clearAll();
      setLoading(false);
      nav("/login", { replace: true });
    }
  }

  return (
    <div className="page">
      {/* <div className="card">
        <div className="row">
          <h1 className="title">Home</h1>
          <button className="btn btn-secondary" onClick={onLogout} disabled={loading}>
            {loading ? "Logging out..." : "Logout"}
          </button>
        </div>

        {err && <div className="alert alert-error">{err}</div>}

        <div className="kv">
          <div className="k">isAdmin</div>
          <div className="v">{String(isAdmin)}</div>

          <div className="k">expiresIn</div>
          <div className="v">{expiresIn ?? "null"}</div>

          <div className="k">accessToken</div>
          <div className="v mono">{accessToken ? accessToken.slice(0, 32) + "..." : "null"}</div>

          <div className="k">refreshToken</div>
          <div className="v mono">{refreshToken ? refreshToken.slice(0, 32) + "..." : "null"}</div>
        </div>
      </div> */}
    </div>
  );
}
