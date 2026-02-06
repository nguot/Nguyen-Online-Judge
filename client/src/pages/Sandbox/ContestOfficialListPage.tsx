import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { searchContests } from "../../services/contestApi";
import type { ContestSearchItem } from "../../types/contest";

function formatMs(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}

export default function ContestOfficialListPage() {
  const [items, setItems] = useState<ContestSearchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const pageSize = 10;

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    const res = await searchContests({
      maxResultCount: pageSize,
      skipCount: skip,
      sorting: "contestId desc",
      filter: { contestType: "OFFICIAL" },
    });
    setItems(res.data);
    setTotal(res.totalCount);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip]);

  const view = useMemo(() => {
    return items.map((c) => {
      const startMs = c.startTime ? new Date(c.startTime).getTime() : NaN;
      const durMs = (c.duration ?? 0) * 1000;
      const endMs = Number.isFinite(startMs) ? startMs + durMs : NaN;

      let label = "Schedule TBD";
      if (Number.isFinite(startMs) && c.duration != null) {
        if (now < startMs) label = `Starts in: ${formatMs(startMs - now)}`;
        else if (Number.isFinite(endMs) && now < endMs) label = `Remaining: ${formatMs(endMs - now)}`;
        else label = "Ended";
      }

      return { c, label };
    });
  }, [items, now]);

  const grouped = useMemo(() => {
    return {
      UPCOMING: view.filter(v => v.c.contestStatus === "UPCOMING"),
      RUNNING: view.filter(v => v.c.contestStatus === "RUNNING"),
      FINISHED: view.filter(v => v.c.contestStatus === "FINISHED"),
    };
  }, [view]);

  function renderGroup(title: string, list: typeof view) {
    if (list.length === 0) return null;

    return (
      <div style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 8 }}>{title}</h3>

        <div style={{ display: "grid", gap: 8 }}>
          {list.map(({ c, label }) => (
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
                <div style={{ opacity: 0.85 }}>{label}</div>
              </div>

              <div style={{ opacity: 0.85 }}>{c.description}</div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 13, opacity: 0.85 }}>
                <span>contest_status: {c.contestStatus}</span>
                <span>start_time: {c.startTime ?? "null"}</span>
                <span>duration: {c.duration ?? "null"}</span>
                <span>rated: {String(c.rated ?? 0)}</span>
                <span>visibility: {c.visibility}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Contests (OFFICIAL)</h2>

      <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
        {renderGroup("UPCOMING", grouped.UPCOMING)}
        {renderGroup("RUNNING", grouped.RUNNING)}
        {renderGroup("FINISHED", grouped.FINISHED)}
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
    </div>
  );
}
