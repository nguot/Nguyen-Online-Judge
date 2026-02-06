import { useMemo, useState } from "react";
import UploadTextArea from "./UploadTextArea";
import type { ProblemInputDto, TestcaseEntity } from "../types/problem";
import "./ui.css";
import { useEffect } from "react";


type Props = {
  mode: "create" | "edit";
  value: ProblemInputDto;
  onChange: (v: ProblemInputDto) => void;
  onSubmit: () => void;
  submitting: boolean;
  isAdmin: boolean;
  submitLabel?: string;
  serverCheckError?: { expected: number; actual: number; missingNames: string[] } | null;
  disabled?: boolean;   // ✅ THÊM DÒNG NÀY
};

function updateAt<T>(arr: T[], i: number, v: T) {
  const copy = [...arr];
  copy[i] = v;
  return copy;
}

function removeAt<T>(arr: T[], i: number) {
  return arr.filter((_, idx) => idx !== i);
}

const emptyTestcase = (): TestcaseEntity => ({
  testcaseName: "",
  input: "",
  output: "",
  isSample: true,
  score: 0,
});

export default function ProblemForm({
  mode,
  value,
  onChange,
  onSubmit,
  submitting,
  isAdmin,
  submitLabel,
  serverCheckError,
}: Props) {
  const canEdit = isAdmin;

  const [tagText, setTagText] = useState("");

  const LANG_OPTIONS = [
    { label: "C++", value: "CPP", ext: "cpp" },
    { label: "Java", value: "JAVA", ext: "java" },
    { label: "Python", value: "PYTHON", ext: "py" },
  ] as const;

  type LangValue = typeof LANG_OPTIONS[number]["value"];

  const [solutionLang, setSolutionLang] = useState<LangValue | "">("");

  const setField = <K extends keyof ProblemInputDto>(k: K, v: ProblemInputDto[K]) => {
    onChange({ ...value, [k]: v });
  };

  const setTestcase = (i: number, tc: TestcaseEntity) => {
    setField("testcaseEntities", updateAt(value.testcaseEntities, i, tc));
  };

  const [showErrorModal, setShowErrorModal] = useState(false);

  const solutionExt =
    LANG_OPTIONS.find((l) => l.value === solutionLang)?.ext ?? "txt";

  const addTc = () => setField("testcaseEntities", [...value.testcaseEntities, emptyTestcase()]);
  const removeTc = (i: number) => setField("testcaseEntities", removeAt(value.testcaseEntities, i));

  useEffect(() => {
    if (serverCheckError) {
      setShowErrorModal(true);
    }
  }, [serverCheckError]);

  return (
    <div className="cf-paper">
      {showErrorModal && serverCheckError && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 8,
              width: 420,
              maxWidth: "90%",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#d32f2f" }}>
              ❌ Testcase mismatch
            </h3>

            <p>
              Server returned{" "}
              <b>{serverCheckError.actual}</b> /{" "}
              <b>{serverCheckError.expected}</b> testcases.
            </p>

            {serverCheckError.missingNames.length > 0 && (
              <div style={{ marginTop: 8 }}>
                Missing:
                <ul>
                  {serverCheckError.missingNames.map((n) => (
                    <li key={n}><b>{n}</b></li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ textAlign: "right", marginTop: 16 }}>
              <button
                className="btn btn--primary"
                onClick={() => setShowErrorModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cf-titlebar">
        <div>
          <div className="cf-title">{mode === "create" ? "Create Problem" : "Edit Problem"}</div>
          <div className="cf-subtitle">Upload solution/testcase files → value auto becomes MinIO key</div>
        </div>
      </div>

      <div className="cf-content">
        {serverCheckError && (
          <div className="alert alert--bad" style={{ marginBottom: 12 }}>
            Add/Update FAILED (by testcase rule): returned {serverCheckError.actual}/{serverCheckError.expected} testcases.
            {serverCheckError.missingNames.length > 0 && (
              <div style={{ marginTop: 6 }}>
                Missing: <b>{serverCheckError.missingNames.join(", ")}</b>
              </div>
            )}
          </div>
        )}

        <div className="form-row" style={{ marginBottom: 12 }}>
          <label className="label" style={{ minWidth: 120 }}>Title</label>
          <input className="input" value={value.title} disabled={!canEdit}
            onChange={(e) => setField("title", e.target.value)} />
        </div>

        <div className="form-row" style={{ marginBottom: 12 }}>
          <label className="label" style={{ minWidth: 120 }}>Level</label>
          <input className="input" value={value.level} disabled={!canEdit}
            onChange={(e) => setField("level", e.target.value)} />
        </div>

        <div className="form-row" style={{ marginBottom: 12 }}>
          <label className="label" style={{ minWidth: 120 }}>Score</label>
          <input className="input" type="number" value={value.score} disabled={!canEdit}
            onChange={(e) => setField("score", Number(e.target.value))} />
        </div>

        <div className="form-row" style={{ marginBottom: 12 }}>
          <label className="label" style={{ minWidth: 120 }}>Rating</label>
          <input className="input" type="number" value={value.rating} disabled={!canEdit}
            onChange={(e) => setField("rating", Number(e.target.value))} />
        </div>

        <div className="form-row" style={{ marginBottom: 12 }}>
          <label className="label" style={{ minWidth: 120 }}>Time Limit</label>
          <input className="input" type="number" value={value.timeLimit} disabled={!canEdit}
            onChange={(e) => setField("timeLimit", Number(e.target.value))} />
        </div>

        <div className="form-row" style={{ marginBottom: 12 }}>
          <label className="label" style={{ minWidth: 120 }}>Memory Limit</label>
          <input className="input" type="number" value={value.memoryLimit} disabled={!canEdit}
            onChange={(e) => setField("memoryLimit", Number(e.target.value))} />
        </div>

        <div className="form-row" style={{ marginBottom: 12 }}>
          <label className="label" style={{ minWidth: 120 }}>Tags</label>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                value={tagText}
                placeholder="VD: dp, graph, greedy"
                disabled={!canEdit}
                onChange={(e) => setTagText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!tagText.trim()) return;
                    setField("tags", [...(value.tags ?? []), tagText.trim()]);
                    setTagText("");
                  }
                }}
              />
              <button
                className="btn"
                type="button"
                disabled={!canEdit}
                onClick={() => {
                  if (!tagText.trim()) return;
                  setField("tags", [...(value.tags ?? []), tagText.trim()]);
                  setTagText("");
                }}
              >
                +
              </button>
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(value.tags ?? []).map((t) => (
                <span key={t} className="tag">
                  {t}
                  <button
                    className="btn btn--danger"
                    type="button"
                    onClick={() =>
                      setField("tags", value.tags.filter((x) => x !== t))
                    }
                  >
                    −
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 12 }}>
          <label className="label" style={{ minWidth: 120 }}>Image URLs (comma)</label>
          <input
            className="input"
            value={(value.imageUrls ?? []).join(", ")}
            disabled={!canEdit}
            onChange={(e) =>
              setField(
                "imageUrls",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
          />
        </div>

        <div className="form-row" style={{ marginBottom: 12 }}>
          <label className="label" style={{ minWidth: 120 }}>Input Type</label>
          <input className="input" value="stdin" disabled />
        </div>

        <div className="form-row" style={{ marginBottom: 12 }}>
          <label className="label" style={{ minWidth: 120 }}>Output Type</label>
          <input className="input" value="stdout" disabled />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="label">Description</label>
          <textarea className="input textarea" rows={6} value={value.description} disabled={!canEdit}
            onChange={(e) => setField("description", e.target.value)} />
        </div>

        <div className="form-row" style={{ marginBottom: 12 }}>
          <label className="label" style={{ minWidth: 120 }}>
            Solution Language
          </label>

          <select
            className="input"
            value={solutionLang}
            disabled={!canEdit}
            onChange={(e) => {
              const lang = e.target.value as LangValue;
              setSolutionLang(lang);

              // đồng bộ luôn vào supportedLanguage (backend dùng)
              setField("supportedLanguage", [lang]);
            }}
          >
            <option value="">-- Select language --</option>
            {LANG_OPTIONS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>

        </div>

        <UploadTextArea
          label="Solution"
          value={value.solution}
          onChange={(v) => setField("solution", v)}
          placeholder="Select language → paste code → upload"
          disabled={!solutionLang}
          buildFileName={() => `Main.${solutionExt}`}
        />



        <div style={{ marginTop: 20, marginBottom: 12, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
          <div className="form-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="hint" style={{ fontWeight: 'bold' }}>Testcases</div>
            {canEdit && (
              <button className="btn" type="button" onClick={addTc}>
                + Add testcase
              </button>
            )}
          </div>
        </div>

        <div>
          {value.testcaseEntities.map((tc, i) => (
            <div key={i} style={{ marginBottom: 20, padding: 12, border: '1px solid var(--line)', borderRadius: 8 }}>
              <div className="form-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="hint" style={{ fontWeight: 'bold' }}>Testcase #{i + 1}</div>
                {canEdit && (
                  <button className="btn btn--danger" type="button" onClick={() => removeTc(i)} style={{ fontSize: '12px', padding: '4px 8px' }}>
                    Remove
                  </button>
                )}
              </div>

              <div className="form-row" style={{ marginBottom: 12 }}>
                <label className="label" style={{ minWidth: 100 }}>Name</label>
                <input className="input" value={tc.testcaseName} disabled={!canEdit}
                  onChange={(e) => setTestcase(i, { ...tc, testcaseName: e.target.value })} />
              </div>

              <div className="form-row" style={{ marginBottom: 12 }}>
                <label className="label" style={{ minWidth: 100 }}>Score</label>
                <input className="input" type="number" value={tc.score} disabled={!canEdit}
                  onChange={(e) => setTestcase(i, { ...tc, score: Number(e.target.value) })} />
              </div>

              <div className="form-row" style={{ marginBottom: 12, alignItems: 'center' }}>
                <label className="label" style={{ minWidth: 100 }}>isSample</label>
                <input type="checkbox" checked={tc.isSample} disabled={!canEdit}
                  onChange={(e) => setTestcase(i, { ...tc, isSample: e.target.checked })} />
              </div>

              <UploadTextArea
                label="Input (MinIO key)"
                value={tc.input}
                onChange={(v) => setTestcase(i, { ...tc, input: v })}
                placeholder="Upload input file OR paste key..."
                rows={4}
              />

              <UploadTextArea
                label="Output (paste content → upload → becomes MinIO key)"
                value={tc.output}
                onChange={(v) => setTestcase(i, { ...tc, output: v })}
                placeholder="Paste output content here (or paste key). Then click Upload text..."
                rows={4}
                buildFileName={() => "output.txt"}
              />
            </div>
          ))}
        </div>

        <div className="form-row" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn--primary" type="button" onClick={onSubmit} disabled={!canEdit || submitting}>
            {submitting ? "Saving..." : submitLabel ?? (mode === "create" ? "Create" : "Update")}
          </button>
        </div>

        {!isAdmin && (
          <div className="alert alert--bad" style={{ marginTop: 12 }}>
            You are not admin → create/edit/delete is disabled.
          </div>
        )}
      </div>
    </div>
  );
}