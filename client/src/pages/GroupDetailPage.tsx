import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { authStorage } from "../storage/authStorage";

import { readFileAsBlobUrl } from "../services/uploadApi";
import {
  getGroupDetail,
  updateGroup,
  inviteToGroup,
  listInvitations,
} from "../services/groupApi";
import type { GroupDetail, GroupEntity, InvitationEntity } from "../services/groupApi";

import { uploadFileToMinio } from "../services/uploadApi";

import { searchContests } from "../services/contestApi";
import type { ContestSearchItem, ContestSearchFilter } from "../types/contest";
import type { PageRequestDto, PageResult } from "../types/api";
import { searchUsersByPrefix } from "../services/contestApi";

type TabKey = "members" | "contests";

const CONTEST_PAGE_SIZE = 10;
const INV_PAGE_SIZE = 10;

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const gid = (groupId ?? "").trim();

  const [tab, setTab] = useState<TabKey>("members");

  const [data, setData] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ===== Contests =====
  const [cPrefix, setCPrefix] = useState("");
  const [cPage, setCPage] = useState(0);
  const [cLoading, setCLoading] = useState(false);
  const [cErr, setCErr] = useState<string | null>(null);
  const [cData, setCData] = useState<PageResult<ContestSearchItem> | null>(null);

  const [inviteQuery, setInviteQuery] = useState("");
  const [userSugLoading, setUserSugLoading] = useState(false);
  const [userSugErr, setUserSugErr] = useState<string | null>(null);
  const [userSug, setUserSug] = useState<Array<{ id: number; username: string }>>([]);
  const [selectedInvitee, setSelectedInvitee] = useState<{ id: number; username: string } | null>(null);

  // ===== Admin by group role =====
  const myUserId = (authStorage as any).getUserId?.() as number | string | undefined;

  const isGroupAdmin = useMemo(() => {
    if (!data) return false;

    // ưu tiên userId, fallback theo username nếu thiếu
    if (myUserId != null) {
      const me = data.members?.find((m) => String(m.userId) === String(myUserId));
      return (me?.role ?? "").toUpperCase() === "ADMIN";
    }

    const myUsername = authStorage.getUsername?.();
    if (!myUsername) return false;
    const me = data.members?.find((m) => m.userName === myUsername);
    return (me?.role ?? "").toUpperCase() === "ADMIN";
  }, [data, myUserId]);

  // ===== Admin: Update =====
  const [editing, setEditing] = useState(false);
  const [uName, setUName] = useState("");
  const [uDesc, setUDesc] = useState("");
  const [uAvatar, setUAvatar] = useState("");
  const [uFile, setUFile] = useState<File | null>(null);

  const [uLoading, setULoading] = useState(false);
  const [uErr, setUErr] = useState<string | null>(null);
  const [uOk, setUOk] = useState<string | null>(null);

  // ===== Admin: Invite =====
  const [inviteeId, setInviteeId] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteErr, setInviteErr] = useState<string | null>(null);
  const [inviteOk, setInviteOk] = useState<string | null>(null);

  // ===== Admin: Invitation list =====
  const [invPrefix, setInvPrefix] = useState("");
  const [invPage, setInvPage] = useState(0);
  const [invListLoading, setInvListLoading] = useState(false);
  const [invListErr, setInvListErr] = useState<string | null>(null);
  const [invList, setInvList] = useState<PageResult<InvitationEntity> | null>(null);

  async function loadDetail() {
    if (!gid) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await getGroupDetail(gid);
      setData(res);

      // sync form
      setUName(res.groupName ?? "");
      setUDesc(res.description ?? "");
      setUAvatar(res.avatar ?? "");
      setUFile(null);
    } catch (e: any) {
      setErr(e?.message || "Load group detail failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadContests(nextPage = cPage) {
    if (!gid) return;
    setCLoading(true);
    setCErr(null);
    try {
      const req: PageRequestDto<ContestSearchFilter> = {
        maxResultCount: CONTEST_PAGE_SIZE,
        skipCount: nextPage * CONTEST_PAGE_SIZE,
        sorting: "contestId desc",
        filter: {
          groupId: gid,
          ...(cPrefix.trim() ? ({ prefix: cPrefix.trim() } as any) : {}),
        } as ContestSearchFilter,
      };
      const res = await searchContests(req);
      setCData(res);
    } catch (e: any) {
      setCErr(e?.message || "Load contests failed");
    } finally {
      setCLoading(false);
    }
  }

  async function loadInvitationList(nextPage = invPage) {
    if (!gid) return;
    setInvListLoading(true);
    setInvListErr(null);
    try {
      const req: PageRequestDto<{ groupId?: string; prefix?: string }> = {
        maxResultCount: INV_PAGE_SIZE,
        skipCount: nextPage * INV_PAGE_SIZE,
        sorting: "inviterId desc",
        filter: {
          groupId: gid,
          prefix: invPrefix.trim() ? invPrefix.trim() : undefined,
        },
      };
      const res = await listInvitations(req);
      setInvList(res);
    } catch (e: any) {
      setInvListErr(e?.message || "Load invitation list failed");
    } finally {
      setInvListLoading(false);
    }
  }

  async function onSaveUpdate() {
    if (!data) return;
    setUErr(null);
    setUOk(null);

    if (!isGroupAdmin) {
      setUErr("Only ADMIN can update group");
      return;
    }
    if (!uName.trim()) {
      setUErr("groupName is required");
      return;
    }

    setULoading(true);
    try {
      let avatarUrl = uAvatar.trim();

      if (uFile) {
        avatarUrl = await uploadFileToMinio(uFile);
      }

      const payload: GroupEntity = {
        groupId: data.groupId,
        groupName: uName.trim(),
        description: uDesc ?? "",
        avatar: avatarUrl ?? "",
      };

      await updateGroup(payload);
      setUOk("Updated successfully");
      setEditing(false);
      await loadDetail();
    } catch (e: any) {
      setUErr(e?.message || "Update failed");
    } finally {
      setULoading(false);
    }
  }

  async function onInvite() {
    setInviteErr(null);
    setInviteOk(null);

    if (!isGroupAdmin) {
      setInviteErr("Only ADMIN can invite");
      return;
    }

    const id = selectedInvitee ? String(selectedInvitee.id) : "";
    if (!id) {
      setInviteErr("Please pick a user from search result");
      return;
    }


    setInviteLoading(true);
    try {
      await inviteToGroup({ groupId: gid, inviteeId: id });
      setInviteOk("Invited successfully");
      setInviteeId("");
      setInvPage(0);

      setInviteQuery("");
      setSelectedInvitee(null);
      setUserSug([]);

      await loadInvitationList(0);
    } catch (e: any) {
      setInviteErr(e?.message || "Invite failed");
    } finally {
      setInviteLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gid]);

  const [avatarSrc, setAvatarSrc] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    let lastUrl: string | null = null;

    async function resolve() {
      const a = (data?.avatar ?? "").trim();
      if (!a) { setAvatarSrc(""); return; }
      if (/^https?:\/\//i.test(a) || a.startsWith("data:")) { setAvatarSrc(a); return; }

      try {
        const url = await readFileAsBlobUrl(a);
        if (cancelled) { URL.revokeObjectURL(url); return; }
        lastUrl = url;
        setAvatarSrc(url);
      } catch {
        setAvatarSrc("");
      }
    }

    resolve();
    return () => {
      cancelled = true;
      if (lastUrl) URL.revokeObjectURL(lastUrl);
    };
  }, [data?.avatar]);

  useEffect(() => {
    let cancelled = false;
    const q = inviteQuery.trim();

    setUserSugErr(null);
    setSelectedInvitee(null);

    if (!q) {
      setUserSug([]);
      return;
    }

    const t = setTimeout(async () => {
      setUserSugLoading(true);
      try {
        const res = await searchUsersByPrefix(q);
        if (cancelled) return;
        setUserSug(res.data ?? []);
      } catch (e: any) {
        if (!cancelled) setUserSugErr(e?.message || "Search users failed");
      } finally {
        if (!cancelled) setUserSugLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [inviteQuery]);

  useEffect(() => {
    if (tab === "contests") loadContests(cPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, cPage, gid]);

  useEffect(() => {
    if (isGroupAdmin && gid) loadInvitationList(invPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGroupAdmin, gid, invPage]);

  const members = data?.members ?? [];

  // ✅ handle PageResult: có thể là items hoặc data
  const contests = useMemo(() => {
    const anyC = cData as any;
    return (anyC?.items ?? anyC?.data ?? []) as ContestSearchItem[];
  }, [cData]);

  const invItems = useMemo(() => {
    const anyI = invList as any;
    return (anyI?.items ?? anyI?.data ?? []) as InvitationEntity[];
  }, [invList]);

  return (
    <div className="cf-page">
      <div className="cf-paper">
        <div className="cf-titlebar">
          <div className="cf-titlebar__center">
            <div className="cf-title">{data?.groupName ?? "Group Detail"}</div>
            <div className="cf-subtitle">
              <span className="mono" style={{ fontFamily: "ui-monospace, monospace" }}>
                {gid}
              </span>
            </div>
          </div>
          <div className="cf-titlebar__actions" />
        </div>

        <div className="cf-content">
          {err && <div className="alert alert--bad">{err}</div>}
          {loading && <div className="hint">Loading...</div>}

          {data && (
            <div className="cf-grid">
              {/* LEFT */}
              <div>
                <div className="pd-tabs">
                  <button
                    className={`pd-tab ${tab === "members" ? "pd-tab--active" : ""}`}
                    onClick={() => setTab("members")}
                  >
                    Members <span className="tag">{members.length}</span>
                  </button>
                  <button
                    className={`pd-tab ${tab === "contests" ? "pd-tab--active" : ""}`}
                    onClick={() => setTab("contests")}
                  >
                    Contests
                  </button>
                </div>

                {tab === "members" && (
                  <div className="cf-paper" style={{ borderRadius: 12 }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th style={{ width: 220 }}>User ID</th>
                          <th>Name</th>
                          <th style={{ width: 140 }}>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((m) => (
                          <tr key={`${m.userId}-${m.role}`}>
                            <td style={{ fontFamily: "ui-monospace, monospace" }}>{m.userId}</td>
                            <td style={{ fontWeight: 950 }}>{m.userName}</td>
                            <td>
                              {m.role}
                              {String(m.role).toUpperCase() === "ADMIN" && (
                                <span className="tag" style={{ marginLeft: 8 }}>
                                  ADMIN
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}

                        {members.length === 0 && (
                          <tr>
                            <td colSpan={3} style={{ padding: 14, color: "#6b7280", fontWeight: 900 }}>
                              No members.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {tab === "contests" && (
                  <div className="box">
                    <div className="box__head">Contests in this group</div>
                    <div className="box__body">
                      {cErr && <div className="alert alert--bad">{cErr}</div>}
                      {cLoading && <div className="hint">Loading...</div>}

                      <div className="cf-paper" style={{ borderRadius: 12 }}>
                        <table className="table">
                          <thead>
                            <tr>
                              <th style={{ width: 120 }}>ID</th>
                              <th>Title</th>
                              <th style={{ width: 140 }}>Status</th>
                              <th style={{ width: 90 }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {contests.map((c: any) => (
                              <tr key={c.contestId}>
                                <td style={{ fontFamily: "ui-monospace, monospace" }}>{c.contestId}</td>
                                <td style={{ fontWeight: 950 }}>{c.title ?? c.contestName ?? "—"}</td>
                                <td>{c.status ?? "—"}</td>
                                <td>
                                  <Link to={`/groups/${gid}/contests/${c.contestId}`} style={{ fontWeight: 900 }}>
                                    Open
                                  </Link>
                                </td>
                              </tr>
                            ))}

                            {!cLoading && contests.length === 0 && (
                              <tr>
                                <td colSpan={4} style={{ padding: 14, color: "#6b7280", fontWeight: 900 }}>
                                  No contests.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="form-row" style={{ marginTop: 10 }}>
                        <button
                          className={`btn ${cPage === 0 || cLoading ? "btn--disabled" : ""}`}
                          disabled={cPage === 0 || cLoading}
                          onClick={() => setCPage((p) => Math.max(0, p - 1))}
                        >
                          Prev
                        </button>
                        <span className="badge">Page {cPage + 1}</span>
                        <button
                          className={`btn ${cLoading || contests.length < CONTEST_PAGE_SIZE ? "btn--disabled" : ""}`}
                          disabled={cLoading || contests.length < CONTEST_PAGE_SIZE}
                          onClick={() => setCPage((p) => p + 1)}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT */}
              <div>
                <div className="box">
                  <div className="box__head">Group Info</div>
                  <div className="box__body">
                    <div className="kv">
                      <span>Group ID</span>
                      <span style={{ fontFamily: "ui-monospace, monospace" }}>{data.groupId}</span>
                    </div>
                    <div className="kv">
                      <span>Name</span>
                      <span>{data.groupName}</span>
                    </div>
                    <div className="kv">
                      <span>Members</span>
                      <span>{members.length}</span>
                    </div>

                    {avatarSrc && (
                      <div style={{ marginTop: 10 }}>
                        <div className="hint" style={{ marginBottom: 6 }}>
                          Avatar
                        </div>
                        <img
                          src={avatarSrc}
                          alt="avatar"
                          style={{ width: "100%", borderRadius: 12, border: "1px solid #dde5f2" }}
                        />
                      </div>
                    )}


                    {data.description && (
                      <div style={{ marginTop: 10 }}>
                        <div className="hint" style={{ marginBottom: 6 }}>
                          Description
                        </div>
                        <div style={{ lineHeight: 1.6, fontWeight: 800, color: "#111827" }}>
                          {data.description}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 12 }} className="form-row">
                  <button className="btn" onClick={loadDetail} disabled={loading}>
                    Refresh
                  </button>

                  {isGroupAdmin && (
                    <button className="btn btn--primary" onClick={() => setEditing((v) => !v)}>
                      {editing ? "Cancel" : "Update"}
                    </button>
                  )}

                  {!isGroupAdmin && (
                    <span className="hint" style={{ marginLeft: "auto" }}>
                      Only member role <b>ADMIN</b> can update/invite.
                    </span>
                  )}
                </div>

                {/* ===== ADMIN PANEL ===== */}
                {isGroupAdmin && editing && (
                  <div className="box" style={{ marginTop: 12 }}>
                    <div className="box__head">Update group</div>
                    <div className="box__body">
                      {uErr && <div className="alert alert--bad">{uErr}</div>}
                      {uOk && <div className="alert alert--ok">{uOk}</div>}

                      <div className="form-row" style={{ marginBottom: 10 }}>
                        <input
                          className="input"
                          value={uName}
                          onChange={(e) => setUName(e.target.value)}
                          placeholder="groupName"
                        />
                      </div>

                      <div className="form-row" style={{ marginBottom: 10 }}>
                        <textarea
                          className="textarea"
                          value={uDesc}
                          onChange={(e) => setUDesc(e.target.value)}
                          placeholder="description"
                          rows={4}
                        />
                      </div>

                      <div className="form-row" style={{ marginBottom: 10 }}>
                        <input
                          className="input"
                          value={uAvatar}
                          onChange={(e) => setUAvatar(e.target.value)}
                          placeholder="avatar url (optional)"
                        />
                      </div>

                      <div className="form-row" style={{ marginBottom: 10 }}>
                        <input
                          className="input"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setUFile(e.target.files?.[0] ?? null)}
                        />
                      </div>

                      <div className="form-row">
                        <button
                          className={`btn btn--primary ${uLoading ? "btn--disabled" : ""}`}
                          disabled={uLoading}
                          onClick={onSaveUpdate}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isGroupAdmin && (
                  <div className="box" style={{ marginTop: 12 }}>
                    <div className="box__head">Invite</div>
                    <div className="box__body">
                      {inviteErr && <div className="alert alert--bad">{inviteErr}</div>}
                      {inviteOk && <div className="alert alert--ok">{inviteOk}</div>}

                      <div className="form-row" style={{ marginBottom: 10 }}>
                        <div className="form-row" style={{ marginBottom: 10 }}>
                          <input
                            className="input"
                            value={inviteQuery}
                            onChange={(e) => setInviteQuery(e.target.value)}
                            placeholder="Search user by prefix..."
                          />

                          <button
                            className={`btn btn--primary ${inviteLoading ? "btn--disabled" : ""}`}
                            disabled={inviteLoading}
                            onClick={onInvite}
                          >
                            Invite
                          </button>
                        </div>

                        {userSugErr && <div className="alert alert--bad">{userSugErr}</div>}

                        <div className="cf-paper" style={{ borderRadius: 12, overflow: "hidden" }}>
                          <table className="table">
                            <thead>
                              <tr>
                                <th style={{ width: 120 }}>User ID</th>
                                <th>Username</th>
                                <th style={{ width: 120 }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {userSugLoading && (
                                <tr>
                                  <td colSpan={3} style={{ padding: 12, color: "#6b7280", fontWeight: 800 }}>
                                    Searching...
                                  </td>
                                </tr>
                              )}

                              {!userSugLoading && userSug.map((u) => (
                                <tr key={u.id}>
                                  <td style={{ fontFamily: "ui-monospace, monospace" }}>{u.id}</td>
                                  <td style={{ fontWeight: 900 }}>
                                    {u.username}
                                    {selectedInvitee?.id === u.id && (
                                      <span className="tag" style={{ marginLeft: 8 }}>SELECTED</span>
                                    )}
                                  </td>
                                  <td>
                                    <button
                                      className="btn"
                                      onClick={() => {
                                        setSelectedInvitee(u);
                                        setInviteErr(null);
                                      }}
                                    >
                                      Choose
                                    </button>
                                  </td>
                                </tr>
                              ))}

                              {!userSugLoading && inviteQuery.trim() && userSug.length === 0 && (
                                <tr>
                                  <td colSpan={3} style={{ padding: 12, color: "#6b7280", fontWeight: 800 }}>
                                    No users found.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {selectedInvitee && (
                          <div className="hint" style={{ marginTop: 8 }}>
                            Will invite: <b>{selectedInvitee.username}</b> (id:{" "}
                            <span style={{ fontFamily: "ui-monospace, monospace" }}>{selectedInvitee.id}</span>)
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
