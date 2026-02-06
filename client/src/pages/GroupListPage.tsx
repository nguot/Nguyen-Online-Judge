import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  invitationAction,
  listGroups,
  listInvitations,
  type InvitationEntity,
  type InviteActionStatus,
} from "../services/groupApi";
import type { GroupEntity } from "../services/groupApi";
import type { PageRequestDto, PageResult } from "../types/api";

type TabKey = "groups" | "invitations";

const PAGE_SIZE = 10;
const INV_PAGE_SIZE = 10;

export default function GroupListPage() {
  const [tab, setTab] = useState<TabKey>("groups");

  // ===== Groups =====
  const [prefix, setPrefix] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResult<GroupEntity> | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ===== Invitations =====
  const [invPrefix, setInvPrefix] = useState("");
  const [invPage, setInvPage] = useState(0);
  const [invData, setInvData] = useState<PageResult<InvitationEntity> | null>(null);
  const [invLoading, setInvLoading] = useState(false);
  const [invErr, setInvErr] = useState<string | null>(null);

  const [actLoadingKey, setActLoadingKey] = useState<string | null>(null);
  const [actErr, setActErr] = useState<string | null>(null);
  const [actOk, setActOk] = useState<string | null>(null);

  async function loadGroups(nextPage = page) {
    setLoading(true);
    setErr(null);
    try {
      const req: PageRequestDto<{ prefix?: string }> = {
        maxResultCount: PAGE_SIZE,
        skipCount: nextPage * PAGE_SIZE,
        sorting: "groupName asc",
        filter: { prefix: prefix.trim() ? prefix.trim() : undefined },
      };
      const res = await listGroups(req);
      setData(res);
    } catch (e: any) {
      setErr(e?.message || "Load groups failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadInvitations(nextPage = invPage) {
    setInvLoading(true);
    setInvErr(null);
    try {
      const req: PageRequestDto<{ groupId?: string; prefix?: string }> = {
        maxResultCount: INV_PAGE_SIZE,
        skipCount: nextPage * INV_PAGE_SIZE,
        sorting: "inviterId desc",
        filter: {
          prefix: invPrefix.trim() ? invPrefix.trim() : undefined,
        },
      };
      const res = await listInvitations(req);
      setInvData(res);
    } catch (e: any) {
      setInvErr(e?.message || "Load invitations failed");
    } finally {
      setInvLoading(false);
    }
  }

  async function onInviteAction(inv: InvitationEntity, status: InviteActionStatus) {
    const key = `${inv.inviterId}-${inv.groupId}`;
    setActLoadingKey(key);
    setActErr(null);
    setActOk(null);
    try {
      await invitationAction({
        inviterId: inv.inviterId,
        groupId: inv.groupId,
        status,
      });
      setActOk(`Invite ${status.toLowerCase()} ✅`);
      await loadInvitations(invPage);
    } catch (e: any) {
      setActErr(e?.message || "Action failed");
    } finally {
      setActLoadingKey(null);
    }
  }

  // Load groups when tab/groups page changes
  useEffect(() => {
    if (tab === "groups") loadGroups(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page]);

  // Load invitations when tab/invitations page changes
  useEffect(() => {
    if (tab === "invitations") loadInvitations(invPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, invPage]);

  const groups = useMemo(() => {
    const anyD = data as any;
    return (anyD?.items ?? anyD?.data ?? []) as GroupEntity[];
  }, [data]);

  const invitations = useMemo(() => {
    const anyI = invData as any;
    return (anyI?.items ?? anyI?.data ?? []) as InvitationEntity[];
  }, [invData]);

  return (
    <div className="cf-page">
      <div className="cf-paper">
        <div className="cf-titlebar">
          <div className="cf-titlebar__center">
            <div className="cf-title">Groups</div>
            <div className="cf-subtitle">Manage groups & invitations</div>
          </div>
          <div className="cf-titlebar__actions" />
        </div>

        <div className="cf-content">
          {/* Tabs */}
          <div className="pd-tabs" style={{ marginBottom: 12 }}>
            <button
              className={`pd-tab ${tab === "groups" ? "pd-tab--active" : ""}`}
              onClick={() => setTab("groups")}
            >
              Groups
            </button>
            <button
              className={`pd-tab ${tab === "invitations" ? "pd-tab--active" : ""}`}
              onClick={() => setTab("invitations")}
            >
              Invitations
            </button>
          </div>

          {/* ===== TAB: GROUPS ===== */}
          {tab === "groups" && (
            <>
              <div className="form-row" style={{ marginBottom: 12 }}>
                <input
                  className="input"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="prefix..."
                />
                <button
                  className={`btn btn--primary ${loading ? "btn--disabled" : ""}`}
                  onClick={() => {
                    setPage(0);
                    loadGroups(0);
                  }}
                  disabled={loading}
                >
                  Search
                </button>

                <span className="hint" style={{ marginLeft: "auto" }}>
                  Total: {data?.totalCount ?? 0}
                </span>
              </div>

              {err && <div className="alert alert--bad">{err}</div>}

              <div className="cf-paper" style={{ borderRadius: 12 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 220 }}>Group ID</th>
                      <th style={{ width: 260 }}>Name</th>
                      <th>Description</th>
                      <th style={{ width: 110 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g) => (
                      <tr key={g.groupId}>
                        <td style={{ fontFamily: "ui-monospace, monospace" }}>{g.groupId}</td>
                        <td style={{ fontWeight: 950 }}>{g.groupName}</td>
                        <td style={{ color: "#374151" }}>{g.description}</td>
                        <td>
                          <Link to={`/groups/${g.groupId}`} style={{ fontWeight: 900 }}>
                            Detail
                          </Link>
                        </td>
                      </tr>
                    ))}

                    {!loading && groups.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: 14, color: "#6b7280", fontWeight: 900 }}>
                          No groups.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="form-row" style={{ marginTop: 12 }}>
                <button
                  className={`btn ${page === 0 || loading ? "btn--disabled" : ""}`}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                >
                  Prev
                </button>
                <span className="badge">Page {page + 1}</span>
                <button
                  className={`btn ${loading || groups.length < PAGE_SIZE ? "btn--disabled" : ""}`}
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading || groups.length < PAGE_SIZE}
                >
                  Next
                </button>
                {loading && <span className="hint">Loading...</span>}
              </div>
            </>
          )}

          {/* ===== TAB: INVITATIONS ===== */}
          {tab === "invitations" && (
            <>
              <div className="form-row" style={{ marginBottom: 12 }}>
                <input
                  className="input"
                  value={invPrefix}
                  onChange={(e) => setInvPrefix(e.target.value)}
                  placeholder="search by prefix..."
                />
                <button
                  className={`btn btn--primary ${invLoading ? "btn--disabled" : ""}`}
                  disabled={invLoading}
                  onClick={() => {
                    setInvPage(0);
                    loadInvitations(0);
                  }}
                >
                  Search
                </button>

                <span className="hint" style={{ marginLeft: "auto" }}>
                  Total: {invData?.totalCount ?? 0}
                </span>
              </div>

              {invErr && <div className="alert alert--bad">{invErr}</div>}
              {actErr && <div className="alert alert--bad">{actErr}</div>}
              {actOk && <div className="alert alert--ok">{actOk}</div>}

              <div className="cf-paper" style={{ borderRadius: 12 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 160 }}>Inviter ID</th>
                      <th>Group</th>
                      <th style={{ width: 210 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invLoading && (
                      <tr>
                        <td colSpan={3} style={{ padding: 14, color: "#6b7280", fontWeight: 900 }}>
                          Loading...
                        </td>
                      </tr>
                    )}

                    {!invLoading &&
                      invitations.map((inv, idx) => {
                        const key = `${inv.inviterId}-${inv.groupId}`;
                        const acting = actLoadingKey === key;

                        return (
                          <tr key={`${key}-${idx}`}>
                            <td style={{ fontFamily: "ui-monospace, monospace" }}>{inv.inviterId}</td>
                            <td>
                              <div style={{ fontWeight: 950 }}>{inv.groupName}</div>
                              <div style={{ fontFamily: "ui-monospace, monospace", opacity: 0.75 }}>
                                {inv.groupId}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                <button
                                  className={`btn btn--primary ${acting ? "btn--disabled" : ""}`}
                                  disabled={acting}
                                  onClick={() => onInviteAction(inv, "ACCEPTED")}
                                >
                                  Accept
                                </button>
                                <button
                                  className={`btn ${acting ? "btn--disabled" : ""}`}
                                  disabled={acting}
                                  onClick={() => onInviteAction(inv, "DECLINED")}
                                >
                                  Decline
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                    {!invLoading && invitations.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ padding: 14, color: "#6b7280", fontWeight: 900 }}>
                          No invitations.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="form-row" style={{ marginTop: 12 }}>
                <button
                  className={`btn ${invPage === 0 || invLoading ? "btn--disabled" : ""}`}
                  onClick={() => setInvPage((p) => Math.max(0, p - 1))}
                  disabled={invPage === 0 || invLoading}
                >
                  Prev
                </button>
                <span className="badge">Page {invPage + 1}</span>
                <button
                  className={`btn ${invLoading || invitations.length < INV_PAGE_SIZE ? "btn--disabled" : ""}`}
                  onClick={() => setInvPage((p) => p + 1)}
                  disabled={invLoading || invitations.length < INV_PAGE_SIZE}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
