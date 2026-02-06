// OfficialContestDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ContestDetail } from "../../types/contest";
import { authStorage } from "../../storage/authStorage";
import DashboardRankTable from "../../components/DashBoardRankTable";
import { getContestDashboard, getContestDashboardFriend } from "../../services/dashboardApi";
import type { DashboardItem } from "../../services/dashboardApi";
import ContestSubmissionsTab from "../../components/ContestSubmissionTab";


import {
  getContestDetail,
  registerContest,
  unregisterContest,
  searchContestRegistrations,
} from "../../services/contestApi";


function detectIsOfficial(contest?: ContestDetail | null): boolean {
  if (!contest) return false;

  const s = (contest.contestStatus ?? "").toString().toUpperCase();
  const v = (contest.visibility ?? "").toString().toUpperCase();
  const t = (contest.contestType ?? "").toString().toUpperCase();

  if (s.includes("OFFICIAL")) return true;
  if (v.includes("OFFICIAL")) return true;
  if (t.includes("OFFICIAL")) return true;

  if (s === "PUBLISHED" || s === "STARTED" || s === "FINISHED") return true;
  return false;
}

type ContestCountdownProps = {
  startTime: string;
  duration: number; // seconds
};

function ContestCountdown({ startTime, duration }: ContestCountdownProps) {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const start = new Date(startTime).getTime();
  const end = start + duration * 1000;

  if (now < start) return <div>Starts in {Math.ceil((start - now) / 1000)}s</div>;
  if (now <= end) return <div>Ends in {Math.ceil((end - now) / 1000)}s</div>;
  return <div>Finished</div>;
}

export default function OfficialContestDetailPage() {
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();

  const idNum = Number(contestId);
  const [data, setData] = useState<ContestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // register
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [registering, setRegistering] = useState(false);

  // registrations tab
  const [activeTab, setActiveTab] =
    useState<"info" | "registrations" | "dashboard" | "submissions" | "dashboard-friends">("info");


  const [registrations, setRegistrations] = useState<
    Array<{
      contestId: number;
      userId: number;
      userName: string;
      registeredAt: string;
    }>
  >([]);
  const [regLoading, setRegLoading] = useState(false);

  const currentUserId = authStorage.getUserId();
  const isAdmin = authStorage.getIsAdmin();
  const isOfficial = detectIsOfficial(data);

  const isAuthor = useMemo(() => {
    if (!data) return false;
    if (data.authorId == null) return false;
    if (currentUserId == null) return false;
    return data.authorId === currentUserId;
  }, [data, currentUserId]);

  // ===== OFFICIAL + ADMIN (pre-start only) =====
  // GIỮ NGUYÊN LOGIC CŨ (m dặn không đổi)
  const canEditOfficial =
    isOfficial &&
    isAdmin &&
    data?.startTime != null &&
    new Date(data.startTime).getTime() > Date.now();

  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardRefreshing, setDashboardRefreshing] = useState(false);


  const [friendDashboardItems, setFriendDashboardItems] = useState<DashboardItem[]>([]);
  const [friendDashboardLoading, setFriendDashboardLoading] = useState(false);
  const [friendDashboardRefreshing, setFriendDashboardRefreshing] = useState(false);


  async function load() {
    if (!Number.isFinite(idNum)) return;
    setLoading(true);
    try {
      const res = await getContestDetail(idNum);
      setData(res);

      // Official page: check register
      await checkIsRegistered(res).catch(() => { });
    } finally {
      setLoading(false);
    }
  }

  async function checkIsRegistered(contest?: ContestDetail | null) {
    if (!idNum) return;
    if (!currentUserId) return;
    // nếu contest chưa official thì khỏi check
    if (contest && !detectIsOfficial(contest)) return;

    const res = await searchContestRegistrations(idNum, {
      maxResultCount: 1,
      skipCount: 0,
      filter: { userId: currentUserId },
    });

    setIsRegistered((res.data?.length ?? 0) > 0);
  }

  async function onRegister() {
    if (!idNum) return;
    if (!isOfficial) return; // guard
    setRegistering(true);
    try {
      await registerContest(idNum);
      setIsRegistered(true);
    } finally {
      setRegistering(false);
    }
  }

  async function onUnregister() {
    if (!idNum) return;
    if (!isOfficial) return; // guard
    setRegistering(true);
    try {
      await unregisterContest(idNum);
      setIsRegistered(false);
    } finally {
      setRegistering(false);
    }
  }

  async function loadRegistrations() {
    if (!idNum) return;
    setRegLoading(true);
    try {
      const res = await searchContestRegistrations(idNum, {
        maxResultCount: 50,
        skipCount: 0,
        filter: {},
      });
      setRegistrations(res.data);
    } finally {
      setRegLoading(false);
    }
  }

  async function loadDashboard(opts?: { silent?: boolean }) {
    if (!contestId) return;

    const silent = !!opts?.silent;
    if (silent) setDashboardRefreshing(true);
    else setDashboardLoading(true);

    try {
      const payload = await getContestDashboard(contestId, 0, 50);

      console.log(
        `[dashboard] ${new Date().toISOString()} silent=${silent} contestId=${contestId} items=${payload.items?.length ?? 0}`,
        payload
      );

      setDashboardItems(payload.items);
    } finally {
      if (silent) setDashboardRefreshing(false);
      else setDashboardLoading(false);
    }
  }
  async function loadDashboardFriends(opts?: { silent?: boolean }) {
    if (!contestId) return;

    const silent = !!opts?.silent;
    if (silent) setFriendDashboardRefreshing(true);
    else setFriendDashboardLoading(true);

    try {
      const payload = await getContestDashboardFriend(contestId, 0, 50);

      console.log(
        `[dashboard-friends] ${new Date().toISOString()} silent=${silent} contestId=${contestId} items=${payload.items?.length ?? 0}`,
        payload
      );

      setFriendDashboardItems(payload.items);
    } finally {
      if (silent) setFriendDashboardRefreshing(false);
      else setFriendDashboardLoading(false);
    }
  }



  useEffect(() => {
    if (!contestId) return;

    setDashboardLoading(true);
    getContestDashboard(contestId, 0, 50)
      .then(res => {
        setDashboardItems(res.items);
      })
      .finally(() => setDashboardLoading(false));
  }, [contestId]);

  useEffect(() => {
    if (activeTab !== "dashboard") return;
    if (!isOfficial) return;
    if (!contestId) return;

    let cancelled = false;

    // load lần đầu (có loading)
    loadDashboard({ silent: false });

    const t = setInterval(() => {
      if (cancelled) return;

      const startTime = data?.startTime;
      const duration = data?.duration;

      if (!startTime || !duration) return;

      const start = new Date(startTime).getTime();
      const end = start + duration * 1000;
      const now = Date.now();

      // chỉ refresh trong lúc contest đang diễn ra
      if (now >= start && now <= end) {
        loadDashboard({ silent: true }); // silent => không flicker
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [activeTab, isOfficial, contestId, data?.startTime, data?.duration]);



  useEffect(() => {
    if (!Number.isFinite(idNum)) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contestId]);

  useEffect(() => {
    if (activeTab !== "registrations") return;
    if (!isOfficial) return;
    loadRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isOfficial]);

  useEffect(() => {
    if (activeTab !== "dashboard-friends") return;
    if (!isOfficial) return;
    if (!contestId) return;

    let cancelled = false;

    // load lần đầu (có loading)
    loadDashboardFriends({ silent: false });

    const t = setInterval(() => {
      if (cancelled) return;

      const startTime = data?.startTime;
      const duration = data?.duration;

      if (!startTime || !duration) return;

      const start = new Date(startTime).getTime();
      const end = start + duration * 1000;
      const now = Date.now();

      if (now >= start && now <= end) {
        loadDashboardFriends({ silent: true }); // silent => không flicker
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [activeTab, isOfficial, contestId, data?.startTime, data?.duration]);


  const sortedProblems = useMemo(() => {
    return [...(data?.problems ?? [])].sort((a, b) => a.problemOrder - b.problemOrder);
  }, [data]);

  const problemLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    sortedProblems.forEach(p => {
      map.set(p.problemId, p.problemLabel);
    });
    return map;
  }, [sortedProblems]);

  console.log(
    "problemLabelMap entries:",
    Array.from(problemLabelMap.entries())
  );


  if (!Number.isFinite(idNum)) return <div className="cf-page">Invalid contestId</div>;
  if (loading) return <div className="cf-page">Loading...</div>;
  if (!data) return <div className="cf-page">Not found</div>;

  // Nếu lỡ mở nhầm draft bằng official page
  if (!isOfficial) {
    return (
      <div className="cf-page">
        Contest này là DRAFT. Đi qua trang draft detail đi.
      </div>
    );
  }


  return (
    <div className="cf-shell">
      <div className="cf-page">
        <div className="cf-paper">
          {/* ================= TITLE BAR ================= */}
          <div className="cf-titlebar">
            <div className="cf-titlebar__center">
              <div className="cf-title">{data.title}</div>
              <div className="cf-subtitle">{data.description}</div>
              <div style={{ marginTop: 8 }}>
                <span className="tag">contestId: {data.contestId}</span>
                <span className="tag">status: {data.contestStatus}</span>
                <span className="tag">visibility: {data.visibility}</span>
                <span className="tag">rated: {String(data.rated ?? 0)}</span>
              </div>
            </div>

            <div className="cf-titlebar__actions" style={{ display: "flex", gap: 8 }}>
              {/* OFFICIAL: chỉ register/unregister */}
              {!isRegistered ? (
                <button className="btn btn--primary" disabled={registering} onClick={onRegister}>
                  Register
                </button>
              ) : (
                <button className="btn btn--danger" disabled={registering} onClick={onUnregister}>
                  Unregister
                </button>
              )}

              {/* OFFICIAL: edit theo logic cũ */}
              {canEditOfficial && (
                <button className="btn btn--ghost" onClick={() => navigate(`/contests/${idNum}/edit`)}>
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Tabs (OFFICIAL only) */}
          <div className="tab-bar" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              className={`btn ${activeTab === "info" ? "btn--primary" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              Info
            </button>
            <button
              className={`btn ${activeTab === "registrations" ? "btn--primary" : ""}`}
              onClick={() => setActiveTab("registrations")}
            >
              Registrations
            </button>
            <button
              className={`btn ${activeTab === "dashboard" ? "btn--primary" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={`btn ${activeTab === "dashboard-friends" ? "btn--primary" : ""}`}
              onClick={() => setActiveTab("dashboard-friends")}
            >
              Friends
            </button>

            <button
              className={`btn ${activeTab === "submissions" ? "btn--primary" : ""}`}
              onClick={() => setActiveTab("submissions")}
            >
              Submissions
            </button>

          </div>

          {/* Registrations tab */}
          {activeTab === "registrations" && (
            <div className="box">
              <div className="box__head">Registered users</div>
              <div className="box__body">
                {regLoading ? (
                  <div className="hint">Loading...</div>
                ) : registrations.length === 0 ? (
                  <div className="hint">No registrations</div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>User name</th>
                        <th>Registered at</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map((r) => (
                        <tr key={r.userId}>
                          <td>{r.userId}</td>
                          <td>{r.userName}</td>
                          <td>{r.registeredAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
          {/* Dashboard tab */}
          {activeTab === "dashboard" && (
            <div className="box">
              <div className="box__head">Ranking</div>
              <div className="box__body">
                {dashboardLoading ? (
                  <div className="hint">Loading...</div>
                ) : dashboardItems.length === 0 ? (
                  <div className="hint">No data</div>
                ) : (
                  <DashboardRankTable
                    items={dashboardItems}
                    problemLabelMap={problemLabelMap}
                  />

                )}
              </div>
            </div>
          )}

          {activeTab === "dashboard-friends" && (
            <div className="box">
              <div className="box__head">Friends Ranking</div>
              <div className="box__body">
                {friendDashboardLoading ? (
                  <div className="hint">Loading...</div>
                ) : friendDashboardItems.length === 0 ? (
                  <div className="hint">No data</div>
                ) : (
                  <DashboardRankTable
                    items={friendDashboardItems}
                    problemLabelMap={problemLabelMap}
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === "submissions" && (
            <ContestSubmissionsTab
              contestId={idNum}
              problems={sortedProblems.map(p => ({
                problemId: p.problemId,
                problemLabel: p.problemLabel,
              }))}
            />
          )}

          {/* Info tab */}
          {activeTab === "info" && (
            <div className="cf-content">
              <div className="cf-grid">
                {/* Problems list (read-only) */}
                <div className="box">
                  <div className="box__head">Problems</div>
                  <div className="box__body">
                    {sortedProblems.length === 0 ? (
                      <div className="hint">No problems yet.</div>
                    ) : (
                      <table className="table">
                        <thead>
                          <tr>
                            <th style={{ width: 60 }}>#</th>
                            <th style={{ width: 160 }}>Problem</th>
                            <th>Label</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedProblems.map((p) => (
                            <tr key={p.id}>
                              <td>
                                <b>{p.problemOrder}</b>
                              </td>
                              <td>
                                <Link to={`/problems/${p.problemId}`}>{p.problemId}</Link>
                              </td>
                              <td>{p.problemLabel}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Sidebar info + countdown */}
                <div style={{ display: "grid", gap: 14 }}>
                  <div className="box">
                    <div className="box__head">Contest info</div>
                    <div className="box__body">
                      <div className="kv">
                        <span>Start time</span>
                        <span>{data.startTime ?? "null"}</span>
                      </div>
                      <div className="kv">
                        <span>Duration</span>
                        <span>{data.duration ?? "null"}</span>
                      </div>

                      {data.startTime != null && data.duration != null && (
                        <ContestCountdown startTime={data.startTime} duration={data.duration} />
                      )}
                    </div>
                  </div>

                  {/* Nếu m còn box sidebar khác cho official info thì copy từ file cũ */}
                  {/* ... */}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
