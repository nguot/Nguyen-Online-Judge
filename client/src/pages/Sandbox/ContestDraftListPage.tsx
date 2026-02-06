import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ContestSearchItem } from "../../types/contest";
import { searchContests } from "../../services/contestApi";

export default function ContestDraftListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ContestSearchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const pageSize = 10;

  async function load() {
    setLoading(true);
    try {
      const res = await searchContests({
        maxResultCount: pageSize,
        skipCount: skip,
        sorting: "contestId desc",
        filter: { contestType: "DRAFT" },
      });
      setItems(res.data);
      setTotal(res.totalCount);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip]);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Contests (DRAFT)</h2>
        <button onClick={() => navigate("/contests/draft/create")}>Create Draft</button>
      </div>

      {loading ? (
        <div style={{ marginTop: 12 }}>Loading...</div>
      ) : (
        <>
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {items.map((c) => (
              <div
                key={c.contestId}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 12,
                  display: "grid",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontWeight: 700 }}>
                    <Link to={`/contests/${c.contestId}`}>{c.title}</Link>
                  </div>
                  <div style={{ opacity: 0.8 }}>{c.contestStatus}</div>
                </div>

                <div style={{ opacity: 0.85 }}>{c.description}</div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 13, opacity: 0.85 }}>
                  <span>visibility: {c.visibility}</span>
                  <span>rated: {String(c.rated ?? 0)}</span>
                  <span>start_time: {c.startTime ?? "null"}</span>
                  <span>duration: {c.duration ?? "null"}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <button disabled={skip <= 0} onClick={() => setSkip(Math.max(0, skip - pageSize))}>
              Prev
            </button>
            <span style={{ opacity: 0.85 }}>
              {skip + 1}-{Math.min(skip + pageSize, total)} / {total}
            </span>
            <button disabled={skip + pageSize >= total} onClick={() => setSkip(skip + pageSize)}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
