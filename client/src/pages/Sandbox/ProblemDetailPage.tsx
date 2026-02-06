import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../../components/ui.css";

import { uploadTextAsFile, readFileContent } from "../../services/uploadApi";
import { submissionApi } from "../../services/submissionApi";

import type { ProblemEntity } from "../../types/problem";
import { getIsAdmin, getUserId } from "../../storage/authStorage";
import { getProblemById } from "../../services/problemApi";

import { submissionProgressStore } from "../../services/submissionProgressStore";
import { connectSubmissionProgressWs } from "../../services/submissionProgressWs";
import { useRef } from "react";
import { useSubmissionProgressSnapshot } from "../../hooks/useSubmissionProgressSnapshot";


export default function ProblemDetailPage() {
  const nav = useNavigate();
  const { problemId } = useParams<{ problemId: string }>();
  const isAdmin = getIsAdmin();

  const [p, setP] = useState<ProblemEntity | null>(null);
  const [err, setErr] = useState("");

  const [language, setLanguage] = useState<string>("");
  const [sourceText, setSourceText] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [subs, setSubs] = useState<any[]>([]);
  const [subsTotal, setSubsTotal] = useState(0);

  // main tab
  const [mainTab, setMainTab] = useState<"statement" | "submissions">("statement");

  // modal detail
  const [openModal, setOpenModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);

  const [loadingSource, setLoadingSource] = useState(false);
  const [sourceContent, setSourceContent] = useState("");

  const [loadingTcFiles, setLoadingTcFiles] = useState(false);

  // cache file content by filename (source/input/output)
  const [fileCache, setFileCache] = useState<Record<string, string>>({});


  const isSandbox = (p?.contestId ?? 0) === 0;

  const wsRef = useRef<{ close: () => void } | null>(null);

  const pollingRef = useRef<Record<string, number>>({}); // submissionId -> count

  function langToExt(lang: string) {
    const m: Record<string, string> = {
      CPP: "cpp",
      C: "c",
      JAVA: "java",
      PYTHON: "py",
      PY: "py",
      JS: "js",
      JAVASCRIPT: "js",
      GO: "go",
    };
    return m[(lang ?? "").toUpperCase()] ?? "txt";
  }

  function overallStatus(s: any): string {
    if (s?.allAccepted) return "AC";
    const bad = (s?.result ?? []).find((r: any) => r?.status && r.status !== "AC");
    return bad?.status ?? "PENDING";
  }

  function badgeClass(st: string) {
    const x = (st ?? "").toUpperCase();
    if (x === "AC" || x === "ACCEPTED") return "badge badge--ac";
    if (x === "WA" || x === "WRONG_ANSWER") return "badge badge--wa";
    if (x === "CE" || x === "COMPILATION_ERROR") return "badge badge--ce";
    return "badge badge--other";
  }

  async function pollFinalSubmission(submissionId: string) {
    // poll tối đa 8 lần, mỗi lần cách 700ms
    for (let i = 0; i < 8; i++) {
      try {
        const s = await submissionApi.getById(submissionId);

        // update đúng row trong list
        setSubs((prev) =>
          prev.map((x) => (x.submissionId === submissionId ? s : x))
        );

        // điều kiện "đã có kết quả" (tùy backend của m)
        const hasResult = (s.result?.length ?? 0) > 0;
        const done = hasResult || s.allAccepted === true;

        if (done) return;
      } catch {
        // ignore rồi thử lại
      }
      await new Promise((r) => setTimeout(r, 700));
    }
  }

  // ✅ paste -> upload -> trả về filename
  async function uploadFromText(text: string) {
    if (!text?.trim()) throw new Error("Empty source");
    if (!language) throw new Error("Choose language first");

    setUploading(true);
    try {
      const fileName = `main.${langToExt(language)}`;
      const saved = await uploadTextAsFile(text, fileName);
      setUploadedFileName(saved);
      return saved;
    } finally {
      setUploading(false);
    }
  }

  async function loadSubmissions(problemId: string) {
    setLoadingSubs(true);
    try {
      const userId = getUserId();
      const page = await submissionApi.search({
        maxResultCount: 10,
        skipCount: 0,
        sorting: "submittedAt asc",
        filter: { problemId, ...(userId != null ? { userId } : {}) },
      });
      setSubsTotal(page.totalCount ?? 0);
      setSubs(page.data ?? []);
    } finally {
      setLoadingSubs(false);
    }
  }

  function getActualOutputFile(r: any): string {
    return (
      r?.actualOutput ??
      r?.actual_output ??
      r?.userOutput ??
      r?.user_output ??
      r?.stdout ??
      r?.actual ??
      r?.actualOutputFile ??
      r?.actual_output_file ??
      r?.output ??
      ""
    );
  }

  async function loadFileText(fileName: string): Promise<string> {
    if (!fileName) return "";
    if (fileCache[fileName]) return fileCache[fileName];

    try {
      const content = await readFileContent(fileName);
      setFileCache((prev) => ({ ...prev, [fileName]: content }));
      return content;
    } catch (e: any) {
      const msg = e?.message ?? "Failed to load file";
      setFileCache((prev) => ({ ...prev, [fileName]: msg }));
      return msg;
    }
  }

  async function prefetchSubmissionFiles(s: any) {
    const files = new Set<string>();

    // source code
    if (s?.sourceCode) files.add(String(s.sourceCode));

    // ✅ input + expected output lấy từ problem detail (filename/key trên MinIO)
    for (const tc of (p?.testcaseEntities ?? []) as any[]) {
      if (tc?.input) files.add(String(tc.input));
      if (tc?.output) files.add(String(tc.output));
    }

    // actual output (giữ như cũ: lấy từ submission result)
    for (const r of s?.result ?? []) {
      const act = getActualOutputFile(r);
      if (act) files.add(String(act));
    }

    // best-effort: tải hết file (không block UI nếu 1 file lỗi)
    await Promise.allSettled(Array.from(files).map((fn) => loadFileText(fn)));
  }

  async function openSubmissionDetail(s: any) {
    setSelectedSub(s);
    setOpenModal(true);

    const fileName = s?.sourceCode as string;
    setLoadingSource(true);
    setSourceContent("");
    try {
      if (!fileName) {
        setSourceContent("No sourceCode fileName");
      } else {
        const content = await loadFileText(fileName);
        setSourceContent(content);
      }
    } finally {
      setLoadingSource(false);
    }

    setLoadingTcFiles(true);
    try {
      await prefetchSubmissionFiles(s);
    } finally {
      setLoadingTcFiles(false);
    }
  }


  async function handleSubmit() {
    if (!p) return;
    if (isSandbox) return; // ✅ sandbox (contestId=0) thì không submit

    if (!language) return alert("Choose language first");
    if (!uploadedFileName) return alert("Paste code to upload first");

    setSubmitting(true);
    try {
      const userId = getUserId() ?? 0; // TODO: nếu null thì chặn submit

      const created = await submissionApi.submit({
        problemId: p.problemId,
        contestId: p.contestId,
        userId,
        sourceCode: uploadedFileName,
        language,
      });
      setSubs((prev) => [created, ...prev]);
      setMainTab("submissions");
      // created là SubmissionDto luôn
      const submissionId = created.submissionId;

      // ✅ init progress để tab submissions render ngay lập tức
      submissionProgressStore.upsert({
        submissionId,
        currentTest: 0,
        totalTests: 0,
        status: "RUNNING",
      });

      // ✅ close ws cũ (nếu user submit liên tục)
      wsRef.current?.close();

      // ✅ connect WS để nhận từng test
      wsRef.current = connectSubmissionProgressWs(submissionId, (id) => {
        pollFinalSubmission(id);
      });

      // ✅ (optional) chuyển tab sang submissions để thấy progress ngay
      setMainTab("submissions");

      // ✅ reload list (hoặc m có thể setSubs([created, ...subs]) cho instant)
      await loadSubmissions(p.problemId);

    } catch (e: any) {
      alert(e?.message ?? "Submit failed");
    } finally {
      setSubmitting(false);
    }

  }

  useEffect(() => {
    if (!problemId) {
      setErr("Missing problemId in route");
      return;
    }

    (async () => {
      try {
        const res = await getProblemById(problemId);
        setP(res);

        const firstLang = (res.supportedLanguage ?? [])[0] ?? "";
        setLanguage(firstLang);

        // ✅ PREFETCH SAMPLE FILE CONTENT
        const sampleFiles = new Set<string>();
        (res.testcaseEntities ?? [])
          .filter((t: any) => t.isSample)
          .forEach((t: any) => {
            if (t.input) sampleFiles.add(String(t.input));
            if (t.output) sampleFiles.add(String(t.output));
          });

        // 🔥 CHỖ QUAN TRỌNG BỊ THIẾU
        await Promise.allSettled(
          Array.from(sampleFiles).map((fn) => loadFileText(fn))
        );

        // chỉ load submissions khi contestId != 0
        if ((res.contestId ?? 0) !== 0) {
          loadSubmissions(res.problemId);
        }
      } catch (e: any) {
        setErr(e?.message ?? "Load failed");
      }
    })();
  }, [problemId]);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  const sampleTcs = useMemo(
    () => (p?.testcaseEntities ?? []).filter((t: any) => t.isSample),
    [p]
  );

  if (err) return <div className="alert alert--bad">{err}</div>;
  if (!p) return <div className="hint">Loading...</div>;

  function SubmissionRow({
    s,
    onClick,
    badgeClass,
    overallStatus,
  }: {
    s: any;
    onClick: () => void;
    badgeClass: (st: string) => string;
    overallStatus: (s: any) => string;
  }) {
    const prog = useSubmissionProgressSnapshot(s.submissionId);

    // ưu tiên status từ progress store
    const st =
      String(prog?.status).toUpperCase() === "RUNNING"
        ? "RUNNING"
        : overallStatus(s);


    const current = prog?.currentTest ?? 0;
    const total = prog?.totalTests ?? 0;
    const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

    return (
      <div className="submissionRow" onClick={onClick}>
        <div className="submissionId">{s.submissionId}</div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <div>
            <span className={badgeClass(st)}>{st}</span>
          </div>

          {/* ✅ thêm progress chỉ khi RUNNING */}
          {String(st).toUpperCase() === "RUNNING" && (
            <div style={{ width: 160 }}>
              <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>
                {current}/{total || "?"}
              </div>
              <div
                style={{
                  height: 6,
                  background: "#eee",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: "#3b82f6",
                    transition: "width 150ms linear",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="cf-paper">
      <div className="cf-titlebar">
        <div className="cf-titlebar__center">
          <div className="cf-title">{p.title}</div>
          <div className="cf-subtitle">
            time limit: {p.timeLimit} ms • memory limit: {p.memoryLimit} MB • stdin: {p.inputType} • stdout: {p.outputType}
          </div>
        </div>

        <div className="form-row cf-titlebar__actions">
          <Link className="btn" to="/problems">Back</Link>
          <button
            className={`btn btn--primary ${isAdmin ? "" : "btn--disabled"}`}
            onClick={() => isAdmin && nav(`/problems/${p.problemId}/edit`)}
          >
            Edit
          </button>
        </div>
      </div>

      <div className="cf-content">
        <div className="cf-grid">

          {/* MAIN */}
          <div className="cf-statement">

            {/* Tabs on MAIN (only when contestId != 0) */}
            {!isSandbox && (
              <div className="pd-tabs">
                <button
                  className={mainTab === "statement" ? "pd-tab pd-tab--active" : "pd-tab"}
                  onClick={() => setMainTab("statement")}
                >
                  Statement
                </button>
                <button
                  className={mainTab === "submissions" ? "pd-tab pd-tab--active" : "pd-tab"}
                  onClick={() => {
                    setMainTab("submissions");
                    loadSubmissions(p.problemId);
                  }}
                >
                  Submissions
                </button>
              </div>
            )}

            {/* ===== STATEMENT TAB ===== */}
            {(isSandbox || mainTab === "statement") && (
              <>
                <div className="box" style={{ marginBottom: 12 }}>
                  <div className="box__head">Problem</div>
                  <div className="box__body">
                    <p style={{ whiteSpace: "pre-wrap" }}>{p.description}</p>
                  </div>
                </div>

                <div className="box" style={{ marginBottom: 12 }}>
                  <div className="box__head">Sample tests</div>
                  <div className="box__body">
                    {sampleTcs.length === 0 ? (
                      <div className="hint">No sample tests</div>
                    ) : (
                      sampleTcs.map((t: any, idx: number) => (
                        <div key={idx} style={{ marginBottom: 14 }}>
                          <div className="hint" style={{ marginBottom: 8 }}>
                            {t.testcaseName || `sample #${idx + 1}`} • score: {t.score ?? 0}
                          </div>

                          {(() => {
                            const inFn = t.input ? String(t.input) : "";
                            const outFn = t.output ? String(t.output) : "";

                            const inText = inFn
                              ? fileCache[inFn] ?? "Loading..."
                              : "(none)";

                            const outText = outFn
                              ? fileCache[outFn] ?? "Loading..."
                              : "(none)";

                            return (
                              <>
                                <div className="sample-io" style={{ marginBottom: 8 }}>
                                  <div className="hint">stdin</div>
                                  <pre className="pre">{inText}</pre>
                                </div>

                                <div className="sample-io">
                                  <div className="hint">stdout</div>
                                  <pre className="pre">{outText}</pre>
                                </div>
                              </>
                            );
                          })()}

                        </div>
                      ))
                    )}
                  </div>
                </div>

                {(p.testcaseEntities ?? []).length > sampleTcs.length && (
                  <div className="box">
                    <div className="box__head">Hidden tests</div>
                    <div className="box__body">
                      <div className="hint">
                        Total tests: {(p.testcaseEntities ?? []).length} • Sample: {sampleTcs.length} • Hidden: {(p.testcaseEntities ?? []).length - sampleTcs.length}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ===== SUBMISSIONS TAB ===== */}
            {!isSandbox && mainTab === "submissions" && (
              <div className="box">
                <div
                  className="box__head"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span>Submissions</span>
                  <button
                    className="smallBtn"
                    onClick={() => loadSubmissions(p.problemId)}
                    disabled={loadingSubs}
                  >
                    Refresh
                  </button>
                </div>

                <div className="box__body">
                  {loadingSubs ? (
                    <div className="hint">Loading...</div>
                  ) : (
                    <div className="submissionList">
                      {subs.length === 0 ? (
                        <div className="submissionRow" style={{ cursor: "default" }}>
                          <div className="hint">No submissions</div>
                        </div>
                      ) : (
                        subs.map((s: any) => (
                          <SubmissionRow
                            key={s.submissionId}
                            s={s}
                            onClick={() => openSubmissionDetail(s)}
                            badgeClass={badgeClass}
                            overallStatus={overallStatus}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div>
            <div className="box" style={{ marginBottom: 12 }}>
              <div className="box__head">Info</div>
              <div className="box__body">
                <div className="kv"><span>ID</span><span style={{ wordBreak: "break-all" }}>{p.problemId}</span></div>
                <div className="kv"><span>Contest</span><span>{p.contestId}</span></div>
                <div className="kv"><span>Level</span><span>{p.level}</span></div>
                <div className="kv"><span>Rating</span><span>{p.rating}</span></div>
                <div className="kv"><span>Score</span><span>{p.score}</span></div>
              </div>
            </div>

            <div className="box" style={{ marginBottom: 12 }}>
              <div className="box__head">Tags</div>
              <div className="box__body">
                {(p.tags ?? []).length === 0 ? (
                  <div className="hint">No tags</div>
                ) : (
                  (p.tags ?? []).map((t: string) => <span className="tag" key={t}>{t}</span>)
                )}
              </div>
            </div>

            <div className="box" style={{ marginBottom: 12 }}>
              <div className="box__head">Languages</div>
              <div className="box__body">
                {(p.supportedLanguage ?? []).length === 0 ? (
                  <div className="hint">-</div>
                ) : (
                  (p.supportedLanguage ?? []).map((x: string) => <span className="tag" key={x}>{x}</span>)
                )}
              </div>
            </div>

            {/* Submit box */}
            {!isSandbox && (
              <div style={{ marginBottom: 12, border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Submit</div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <div style={{ minWidth: 80, opacity: 0.8 }}>Language</div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    {(p?.supportedLanguage ?? []).map((x: string) => (
                      <option key={x} value={x}>{x}</option>
                    ))}
                  </select>
                </div>

                <div style={{ opacity: 0.8, marginBottom: 6 }}>Paste code (auto upload on paste)</div>

                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  onPaste={async (e) => {
                    const text = e.clipboardData.getData("text");
                    if (!text) return;
                    e.preventDefault();
                    setSourceText(text);

                    try {
                      await uploadFromText(text);
                    } catch (err: any) {
                      alert(err?.message ?? "Upload failed");
                    }
                  }}
                  placeholder="// paste here..."
                  style={{ width: "100%", minHeight: 180, whiteSpace: "pre" }}
                />

                <div style={{ marginTop: 8, opacity: 0.8 }}>
                  uploaded file:{" "}
                  <span style={{ wordBreak: "break-all" }}>
                    {uploading ? "uploading..." : (uploadedFileName || "(none)")}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    onClick={handleSubmit}
                    disabled={uploading || submitting}
                    style={{ flex: 1 }}
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        await uploadFromText(sourceText);
                        alert("Re-uploaded");
                      } catch (err: any) {
                        alert(err?.message ?? "Upload failed");
                      }
                    }}
                    disabled={uploading || !sourceText.trim()}
                  >
                    Re-upload
                  </button>
                </div>
              </div>
            )}

            <div className="box">
              <div className="box__head">Resources</div>
              <div className="box__body">
                {p.solution ? (
                  <p>
                    <a href={p.solution} target="_blank" rel="noreferrer">Solution file</a>
                  </p>
                ) : (
                  <div className="hint">No solution file</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MODAL ===== */}
      {openModal && selectedSub && (
        <div className="modalOverlay" onMouseDown={() => setOpenModal(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <div className="modalTitle">Submission {selectedSub.submissionId}</div>
                <div className="modalSub">
                  {selectedSub.submittedAt} • {String(selectedSub.language)} • {overallStatus(selectedSub)}
                </div>
              </div>
              <button className="modalClose" onClick={() => setOpenModal(false)}>Close</button>
            </div>

            <div className="modalBody">
              {/* Single scrollable view: Source (top) -> Testcases (bottom) */}
              <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <div style={{ marginBottom: 16 }}>
                  <div className="hint" style={{ marginBottom: 8 }}>Source</div>
                  {loadingSource ? (
                    <div className="hint">Loading source...</div>
                  ) : (
                    <pre className="codeBox" style={{ maxHeight: "none", overflow: "visible" }}>
                      {sourceContent}
                    </pre>
                  )}
                </div>

                <div>
                  <div className="hint" style={{ marginBottom: 8 }}>
                    Testcases {loadingTcFiles ? "(loading files...)" : ""}
                  </div>

                  {(selectedSub.result ?? []).length === 0 ? (
                    <div className="hint">No testcase result</div>
                  ) : (
                    <div className="tcList">
                      {selectedSub.result.map((r: any, idx: number) => {
                        const tcList = p?.testcaseEntities ?? []; // hoặc p?.sampleTests ?? []
                        const tc = tcList[idx];

                        const inFn = tc?.input ? String(tc.input) : "";     // ✅ input từ problem detail
                        const outFn = tc?.output ? String(tc.output) : "";   // ✅ expected output từ problem detail
                        const actFn = r?.output ? String(r.output) : ""; // cái này là actualOutput real

                        const inText = inFn ? (fileCache[inFn] ?? (loadingTcFiles ? "Loading..." : "")) : "(none)";
                        const outText = outFn ? (fileCache[outFn] ?? (loadingTcFiles ? "Loading..." : "")) : "(none)";
                        const actText = actFn ? (fileCache[actFn] ?? (loadingTcFiles ? "Loading..." : "")) : "(none)";

                        return (
                          <div className="tcRow" key={idx}>
                            <div className="tcTop">
                              <div className="tcName">{tc?.testcaseName ?? r.testcaseName ?? `testcase #${idx + 1}`}</div>
                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <span className={badgeClass(r.status)}>{r.status ?? "-"}</span>
                                {r.time != null && <span className="tcSmall">t={r.time}</span>}
                                {r.memory != null && <span className="tcSmall">mem={r.memory}</span>}
                              </div>
                            </div>

                            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                              <div className="sample-io">
                                <div className="hint">input</div>
                                <pre className="pre">{inText}</pre>
                              </div>

                              <div className="sample-io">
                                <div className="hint">expected output</div>
                                <pre className="pre">{outText}</pre>
                              </div>

                              <div className="sample-io">
                                <div className="hint">actual output</div>
                                <pre className="pre">{actText}</pre>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}
