import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createContest } from "../../services/contestApi";
import type { ContestCreateInput } from "../../types/contest";

export default function ContestDraftCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<ContestCreateInput>({
    title: "",
    description: "",
    startTime: null,
    duration: null,
  });
  const [saving, setSaving] = useState(false);

  async function onSubmit() {
    if (!form.title.trim()) return alert("title is required");
    if (!form.description.trim()) return alert("description is required");

    setSaving(true);
    try {
      const res = await createContest({
        title: form.title,
        description: form.description,
        startTime: form.startTime ?? undefined,
        duration: form.duration ?? undefined,
      });
      navigate(`/contests/${res.contestId}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cf-shell">
      <div className="cf-page">
        <div className="cf-paper">
          {/* Codeforces-ish titlebar */}
          <div className="cf-titlebar">
            <div className="cf-titlebar__center">
              <div className="cf-title">Create draft contest</div>
              <div className="cf-subtitle">Draft contests can be edited later</div>
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
              <button
                className="btn btn--primary"
                disabled={saving}
                onClick={onSubmit}
              >
                {saving ? "Saving..." : "Create"}
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
                      onChange={(e) =>
                        setForm((p) => ({ ...p, title: e.target.value }))
                      }
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
                      Start time (optional)
                      <input
                        className="input"
                        value={form.startTime ?? ""}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            startTime: e.target.value || null,
                          }))
                        }
                        placeholder="2026-04-10T00:00:00"
                      />
                      <div className="hint">
                        Nhập đúng format ISO string theo backend.
                      </div>
                    </label>

                    <label className="label" style={{ minWidth: 220 }}>
                      Duration (seconds, optional)
                      <input
                        className="input"
                        type="number"
                        value={form.duration ?? ""}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            duration:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          }))
                        }
                        placeholder="3600"
                      />
                    </label>
                  </div>

                  <div className="hint">
                    Create sẽ gọi đúng <code>createContest(...)</code> hiện tại và
                    redirect sang contest detail.
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div style={{ display: "grid", gap: 14 }}>
                <div className="box">
                  <div className="box__head">Notes</div>
                  <div className="box__body">
                    <div className="hint">
                      • Draft: có thể thêm/xóa/reorder problems ở trang detail (nếu
                      backend cho phép).
                      <br />
                      • Khi publish/official thì nên khóa thao tác (logic nằm ở page
                      khác).
                    </div>
                  </div>
                </div>

                {saving && (
                  <div className="box">
                    <div className="box__head">Saving</div>
                    <div className="box__body">
                      <div className="hint">Đang tạo contest...</div>
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
