import { useEffect, useMemo, useState } from "react";
import { deriveSubmissionStatus, submissionApi } from "../services/submissionApi";
import type { SubmissionDto, SubmissionStatus } from "../services/submissionApi";
import { getUserId } from "../storage/authStorage";
import { Link } from "react-router-dom";

type Props = {};

const STATUS_OPTIONS: Array<{ value: SubmissionStatus; label: string }> = [
  { value: "AC", label: "AC" },
  { value: "WA", label: "WA" },
  { value: "CE", label: "CE" },
  { value: "ML", label: "ML" },
];

export default function UserSubmissionsTab(_: Props) {
  const userId = getUserId();

  const [statuses, setStatuses] = useState<SubmissionStatus[]>([]);
  const [items, setItems] = useState<SubmissionDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId == null) return;

    setLoading(true);
    submissionApi
      .search({
        maxResultCount: 50,
        skipCount: 0,
        sorting: "submittedAt desc",
        filter: { userId },
      })
      .then((res) => setItems(res.data ?? []))
      .finally(() => setLoading(false));
  }, [userId]);

  const filteredItems = useMemo(() => {
    if (statuses.length === 0) return items;
    return items.filter((sub) =>
      statuses.includes(deriveSubmissionStatus(sub))
    );
  }, [items, statuses]);

  const toggleStatus = (s: SubmissionStatus) => {
    setStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  if (userId == null) {
    return <div className="hint">Please login to view your submissions</div>;
  }

  return (
    <div className="box">
      <div className="box__head">My Submissions</div>
      <div className="box__body">
        {/* STATUS FILTER */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          {STATUS_OPTIONS.map((o) => (
            <label key={o.value} style={{ display: "flex", gap: 6 }}>
              <input
                type="checkbox"
                checked={statuses.includes(o.value)}
                onChange={() => toggleStatus(o.value)}
              />
              <span>{o.label}</span>
            </label>
          ))}
          {loading && <span className="hint">Loading...</span>}
        </div>

        {/* TABLE */}
        {filteredItems.length === 0 ? (
          <div className="hint">No submissions</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 220 }}>Submission</th>
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

                    <td>
                      <Link to={`/problems/${sub.problemId}`}>
                        {sub.problemId}
                      </Link>
                    </td>

                    <td><b>{st}</b></td>
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
