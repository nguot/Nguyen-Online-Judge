// src/pages/AdminPage.tsx
import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../services/adminApi";
import type {
    AdminUserFilterDto,
    AdminUserItemDto,
    PageRequestDto,
    PageResult,
    PermissionDto,
    RoleDetailDto,
    UpdateRolePermissionItem,
} from "../types/admin";

const ROLES = [
    { roleId: 1, roleCode: "ADMIN", roleName: "Admin" },
    { roleId: 2, roleCode: "USER", roleName: "User" },
    { roleId: 3, roleCode: "PRO_USER", roleName: "Pro User" },
];

type Tab = "roles" | "users";

type UiPermission = {
    permissionId?: number | null;
    permissionName: string;
};

export default function AdminPage() {
    const [tab, setTab] = useState<Tab>("roles");

    // ===== ROLES =====
    const [selectedRoleId, setSelectedRoleId] = useState<number>(1);
    const [roleLoading, setRoleLoading] = useState(false);
    const [roleSaving, setRoleSaving] = useState(false);
    const [roleError, setRoleError] = useState("");
    const [roleDetail, setRoleDetail] = useState<RoleDetailDto | null>(null);
    const [permissions, setPermissions] = useState<UiPermission[]>([]);

    const loadRole = async (rid: number) => {
        setRoleLoading(true);
        setRoleError("");
        try {
            const dto = await adminApi.getRoleDetail(rid);
            setRoleDetail(dto);
            setPermissions(
                (dto.permissions || []).map((p: PermissionDto) => ({
                    permissionId: p.permissionId,
                    permissionName: p.permissionName,
                }))
            );
        } catch (e: any) {
            setRoleError(String(e?.message || e));
        } finally {
            setRoleLoading(false);
        }
    };

    useEffect(() => {
        loadRole(selectedRoleId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRoleId]);

    const addPermissionRow = () => {
        setPermissions((prev) => [{ permissionId: null, permissionName: "" }, ...prev]);
    };

    const updatePermissionName = (idx: number, v: string) => {
        setPermissions((prev) => prev.map((it, i) => (i === idx ? { ...it, permissionName: v } : it)));
    };

    const deletePermissionRow = (idx: number) => {
        setPermissions((prev) => prev.filter((_, i) => i !== idx));
    };

    const savePermissions = async () => {
        const cleaned: UpdateRolePermissionItem[] = permissions
            .map((p) => ({
                permissionId: p.permissionId ?? null,
                permissionName: (p.permissionName || "").trim(),
            }))
            .filter((p) => p.permissionName.length > 0);

        setRoleSaving(true);
        setRoleError("");
        try {
            const msg = await adminApi.updateRolePermissions(selectedRoleId, { permissions: cleaned });
            alert(msg || "Saved");
            await loadRole(selectedRoleId);
        } catch (e: any) {
            setRoleError(String(e?.message || e));
        } finally {
            setRoleSaving(false);
        }
    };

    // ===== USERS =====
    const [username, setUsername] = useState("");
    const [roleIdFilter, setRoleIdFilter] = useState<string>("");
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [userLoading, setUserLoading] = useState(false);
    const [userError, setUserError] = useState("");
    const [userTotal, setUserTotal] = useState(0);
    const [userRows, setUserRows] = useState<AdminUserItemDto[]>([]);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(userTotal / pageSize)),
        [userTotal, pageSize]
    );

    const fetchUsers = async (forcePage?: number) => {
        const nextPage = typeof forcePage === "number" ? forcePage : page;

        const filter: AdminUserFilterDto = {
            username: username.trim() || undefined,
            roleId: roleIdFilter ? Number(roleIdFilter) : undefined,
        };

        const body: PageRequestDto<AdminUserFilterDto> = {
            maxResultCount: pageSize,
            skipCount: nextPage * pageSize,
            sorting: "",
            filter,
        };

        setUserLoading(true);
        setUserError("");
        try {
            const res: PageResult<AdminUserItemDto> = await adminApi.searchUsers(body);
            setUserTotal(res.totalCount);
            setUserRows(res.data || []);
        } catch (e: any) {
            setUserError(String(e?.message || e));
        } finally {
            setUserLoading(false);
        }
    };

    useEffect(() => {
        if (tab === "users") fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, page, pageSize]);

    const onSearchUsers = () => {
        setPage(0);
        fetchUsers(0);
    };

    return (
        <div style={{ padding: 16 }}>
            <h2 style={{ marginTop: 0 }}>Admin</h2>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button
                    onClick={() => setTab("roles")}
                    style={{ fontWeight: tab === "roles" ? 700 : 400 }}
                >
                    Roles
                </button>
                <button
                    onClick={() => setTab("users")}
                    style={{ fontWeight: tab === "users" ? 700 : 400 }}
                >
                    Users
                </button>
            </div>

            {/* ===== ROLES TAB ===== */}
            {tab === "roles" && (
                <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 12 }}>
                    {/* Left: role list */}
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Roles</div>
                        <div style={{ display: "grid", gap: 8 }}>
                            {ROLES.map((r) => (
                                <button
                                    key={r.roleId}
                                    onClick={() => setSelectedRoleId(r.roleId)}
                                    style={{
                                        textAlign: "left",
                                        padding: 10,
                                        borderRadius: 10,
                                        border: "1px solid #e5e7eb",
                                        background: r.roleId === selectedRoleId ? "#f1f5f9" : "white",
                                    }}
                                >
                                    <div style={{ fontWeight: 700 }}>{r.roleName}</div>
                                    <div style={{ opacity: 0.7 }}>{r.roleCode}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: permissions editor */}
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ fontWeight: 700 }}>
                                    {roleDetail?.roleName || "Role"}{" "}
                                    <span style={{ opacity: 0.7 }}>({roleDetail?.roleCode || ""})</span>
                                </div>
                                <div style={{ opacity: 0.7 }}>roleId: {selectedRoleId}</div>
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={addPermissionRow} disabled={roleLoading || roleSaving}>
                                    + Add
                                </button>
                                <button onClick={savePermissions} disabled={roleLoading || roleSaving}>
                                    {roleSaving ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </div>

                        {roleError && (
                            <div style={{ marginTop: 10, color: "crimson" }}>
                                <b>Error:</b> {roleError}
                            </div>
                        )}

                        <div style={{ marginTop: 10 }}>
                            {roleLoading ? (
                                <div>Loading...</div>
                            ) : (
                                <div style={{ display: "grid", gap: 8 }}>
                                    {permissions.map((p, idx) => (
                                        <div
                                            key={`${p.permissionId ?? "new"}-${idx}`}
                                            style={{
                                                display: "flex",
                                                gap: 8,
                                                alignItems: "center",
                                                padding: 10,
                                                border: "1px solid #e5e7eb",
                                                borderRadius: 10,
                                            }}
                                        >
                                            <div style={{ width: 90, opacity: 0.7 }}>#{p.permissionId ?? "new"}</div>
                                            <input
                                                value={p.permissionName}
                                                onChange={(e) => updatePermissionName(idx, e.target.value)}
                                                placeholder="permissionName (string)"
                                                style={{ flex: 1, padding: 8 }}
                                            />
                                            <button onClick={() => deletePermissionRow(idx)} disabled={roleSaving}>
                                                Delete
                                            </button>
                                        </div>
                                    ))}

                                    {permissions.length === 0 && (
                                        <div style={{ opacity: 0.7 }}>No permissions. Click “Add”.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== USERS TAB ===== */}
            {tab === "users" && (
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="username"
                            style={{ padding: 8, minWidth: 240 }}
                        />

                        <select
                            value={roleIdFilter}
                            onChange={(e) => setRoleIdFilter(e.target.value)}
                            style={{ padding: 8 }}
                        >
                            <option value="">All roles</option>
                            <option value="1">USER</option>
                            <option value="2">PRO USER</option>
                        </select>

                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            style={{ padding: 8 }}
                        >
                            {[10, 20, 50].map((n) => (
                                <option key={n} value={n}>
                                    {n} / page
                                </option>
                            ))}
                        </select>

                        <button onClick={onSearchUsers} disabled={userLoading}>
                            Search
                        </button>
                    </div>

                    {userError && (
                        <div style={{ marginTop: 10, color: "crimson" }}>
                            <b>Error:</b> {userError}
                        </div>
                    )}

                    <div style={{ marginTop: 10 }}>
                        {userLoading ? (
                            <div>Loading...</div>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>userId</th>
                                            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>username</th>
                                            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>email</th>
                                            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>rating</th>
                                            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>role</th>
                                            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {userRows.map((u) => (
                                            <tr key={u.userId}>
                                                <td style={{ borderBottom: "1px solid #f1f5f9", padding: 8 }}>{u.userId}</td>
                                                <td style={{ borderBottom: "1px solid #f1f5f9", padding: 8 }}>{u.username}</td>
                                                <td style={{ borderBottom: "1px solid #f1f5f9", padding: 8 }}>{u.email}</td>
                                                <td style={{ borderBottom: "1px solid #f1f5f9", padding: 8 }}>{u.rating}</td>
                                                <td style={{ borderBottom: "1px solid #f1f5f9", padding: 8 }}>
                                                    {u.role?.roleName} (#{u.role?.roleId})
                                                </td>

                                                <td style={{ borderBottom: "1px solid #f1f5f9", padding: 8 }}>
                                                    {/* Change role */}
                                                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                                                        <select
                                                            defaultValue={String(u.role?.roleId ?? "")}
                                                            onChange={(e) => {
                                                                // store temporary on object (UI-only)
                                                                (u as any).__nextRoleId = Number(e.target.value);
                                                            }}
                                                            style={{ padding: 6 }}
                                                        >
                                                            <option value="2">USER</option>
                                                            <option value="3">PRO USER</option>
                                                        </select>

                                                        <button
                                                            onClick={async () => {
                                                                const nextRoleId = Number((u as any).__nextRoleId ?? u.role?.roleId);
                                                                if (!nextRoleId) return;

                                                                if (!confirm(`Change role of ${u.username} to roleId=${nextRoleId}?`)) return;

                                                                try {
                                                                    const msg = await adminApi.updateUserRole(Number(u.userId), { roleId: nextRoleId });
                                                                    alert(msg || "Role updated");
                                                                    fetchUsers(); // reload current page
                                                                } catch (e: any) {
                                                                    alert(e?.message || String(e));
                                                                }
                                                            }}
                                                        >
                                                            Save Role
                                                        </button>

                                                        {/* Change rating */}
                                                        <button
                                                            onClick={async () => {
                                                                const ratingStr = prompt(`New rating for ${u.username}:`, String(u.rating ?? 0));
                                                                if (ratingStr === null) return; // cancel
                                                                const rating = Number(ratingStr);
                                                                if (!Number.isFinite(rating)) {
                                                                    alert("Rating must be a number");
                                                                    return;
                                                                }

                                                                const reason = prompt("Reason (optional):", "") ?? undefined;

                                                                try {
                                                                    const msg = await adminApi.updateUserRating(Number(u.userId), {
                                                                        rating,
                                                                        ...(reason && reason.trim().length > 0 ? { reason: reason.trim() } : {}),
                                                                    });
                                                                    alert(msg || "Rating updated");
                                                                    fetchUsers();
                                                                } catch (e: any) {
                                                                    alert(e?.message || String(e));
                                                                }
                                                            }}
                                                        >
                                                            Edit Rating
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {userRows.length === 0 && (
                                            <tr>
                                                <td colSpan={6} style={{ padding: 12, opacity: 0.7 }}>
                                                    No data
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
                            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || userLoading}>
                                Prev
                            </button>
                            <div>
                                Page <b>{page + 1}</b> / <b>{totalPages}</b> — Total <b>{userTotal}</b>
                            </div>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1 || userLoading}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
