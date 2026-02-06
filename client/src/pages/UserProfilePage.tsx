// src/pages/UserProfilePage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  inviteFriend,
  getInvitationList,
  actionInvitation,
  listFriends,
  unfriend,
} from "../services/friendApi";

import { searchUsersByPrefix } from "../services/reviewerApi";


import UserSubmissionsTab from "../components/UserSubmissionTab";

import {
  getUserProfile,
  getUserRatingHistory,
  type UserDetailDto,
  type UserContestRatingHistoryItemDto,
} from "../services/userProfileApi";

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const nav = useNavigate();
  const [user, setUser] = useState<UserDetailDto | null>(null);
  const [history, setHistory] = useState<UserContestRatingHistoryItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  const chartData = history.map((h, idx) => ({
    name: `#${idx + 1}`,      // hoặc contestId
    rating: h.newRating,
    delta: h.delta,
  }));

  const [activeTab, setActiveTab] = useState<"info" | "submissions">("info");
  // ===== FRIEND =====
  const [friendTab, setFriendTab] = useState<"info" | "submissions" | "friends">("info");

  const [invitations, setInvitations] = useState<
    { friendId: number; friendName: string }[]
  >([]);

  const [friends, setFriends] = useState<
    { friendId: number; friendName: string; rating: number }[]
  >([]);

  // ===== SEARCH USER TO ADD FRIEND =====
  const [searchPrefix, setSearchPrefix] = useState("");
  const [searching, setSearching] = useState(false);
  const [userResults, setUserResults] = useState<
    { id: number; username: string }[]
  >([]);


  async function loadFriends() {
    const page = await listFriends({
      maxResultCount: 50,
      skipCount: 0,
      filter: {},
    });
    setFriends(page.data);
  }


  useEffect(() => {
    if (!searchPrefix.trim()) {
      setUserResults([]);
      return;
    }

    let alive = true;
    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const res = await searchUsersByPrefix(searchPrefix.trim());
        if (alive) {
          setUserResults(res.data ?? []);
        }
      } finally {
        if (alive) setSearching(false);
      }
    }, 300); // debounce 300ms

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [searchPrefix]);


  useEffect(() => {
    let alive = true;

    async function loadInvites() {
      try {
        const res = await getInvitationList();
        if (alive) setInvitations(res);
      } catch { }
    }

    loadInvites();
    const timer = setInterval(loadInvites, 5000);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);


  useEffect(() => {
    if (!username) return;
    const u = username;
    async function load() {
      setLoading(true);
      try {
        const profile = await getUserProfile(u);
        setUser(profile);

        const ratingHistory = await getUserRatingHistory(profile.userId);
        setHistory(ratingHistory);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [username]);


  if (loading) return <div className="cf-page">Loading...</div>;
  if (!user) return <div className="cf-page">User not found</div>;

  return (
    <div className="cf-page">
      {/* ===== TAB BAR ===== */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          className={`btn ${friendTab === "info" ? "btn--primary" : ""}`}
          onClick={() => setActiveTab("info")}
        >
          Info
        </button>

        <button
          className={`btn ${activeTab === "submissions" ? "btn--primary" : ""}`}
          onClick={() => setActiveTab("submissions")}
        >
          Submissions
        </button>

        <button
          className={`btn ${friendTab === "friends" ? "btn--primary" : ""}`}
          onClick={() => {
            setFriendTab("friends");
            loadFriends();
          }}
        >
          Friends
        </button>
      </div>


      {/* ===== INFO TAB ===== */}
      {activeTab === "info" && (
        <>
          {/* USER INFO */}
          <div className="box" style={{ display: "flex", gap: 24 }}>
            <img
              src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user.userName}`}
              alt="avatar"
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "#f3f4f6",
              }}
            />

            {/* ===== SEARCH USER TO ADD FRIEND ===== */}
            <div className="box" style={{ marginTop: 24 }}>
              <div className="box__head">Add friend</div>
              <div className="box__body">
                <input
                  className="input"
                  placeholder="Search username..."
                  value={searchPrefix}
                  onChange={(e) => setSearchPrefix(e.target.value)}
                />

                {searching && <div className="hint">Searching...</div>}

                {userResults.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <span>{u.username}</span>

                    <button
                      className="btn"
                      onClick={async () => {
                        try {
                          await inviteFriend(u.id);
                          alert("Invitation sent");
                        } catch (e) {
                          console.error(e);
                          alert("Invite failed");
                        }
                      }}
                    >
                      Add friend
                    </button>
                  </div>
                ))}

                {!searching && searchPrefix && userResults.length === 0 && (
                  <div className="hint">No users found</div>
                )}
              </div>
            </div>


          </div>

          {/* RATING HISTORY */}
          <div className="box" style={{ marginTop: 24 }}>
            <div className="box__head">Rating history</div>

            {history.length > 0 && (
              <div style={{ height: 280, padding: "16px 0" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="rating"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="box__body">
              {history.length === 0 ? (
                <div className="hint">No contest participated</div>
              ) : (
                <table className="cf-table">
                  <thead>
                    <tr>
                      <th>Contest</th>
                      <th>New rating</th>
                      <th>Δ</th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.map((h) => (
                      <tr key={h.contestId}>
                        <td>
                          <a
                            onClick={() =>
                              nav(`/contests/official/${h.contestId}`)
                            }
                            style={{ cursor: "pointer" }}
                          >
                            Contest #{h.contestId}
                          </a>
                        </td>
                        <td>{h.newRating}</td>
                        <td
                          style={{
                            fontWeight: 700,
                            color:
                              h.delta > 0
                                ? "#15803d"
                                : h.delta < 0
                                  ? "#b91c1c"
                                  : "#374151",
                          }}
                        >
                          {h.delta > 0 ? `+${h.delta}` : h.delta}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===== SUBMISSIONS TAB ===== */}
      {activeTab === "submissions" && <UserSubmissionsTab />}

      {friendTab === "friends" && (
        <>
          {/* ===== INVITATIONS ===== */}
          <div className="box">
            <div className="box__head">Friend invitations</div>
            <div className="box__body">
              {invitations.length === 0 ? (
                <div className="hint">No invitations</div>
              ) : (
                invitations.map((inv) => (
                  <div
                    key={inv.friendId}
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <span>{inv.friendName}</span>

                    <button
                      className="btn btn--primary"
                      onClick={async () => {
                        await actionInvitation(inv.friendId, "ACCEPTED");
                        setInvitations((prev) =>
                          prev.filter((x) => x.friendId !== inv.friendId)
                        );
                        loadFriends();
                      }}
                    >
                      Accept
                    </button>

                    <button
                      className="btn btn--danger"
                      onClick={async () => {
                        await actionInvitation(inv.friendId, "DECLINED");
                        setInvitations((prev) =>
                          prev.filter((x) => x.friendId !== inv.friendId)
                        );
                      }}
                    >
                      Decline
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ===== FRIEND LIST ===== */}
          <div className="box" style={{ marginTop: 24 }}>
            <div className="box__head">Friends</div>
            <div className="box__body">
              {friends.length === 0 ? (
                <div className="hint">No friends</div>
              ) : (
                friends.map((f) => (
                  <div
                    key={f.friendId}
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <a onClick={() => nav(`/user/${f.friendName}`)}
                      style={{ cursor: "pointer" }}
                    >
                      {f.friendName} ({f.rating})
                    </a>

                    <button
                      className="btn btn--danger"
                      onClick={async () => {
                        await unfriend(f.friendId);
                        setFriends((prev) =>
                          prev.filter((x) => x.friendId !== f.friendId)
                        );
                      }}
                    >
                      Unfriend
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );

}
