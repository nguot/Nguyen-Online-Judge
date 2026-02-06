import { useEffect, useMemo, useState } from "react";
import { deriveSubmissionStatus, submissionApi } from "../services/submissionApi";
import type { SubmissionDto, SubmissionStatus } from "../services/submissionApi";

type Props = {
  contestId: number;
  problems: Array<{
    problemId: string;
    problemLabel: string;
  }>;
};

const STATUS_OPTIONS: Array<{ value: SubmissionStatus; label: string }> = [
  { value: "AC", label: "AC" },
  { value: "WA", label: "WA" },
  { value: "CE", label: "CE" },
  { value: "ML", label: "ML" },
];

export default function ContestSubmissionsTab({ contestId, problems }: Props) {
    console.log("[SubmissionTab] render", { contestId, problemsLength: problems.length });

  // UI chọn theo label
  const [label, setLabel] = useState<string>(""); // "" = all
  const [statuses, setStatuses] = useState<SubmissionStatus[]>([]);
  const [items, setItems] = useState<SubmissionDto[]>([]);
  const [loading, setLoading] = useState(false);

  const problemId = useMemo(() => {
    if (!label) return undefined;
    return problems.find((p) => p.problemLabel === label)?.problemId;
  }, [label, problems]);

  const problemLabelMap = useMemo(() => {
    const m = new Map<string, string>();
    problems.forEach((p) => m.set(p.problemId, p.problemLabel));
    return m;
  }, [problems]);

  useEffect(() => {
    if (!contestId) return;

    setLoading(true);
    submissionApi
      .search({
        maxResultCount: 50,
        skipCount: 0,
        filter: {
          contestId,
          ...(problemId ? { problemId } : {}),
        },
      })
      .then((res) => {
        setItems(res.data ?? []);
      })
      .finally(() => setLoading(false));
  }, [contestId, problemId]);

  // backend không support status => lọc client
  const filteredItems = useMemo(() => {
    if (statuses.length === 0) return items;
    return items.filter((sub) => statuses.includes(deriveSubmissionStatus(sub)));
  }, [items, statuses]);

  const toggleStatus = (s: SubmissionStatus) => {
    setStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  return (
    <div className="box">
      <div className="box__head">Submissions</div>
      <div className="box__body">
        {/* FILTER BAR */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
          <select className="select" value={label} onChange={(e) => setLabel(e.target.value)}>
            <option value="">All problems</option>
            {problems.map((p) => (
              <option key={p.problemId} value={p.problemLabel}>
                {p.problemLabel} ({p.problemId})
              </option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {STATUS_OPTIONS.map((o) => (
              <label key={o.value} style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={statuses.includes(o.value)}
                  onChange={() => toggleStatus(o.value)}
                />
                <span>{o.label}</span>
              </label>
            ))}
          </div>

          {loading && <div className="hint">Loading...</div>}
        </div>

        {/* TABLE */}
        {filteredItems.length === 0 ? (
          <div className="hint">No submissions</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 220 }}>Submission</th>
                <th style={{ width: 120 }}>User</th>
                <th style={{ width: 140 }}>Problem</th>
                <th style={{ width: 90 }}>Status</th>
                <th style={{ width: 120 }}>Lang</th>
                <th>Submitted at</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((sub) => {
                const st = deriveSubmissionStatus(sub);
                return (
                  <tr key={sub.submissionId}>
                    <td>{sub.submissionId}</td>
                    <td>{sub.userId}</td>
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
  );
}
