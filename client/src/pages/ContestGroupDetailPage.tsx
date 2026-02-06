import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { authStorage } from "../storage/authStorage";
import { getGroupDetail } from "../services/groupApi";
import type { GroupDetail } from "../services/groupApi";

import { deleteContest, editContest, getContestDetail } from "../services/contestApi";
import type { ContestEditInput } from "../types/contest";

import { deriveSubmissionStatus, submissionApi } from "../services/submissionApi";
import type { SubmissionDto, SubmissionStatus } from "../services/submissionApi";

type ProblemLite = { problemId: string; problemLabel: string };


export default function ContestGroupDetailPage() {
  const { groupId, contestId } = useParams<{ groupId: string; contestId: string }>();
  const navigate = useNavigate();

  const gid = (groupId ?? "").trim();
  const idNum = Number((contestId ?? "").trim());

  const [data, setData] = useState<any>(null);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"info" | "settings" | "submissions">("info");

  // settings form
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  const [delLoading, setDelLoading] = useState(false);
  const [delErr, setDelErr] = useState<string | null>(null);

  const myUserId = (authStorage as any).getUserId?.() as number | string | undefined;
  const [memberName, setMemberName] = useState("");

  const STATUS_OPTIONS: Array<{ value: SubmissionStatus; label: string }> = [
    { value: "AC", label: "AC" },
    { value: "WA", label: "WA" },
    { value: "CE", label: "CE" },
    { value: "ML", label: "ML" },
  ];

  const [subLabel, setSubLabel] = useState<string>(""); // "" all
  const [subStatuses, setSubStatuses] = useState<SubmissionStatus[]>([]);
  const [subItems, setSubItems] = useState<SubmissionDto[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  const problemsLite = useMemo<ProblemLite[]>(() => {
  const arr = Array.isArray((data as any)?.problems) ? ((data as any).problems as any[]) : [];
  return arr.map((p) => ({
    problemId: String(p.problemId ?? ""),
    problemLabel: String(p.problemLabel ?? ""),
  }));
}, [data]);


  const problemIdByLabel = useMemo(() => {
    if (!subLabel) return undefined;
    return problemsLite.find((p) => p.problemLabel === subLabel)?.problemId;
  }, [subLabel, problemsLite]);

  const problemLabelMap = useMemo(() => {
    const m = new Map<string, string>();
    problemsLite.forEach((p) => m.set(p.problemId, p.problemLabel));
    return m;
  }, [problemsLite]);

  const userNameMap = useMemo(() => {
    const m = new Map<string, string>();
    (group?.members ?? []).forEach((x) => m.set(String(x.userId), x.userName));
    return m;
  }, [group]);


  const isGroupAdmin = useMemo(() => {
    if (!group) return false;

    if (myUserId != null) {
      const me = group.members?.find((m) => String(m.userId) === String(myUserId));
      return (me?.role ?? "").toUpperCase() === "ADMIN";
    }

    const myUsername = authStorage.getUsername?.();
    if (!myUsername) return false;
    const me = group.members?.find((m) => m.userName === myUsername);
    return (me?.role ?? "").toUpperCase() === "ADMIN";
  }, [group, myUserId]);

  const filteredSubs = useMemo(() => {
    let arr = subItems;

    if (subStatuses.length > 0) {
      arr = arr.filter((sub) => subStatuses.includes(deriveSubmissionStatus(sub)));
    }

    const q = memberName.trim().toLowerCase();
    if (q) {
      arr = arr.filter((sub) => {
        const name = (userNameMap.get(String(sub.userId)) ?? "").toLowerCase();
        return name.includes(q);
      });
    }

    return arr;
  }, [subItems, subStatuses, memberName, userNameMap]);

  const toggleStatus = (s: SubmissionStatus) => {
    setSubStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  async function load() {
    if (!Number.isFinite(idNum)) return;
    setLoading(true);
    try {
      const [g, res] = await Promise.all([getGroupDetail(gid), getContestDetail(idNum)]);
      setGroup(g);
      setData(res);

      // sync settings fields
      setTitle(res?.title ?? "");
      setDescription(res?.description ?? "");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab !== "submissions") return;
    if (!idNum) return;

    setSubLoading(true);
    submissionApi
      .search({
        maxResultCount: 50,
        skipCount: 0,
        filter: {
          contestId: idNum,
          ...(problemIdByLabel ? { problemId: problemIdByLabel } : {}),
        },
      })
      .then((res) => setSubItems(res.data ?? []))
      .finally(() => setSubLoading(false));
  }, [activeTab, idNum, problemIdByLabel]);

  useEffect(() => {
    if (!gid) return;
    if (!Number.isFinite(idNum)) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gid, contestId]);

  const sortedProblems = useMemo(() => {
    const arr = Array.isArray(data?.problems) ? data.problems : [];
    return [...arr].sort((a, b) => (a.problemOrder ?? 0) - (b.problemOrder ?? 0));
  }, [data]);

  async function onSave() {
    setSaveErr(null);
    setSaveOk(null);

    if (!isGroupAdmin) return setSaveErr("Only GROUP ADMIN can edit");
    if (!title.trim()) return setSaveErr("Title is required");

    setSaveLoading(true);
    try {
      const input: ContestEditInput = {
        title: title.trim(),
        description: description ?? "",
      } as any;

      await editContest(idNum, input);
      setSaveOk("Saved ✅");
      setEditing(false);
      await load();
    } catch (e: any) {
      setSaveErr(e?.message || "Save failed");
    } finally {
      setSaveLoading(false);
    }
  }

  async function onDelete() {
    setDelErr(null);
    if (!isGroupAdmin) return setDelErr("Only GROUP ADMIN can delete");

    if (!window.confirm("Delete this contest?")) return;

    setDelLoading(true);
    try {
      await deleteContest(idNum);
      navigate(`/groups/${gid}`);
    } catch (e: any) {
      setDelErr(e?.message || "Delete failed");
    } finally {
      setDelLoading(false);
    }
  }

  if (!Number.isFinite(idNum)) return <div className="cf-page">Invalid contestId</div>;
  if (loading) return <div className="cf-page">Loading...</div>;
  if (!data) return <div className="cf-page">Not found</div>;

  // ✅ IMPORTANT: backend trả contest_id
  const contestIdView = data?.contestId ?? data?.contest_id ?? idNum;

  return (
    <div className="cf-shell">
      <div className="cf-page">
        <div className="cf-paper">
          {/* ===== TITLE BAR (giống Official) ===== */}
          <div className="cf-titlebar">
            <div className="cf-titlebar__center">
              <div className="cf-title">{data.title}</div>
              <div className="cf-subtitle">{data.description}</div>
              <div style={{ marginTop: 8 }}>
                <span className="tag">contestId: {contestIdView}</span>
                <span className="tag">status: {data.contestStatus}</span>
                <span className="tag">visibility: {data.visibility}</span>
                <span className="tag">rated: {String(data.rated ?? 0)}</span>
                <span className="tag">group: {String(data.groupId ?? data.group_id ?? gid)}</span>
              </div>
            </div>

            {/* ✅ không register, chỉ show admin actions */}
            <div className="cf-titlebar__actions" style={{ display: "flex", gap: 8 }}>
              <Link className="btn btn--ghost" to={`/groups/${gid}`}>
                Back
              </Link>

              {isGroupAdmin && (
                <button
                  className="btn btn--ghost"
                  onClick={() => {
                    setActiveTab("settings");
                    setEditing(false);
                    setSaveErr(null);
                    setSaveOk(null);
                  }}
                >
                  Manage
                </button>
              )}
            </div>
          </div>

          {/* ===== TABS (giống Official tab-bar) ===== */}
          <div className="tab-bar" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              className={`btn ${activeTab === "info" ? "btn--primary" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              Info
            </button>

            {isGroupAdmin && (
              <button
                className={`btn ${activeTab === "settings" ? "btn--primary" : ""}`}
                onClick={() => setActiveTab("settings")}
              >
                Settings
              </button>
            )}
            <button
              className={`btn ${activeTab === "submissions" ? "btn--primary" : ""}`}
              onClick={() => setActiveTab("submissions")}
            >
              Submissions
            </button>

          </div>

          {/* ===== INFO TAB ===== */}
          {activeTab === "info" && (
            <div className="cf-content">
              <div className="cf-grid">
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
                          {sortedProblems.map((p: any) => (
                            <tr key={p.id ?? `${p.problemId}-${p.problemOrder}`}>
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

                <div style={{ display: "grid", gap: 14 }}>
                  <div className="box">
                    <div className="box__head">Group info</div>
                    <div className="box__body">
                      <div className="kv">
                        <span>Group</span>
                        <span>{group?.groupName ?? "—"}</span>
                      </div>
                      <div className="kv">
                        <span>Your role</span>
                        <span>{isGroupAdmin ? "ADMIN" : "MEMBER"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== SETTINGS TAB (admin only) ===== */}
          {activeTab === "settings" && isGroupAdmin && (
            <div className="cf-content">
              <div className="box">
                <div className="box__head">Manage contest</div>
                <div className="box__body">
                  {saveErr && <div className="alert alert--bad">{saveErr}</div>}
                  {saveOk && <div className="alert alert--ok">{saveOk}</div>}
                  {delErr && <div className="alert alert--bad">{delErr}</div>}

                  <div className="hint" style={{ marginBottom: 6 }}>
                    Title
                  </div>
                  {editing ? (
                    <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
                  ) : (
                    <div style={{ fontWeight: 950, fontSize: 18 }}>{title}</div>
                  )}

                  <div className="hint" style={{ marginTop: 12, marginBottom: 6 }}>
                    Description
                  </div>
                  {editing ? (
                    <textarea
                      className="textarea"
                      rows={6}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  ) : (
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontWeight: 700 }}>
                      {description || "—"}
                    </div>
                  )}

                  <div className="form-row" style={{ marginTop: 12 }}>
                    <button className="btn" onClick={() => setEditing((v) => !v)}>
                      {editing ? "Cancel" : "Edit"}
                    </button>

                    {editing && (
                      <button
                        className={`btn btn--primary ${saveLoading ? "btn--disabled" : ""}`}
                        disabled={saveLoading}
                        onClick={onSave}
                      >
                        Save
                      </button>
                    )}

                    <button
                      className={`btn ${delLoading ? "btn--disabled" : ""}`}
                      disabled={delLoading}
                      onClick={onDelete}
                      style={{ marginLeft: "auto" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "submissions" && (
            <div className="cf-content">
              <div className="box">
                <div className="box__head">Submissions</div>
                <div className="box__body">
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                    <select className="select" value={subLabel} onChange={(e) => setSubLabel(e.target.value)}>
                      <option value="">All problems</option>
                      {problemsLite.map((p) => (
                        <option key={p.problemId} value={p.problemLabel}>
                          {p.problemLabel} ({p.problemId})
                        </option>
                      ))}
                    </select>

                    <input
                      className="input"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="Filter by member name..."
                      style={{ minWidth: 220 }}
                    />

                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      {STATUS_OPTIONS.map((o) => (
                        <label key={o.value} style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={subStatuses.includes(o.value)}
                            onChange={() => toggleStatus(o.value)}
                          />
                          <span>{o.label}</span>
                        </label>
                      ))}
                    </div>

                    {subLoading && <div className="hint">Loading...</div>}
                    <span className="hint" style={{ marginLeft: "auto" }}>
                      Showing: {filteredSubs.length}
                    </span>
                  </div>

                  {filteredSubs.length === 0 ? (
                    <div className="hint">No submissions</div>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th style={{ width: 220 }}>Submission</th>
                          <th style={{ width: 180 }}>User</th>
                          <th style={{ width: 180 }}>Problem</th>
                          <th style={{ width: 90 }}>Status</th>
                          <th style={{ width: 120 }}>Lang</th>
                          <th>Submitted at</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubs.map((sub) => {
                          const st = deriveSubmissionStatus(sub);
                          return (
                            <tr key={sub.submissionId}>
                              <td style={{ fontFamily: "ui-monospace, monospace" }}>{sub.submissionId}</td>
                              <td style={{ fontWeight: 900 }}>{userNameMap.get(String(sub.userId)) ?? sub.userId}</td>
                              <td>{problemLabelMap.get(sub.problemId) ?? sub.problemId}</td>
                              <td>
                                <b>{st}</b>
                              </td>
                              <td>{sub.language ?? "-"}</td>
                              <td>{sub.submittedAt}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
