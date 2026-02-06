// DraftContestDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ContestDetail, ContestProblemItem } from "../../types/contest";
import { authStorage } from "../../storage/authStorage";
import ContestSubmissionsTab from "../../components/ContestSubmissionTab.tsx";

import {
  addProblemToContest,
  deleteContest,
  getContestDetail,
  makeContestOfficial,
  rearrangeContestProblems,
  removeProblemFromContest,
  getContestReviewers,
  assignReviewerToContest,
  unassignReviewerFromContest,
  searchUsersByPrefix,
} from "../../services/contestApi";

function detectIsOfficial(contest?: ContestDetail | null): boolean {
  return (contest?.contestType ?? "DRAFT") === "OFFICIAL";
}

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  // iso có thể là "2026-04-10T00:00:00" hoặc có .000Z
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  // datetime-local cần "YYYY-MM-DDTHH:mm" theo local time
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(v: string): string {
  // input datetime-local cho "YYYY-MM-DDTHH:mm"
  // backend m đang expect kiểu "YYYY-MM-DDTHH:mm:ss" -> thêm ":00"
  if (!v) return "";
  return v.length === 16 ? `${v}:00` : v;
}


export default function DraftContestDetailPage() {
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();

  const idNum = Number(contestId);
  const [data, setData] = useState<ContestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [addProblemId, setAddProblemId] = useState("");
  const [addProblemLabel, setAddProblemLabel] = useState("");

  const [reorder, setReorder] = useState<ContestProblemItem[]>([]);

  const [publishRated, setPublishRated] = useState<0 | 1>(0);
  const [publishStartTime, setPublishStartTime] = useState("");
  const [publishDuration, setPublishDuration] = useState<number>(3600);

  // reviewers
  type ReviewerItem = { userId: number; username: string; email: string };
  type SearchUserItem = { id: number; username: string };

  const [reviewers, setReviewers] = useState<ReviewerItem[]>([]);
  const [rvPrefix, setRvPrefix] = useState("");
  const [rvSearching, setRvSearching] = useState(false);
  const [rvCandidates, setRvCandidates] = useState<SearchUserItem[]>([]);

  const currentUserId = authStorage.getUserId();
  const isOfficial = detectIsOfficial(data);

  const isAuthor = useMemo(() => {
    if (!data) return false;
    if (data.authorId == null) return false;
    if (currentUserId == null) return false;
    return data.authorId === currentUserId;
  }, [data, currentUserId]);

  const isAdmin = authStorage.getIsAdmin();
  const isProUser = authStorage.isProUser();

  const canManageDraft = !isOfficial && isAuthor;

  const canMakeOfficial = !isOfficial && (isProUser || isAdmin);
  const [activeTab, setActiveTab] = useState<"info" | "submissions">("info");

  async function loadReviewers() {
    if (!Number.isFinite(idNum)) return;
    const r = await getContestReviewers(idNum);
    setReviewers(r.reviewers ?? []);
  }

  async function load() {
    if (!Number.isFinite(idNum)) return;
    setLoading(true);
    try {
      const res = await getContestDetail(idNum);
      setData(res);

      const sorted = [...res.problems].sort((a, b) => a.problemOrder - b.problemOrder);
      setReorder(sorted);

      setPublishRated((res.rated ?? 0) === 1 ? 1 : 0);
      setPublishStartTime(toDatetimeLocalValue(res.startTime));
      setPublishDuration(res.duration ?? 3600);

      // Draft page: chỉ load reviewers
      await loadReviewers().catch(() => { });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const p = rvPrefix.trim();
    if (!p) {
      setRvCandidates([]);
      return;
    }

    const t = window.setTimeout(async () => {
      setRvSearching(true);
      try {
        const res = await searchUsersByPrefix(p);
        setRvCandidates(res.data ?? []);
      } finally {
        setRvSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(t);
  }, [rvPrefix]);

  useEffect(() => {
    if (!Number.isFinite(idNum)) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contestId]);

  const sortedProblems = useMemo(() => {
    return [...(data?.problems ?? [])].sort((a, b) => a.problemOrder - b.problemOrder);
  }, [data]);

  if (!Number.isFinite(idNum)) return <div className="cf-page">Invalid contestId</div>;
  if (loading) return <div className="cf-page">Loading...</div>;
  if (!data) return <div className="cf-page">Not found</div>;

  // Nếu lỡ mở nhầm official bằng draft page
  if (isOfficial) {
    return (
      <div className="cf-page">
        Contest này là OFFICIAL. Đi qua trang official detail đi.
      </div>
    );
  }

  async function onAddProblem() {
    if (!canManageDraft) return;
    if (!addProblemId.trim()) return alert("problemId is required");
    if (!addProblemLabel.trim()) return alert("problemLabel is required");

    await addProblemToContest(idNum, {
      problemId: addProblemId.trim(),
      problemLabel: addProblemLabel.trim(),
    });
    setAddProblemId("");
    setAddProblemLabel("");
    await load();
  }

  async function onRemoveProblem(problemId: string) {
    if (!canManageDraft) return;
    if (!confirm(`Remove problem ${problemId}?`)) return;
    await removeProblemFromContest(idNum, problemId);
    await load();
  }

  function moveProblem(problemId: string, dir: -1 | 1) {
    setReorder((prev) => {
      const idx = prev.findIndex((p) => p.problemId === problemId);
      if (idx < 0) return prev;
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const tmp = next[idx];
      next[idx] = next[j];
      next[j] = tmp;
      return next;
    });
  }

  async function onSaveReorder() {
    if (!canManageDraft) return;
    const ids = reorder.map((p) => p.problemId);
    await rearrangeContestProblems(idNum, ids);
    await load();
  }

  async function onAssignReviewer(userId: number) {
    if (!canManageDraft) return;
    await assignReviewerToContest(idNum, userId);
    await loadReviewers();
  }

  async function onUnassignReviewer(userId: number) {
    if (!canManageDraft) return;
    if (!confirm("Unassign this reviewer?")) return;
    await unassignReviewerFromContest(idNum, userId);
    await loadReviewers();
  }

  async function onMakeOfficial() {
    if (!canMakeOfficial) return;
    const startTime = fromDatetimeLocalValue(publishStartTime.trim());
    if (!startTime) return alert("startTime is required");
    if (!publishDuration || publishDuration <= 0) return alert("duration must be > 0");

    await makeContestOfficial(idNum, {
      rated: publishRated,
      startTime,
      duration: publishDuration,
    });

    navigate("/contests/official");
  }

  async function onDeleteContest() {
    if (!canManageDraft) return;
    if (!confirm("Delete this contest?")) return;
    await deleteContest(idNum);
    navigate("/contests/draft");
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
              {canManageDraft && (
                <>
                  <button
                    className="btn btn--ghost"
                    onClick={() => navigate(`/contests/${idNum}/edit`)}
                  >
                    Edit
                  </button>
                  <button className="btn btn--danger" onClick={onDeleteContest}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ================= CONTENT ================= */}
          <div className="cf-content">
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button
                className={`btn ${activeTab === "info" ? "btn--primary" : ""}`}
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
            </div>

            {activeTab === "info" && (
              <div className="cf-grid">
                {/* ================= PROBLEMS ================= */}
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
                            <th style={{ width: 100 }}>Action</th>
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
                              <td>
                                <button className="btn" onClick={() => onRemoveProblem(p.problemId)}>
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* ===== ADD PROBLEM (DRAFT + AUTHOR ONLY) ===== */}
                    {canManageDraft && (
                      <div style={{ marginTop: 16 }}>
                        <div className="box">
                          <div className="box__head">Add problem</div>
                          <div className="box__body">
                            <div className="form-row">
                              <input
                                className="input"
                                placeholder="problemId"
                                value={addProblemId}
                                onChange={(e) => setAddProblemId(e.target.value)}
                              />
                              <input
                                className="input"
                                placeholder="problemLabel"
                                value={addProblemLabel}
                                onChange={(e) => setAddProblemLabel(e.target.value)}
                              />
                              <button className="btn btn--primary" onClick={onAddProblem}>
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ================= SIDEBAR ================= */}
                <div style={{ display: "grid", gap: 14 }}>
                  {/* ===== MAKE OFFICIAL (DRAFT + AUTHOR) ===== */}
                  {canMakeOfficial && (
                    <div className="box">
                      <div className="box__head">Make Official</div>
                      <div className="box__body" style={{ display: "grid", gap: 10 }}>
                        <label className="label">
                          Rated
                          <select
                            className="select"
                            value={publishRated}
                            onChange={(e) => setPublishRated(Number(e.target.value) as 0 | 1)}
                          >
                            <option value={0}>0</option>
                            <option value={1}>1</option>
                          </select>
                        </label>

                        <label className="label">
                          Start time
                          <input
                            className="input"
                            type="datetime-local"
                            value={publishStartTime}
                            onChange={(e) => setPublishStartTime(e.target.value)}
                            placeholder="2026-04-10T00:00:00"
                          />
                        </label>

                        <label className="label">
                          Duration (seconds)
                          <input
                            className="input"
                            type="number"
                            value={publishDuration}
                            onChange={(e) => setPublishDuration(Number(e.target.value))}
                          />
                        </label>

                        <button className="btn btn--primary" onClick={onMakeOfficial}>
                          Make Official
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ===== REORDER (DRAFT + AUTHOR ONLY) ===== */}
                  {canManageDraft && (
                    <div className="box">
                      <div className="box__head">Re-arrange problems</div>
                      <div className="box__body">
                        {reorder.map((p, idx) => (
                          <div
                            key={p.problemId}
                            style={{ display: "flex", gap: 8, alignItems: "center" }}
                          >
                            <span>{idx + 1}.</span>
                            <span style={{ flex: 1 }}>{p.problemLabel}</span>
                            <button className="btn" onClick={() => moveProblem(p.problemId, -1)}>
                              Up
                            </button>
                            <button className="btn" onClick={() => moveProblem(p.problemId, 1)}>
                              Down
                            </button>
                          </div>
                        ))}
                        <button
                          className="btn btn--primary"
                          style={{ marginTop: 8 }}
                          onClick={onSaveReorder}
                        >
                          Save order
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ===== REVIEWER (DRAFT + AUTHOR ONLY) ===== */}
                  {canManageDraft && (
                    <div className="box">
                      <div className="box__head">Reviewers</div>
                      <div className="box__body">
                        {reviewers.map((r) => (
                          <div
                            key={r.userId}
                            style={{ display: "flex", justifyContent: "space-between" }}
                          >
                            <span>{r.username}</span>
                            <button
                              className="btn btn--danger"
                              onClick={() => onUnassignReviewer(r.userId)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}

                        <input
                          className="input"
                          placeholder="Search reviewer"
                          value={rvPrefix}
                          onChange={(e) => setRvPrefix(e.target.value)}
                          style={{ marginTop: 8 }}
                        />

                        {rvSearching && <div className="hint">Searching...</div>}

                        {rvCandidates.map((u) => {
                          const assigned = reviewers.some((r) => r.userId === u.id);
                          return (
                            <div
                              key={u.id}
                              style={{ display: "flex", justifyContent: "space-between" }}
                            >
                              <span>{u.username}</span>
                              <button className="btn" disabled={assigned} onClick={() => onAssignReviewer(u.id)}>
                                Add
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* (Nếu m còn box sidebar khác thì copy y nguyên từ file cũ và nhét vào đây) */}
                {/* ... */}
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

          </div>
        </div>
      </div>
    </div>
  );
}
