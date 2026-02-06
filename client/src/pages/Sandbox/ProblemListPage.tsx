import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../components/ui.css";

import type { PageRequestDto } from "../../types/api";
import type { ProblemEntity, ProblemInputDto } from "../../types/problem";
import { getIsAdmin } from "../../storage/authStorage";
import { deleteProblem, searchProblems, searchProblemsText } from "../../services/problemApi";

const PAGE_SIZE = 100;

type Mode = "filter" | "text";

export default function ProblemListPage() {
  const nav = useNavigate();
  const isAdmin = getIsAdmin();

  const [mode, setMode] = useState<Mode>("filter");
  const [contestId, setContestId] = useState("");
  const [level, setLevel] = useState("");
  const [q, setQ] = useState("");

  const [skip, setSkip] = useState(0);
  const page = useMemo(() => Math.floor(skip / PAGE_SIZE) + 1, [skip]);

  const [items, setItems] = useState<ProblemEntity[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onReset = () => {
    setContestId("");
    setLevel("");
    setQ("");
    setSkip(0);
  };

  const fetchData = async (newSkip = skip) => {
    setLoading(true);
    setErr("");
    try {
      if (mode === "text") {
        const req: PageRequestDto<string> = {
          maxResultCount: PAGE_SIZE,
          skipCount: newSkip,
          sorting: "title asc",
          filter: q.trim(),
        };
        const res = await searchProblemsText(req);
        const items = (res.data ?? []).filter(it => it?.contestId != null && it.contestId !== 0);
        setItems(items);
        setTotalCount(res.totalCount ?? 0);
      } else {
        const filter: Partial<ProblemInputDto> = {};
        if (contestId.trim()) filter.contestId = Number(contestId.trim());
        if (level.trim()) filter.level = level.trim() as any;

        const req: PageRequestDto<Partial<ProblemInputDto>> = {
          maxResultCount: PAGE_SIZE,
          skipCount: newSkip,
          sorting: "title asc",
          filter,
        };

        const res = await searchProblems(req as any);
        const items = (res.data ?? []).filter(it => it?.contestId != null && it.contestId !== 0);
        setItems(items);
        setItems(items);
        setTotalCount(res.totalCount ?? 0);
      }
      setSkip(newSkip);
    } catch (e: any) {
      setErr(e?.message ?? "Load failed");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (problemId: string) => {
    if (!isAdmin) return;
    if (!confirm(`Delete problem ${problemId}?`)) return;
    setLoading(true);
    setErr("");
    try {
      await deleteProblem(problemId);
      await fetchData(Math.max(0, skip - (items.length === 1 ? PAGE_SIZE : 0)));
    } catch (e: any) {
      setErr(e?.message ?? "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    fetchData(skip);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip]);

  return (
    <div className="cf-paper">
      <div className="cf-titlebar">
        <div>
          <div className="cf-title">Problemset</div>
          <div className="cf-subtitle">
            Search / View / {isAdmin ? "Create-Edit-Delete" : "View only"}
          </div>
        </div>
      </div>

      <div className="cf-content">
        {err && <div className="alert alert--bad" style={{ marginBottom: 12 }}>{err}</div>}

        <div className="form-row" style={{ marginBottom: 12 }}>
          <select className="select" value={mode} onChange={(e) => { setSkip(0); setMode(e.target.value as Mode); }}>
            <option value="filter">Filter search</option>
            <option value="text">Text search</option>
          </select>

          {mode === "text" ? (
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title/statement..."
              style={{ minWidth: 320 }}
            />
          ) : (
            <>
              <input
                className="input"
                value={contestId}
                onChange={(e) => setContestId(e.target.value)}
                placeholder="contestId"
              />
              <input
                className="input"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="level (EASY/MEDIUM/HARD)"
                style={{ minWidth: 240 }}
              />
            </>
          )}

          <button className="btn btn--primary" disabled={loading} onClick={() => fetchData(0)}>
            Search
          </button>
          <button className="btn" disabled={loading} onClick={onReset}>
            Reset
          </button>

          <span className="hint" style={{ marginLeft: "auto" }}>
            Total: {totalCount}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 210, minWidth: 210 }}>ID</th>
                <th style={{ minWidth: 200 }}>Title</th>
                <th style={{ width: 90, minWidth: 90 }}>Level</th>
                <th style={{ width: 90, minWidth: 90 }}>Score</th>
                <th style={{ width: 90, minWidth: 90 }}>Rating</th>
                <th style={{ width: 90, minWidth: 90 }}>Contest</th>
                <th style={{ minWidth: 150 }}>Tags</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="hint">
                    {loading ? "Loading..." : "No data"}
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr key={p.problemId}>
                    <td className="hint" style={{ wordBreak: 'break-all' }}>{p.problemId}</td>

                    <td>
                      <div style={{ fontWeight: 950 }}>
                        <Link to={`/problems/${p.problemId}`}>{p.title}</Link>
                      </div>
                    </td>

                    <td>{p.level}</td>
                    <td>{p.score}</td>
                    <td>{p.rating}</td>
                    <td>{p.contestId}</td>

                    <td>
                      {(p.tags ?? []).slice(0, 8).map((t: string) => (
                        <span className="tag" key={t}>{t}</span>
                      ))}
                      {(p.tags ?? []).length > 8 && <span className="hint">+{(p.tags ?? []).length - 8}</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && (
          <div className="form-row" style={{ marginTop: 12, justifyContent: "space-between" }}>
            <button
              className="btn"
              disabled={loading || skip === 0}
              onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
            >
              Prev
            </button>

            <div className="hint">
              Page {page} / {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
            </div>

            <button
              className="btn"
              disabled={loading || skip + PAGE_SIZE >= totalCount}
              onClick={() => setSkip(skip + PAGE_SIZE)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
