import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchUsersByPrefix } from "../services/reviewerApi";

export default function UsersListPage() {
  const nav = useNavigate();
  const [users, setUsers] = useState<{ id: number; username: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPrefix, setSearchPrefix] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await searchUsersByPrefix(searchPrefix.trim());
        if (alive) {
          setUsers(res.data ?? []);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }, 300);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [searchPrefix]);

  return (
    <div className="cf-page">
      <div className="cf-paper">
        <div className="cf-titlebar">
          <div>
            <div className="cf-title">Users</div>
            <div className="cf-subtitle">Browse all users</div>
          </div>
        </div>

        <div className="cf-content">
          <input
            className="input"
            placeholder="Search username..."
            value={searchPrefix}
            onChange={(e) => setSearchPrefix(e.target.value)}
            style={{ width: "100%", marginBottom: 16 }}
          />

          {loading ? (
            <div className="hint">Loading...</div>
          ) : users.length === 0 ? (
            <div className="hint">No users found</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <a
                        onClick={() => nav(`/user/${u.username}`)}
                        style={{ cursor: "pointer" }}
                      >
                        {u.username}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}