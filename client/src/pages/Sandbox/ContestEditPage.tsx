import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { editContest, getContestDetail } from "../../services/contestApi";
import type { ContestEditInput } from "../../types/contest";

export default function ContestEditPage() {
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  const idNum = Number(contestId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<ContestEditInput>({
    title: "",
    description: "",
    startTime: null,
    duration: null,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const d = await getContestDetail(idNum);
        setForm({
          title: d.title,
          description: d.description,
          startTime: d.startTime,
          duration: d.duration,
        });
      } finally {
        setLoading(false);
      }
    }
    if (Number.isFinite(idNum)) load();
  }, [idNum]);

  async function onSave() {
    if (!form.title.trim()) return alert("title is required");
    if (!form.description.trim()) return alert("description is required");

    setSaving(true);
    try {
      await editContest(idNum, {
        title: form.title,
        description: form.description,
        startTime: form.startTime ?? undefined,
        duration: form.duration ?? undefined,
      });
      navigate(`/contests/${idNum}`);
    } finally {
      setSaving(false);
    }
  }

  if (!Number.isFinite(idNum)) {
    return (
      <div className="cf-shell">
        <div className="cf-page">
          <div className="cf-paper">
            <div className="cf-content">
              <div className="alert alert--bad">Invalid contestId</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cf-shell">
        <div className="cf-page">
          <div className="cf-paper">
            <div className="cf-content">
              <div className="hint">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cf-shell">
      <div className="cf-page">
        <div className="cf-paper">
          {/* Codeforces-ish titlebar */}
          <div className="cf-titlebar">
            <div className="cf-titlebar__center">
              <div className="cf-title">Edit contest</div>
              <div className="cf-subtitle">Contest #{idNum}</div>
            </div>

            <div
              className="cf-titlebar__actions"
              style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
            >
              <button
                className="btn btn--ghost"
                onClick={() => navigate(-1)}
                disabled={saving}
              >
                Cancel
              </button>
              <button className="btn btn--primary" onClick={onSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div className="cf-content">
            <div className="cf-grid">
              {/* Main */}
              <div className="box">
                <div className="box__head">Contest info</div>
                <div className="box__body" style={{ display: "grid", gap: 12 }}>
                  <label className="label">
                    Title
                    <input
                      className="input"
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Contest title"
                    />
                  </label>

                  <label className="label">
                    Description
                    <textarea
                      className="textarea"
                      value={form.description}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, description: e.target.value }))
                      }
                      placeholder="Contest description"
                      style={{ minHeight: 120 }}
                    />
                  </label>

                  <div className="form-row">
                    <label className="label" style={{ minWidth: 260 }}>
                      Start time
                      <input
                        type="datetime-local"
                        className="input"
                        value={form.startTime ?? ""}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            startTime: e.target.value ? e.target.value : null,
                          }))
                        }
                        placeholder="2026-01-15T10:00:00"
                      />
                    </label>

                    <label className="label" style={{ minWidth: 220 }}>
                      Duration (seconds)
                      <input
                        className="input"
                        type="number"
                        value={form.duration ?? ""}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            duration: e.target.value === "" ? null : Number(e.target.value),
                          }))
                        }
                        placeholder="3600"
                      />
                    </label>
                  </div>


                </div>
              </div>

              {/* Sidebar */}
              <div style={{ display: "grid", gap: 14 }}>
                <div className="box">
                  <div className="box__head">Tips</div>
                  <div className="box__body">
                    <div className="hint">

                    </div>
                  </div>
                </div>

                {saving && (
                  <div className="box">
                    <div className="box__head">Saving</div>
                    <div className="box__body">
                      <div className="hint">Đang lưu dữ liệu...</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* end content */}
        </div>
      </div>
    </div>
  );
}
