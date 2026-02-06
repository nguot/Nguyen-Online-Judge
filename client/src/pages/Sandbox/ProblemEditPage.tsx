import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ProblemForm from "../../components/ProblemForm";
import { getProblemById, updateProblem } from "../../services/problemApi";
import { getIsAdmin } from "../../storage/authStorage";
import type { ProblemEntity, ProblemInputDto } from "../../types/problem";

function toInputDto(p: ProblemEntity): ProblemInputDto {
  // drop problemId
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { problemId, ...rest } = p;
  return rest;
}

export default function ProblemEditPage() {
  const { problemId } = useParams();
  const id = problemId;
  const nav = useNavigate();
  const isAdmin = true; //getIsAdmin();
  const loc = useLocation() as any;
  const [err, setErr] = useState("");
  const [val, setVal] = useState<ProblemInputDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverCheckError, setServerCheckError] = useState<{
    expected: number;
    actual: number;
    missingNames: string[];
  } | null>(loc?.state?.serverCheckError ?? null);

  useEffect(() => {
    (async () => {
      try {
        if (!problemId) {
          setErr("Missing problemId in route");
          return;
        }
        const res = await getProblemById(problemId);
        setVal(toInputDto(res));
      } catch (e: any) {
        alert(e?.message ?? "Load failed");
      }
    })();
  }, [id]);

  const expectedNames = useMemo(() => {
    if (!val) return new Set<string>();
    return new Set(val.testcaseEntities.map((t) => t.testcaseName).filter(Boolean));
  }, [val]);

  const submit = async () => {
    if (!isAdmin || !val) return;
    setSubmitting(true);
    setServerCheckError(null);
    try {
      if (!problemId) {
          setErr("Missing problemId in route");
          return;
        }
      const expected = val.testcaseEntities.length;
      const res = await updateProblem(problemId, val);
      const actual = res.testcaseEntities?.length ?? 0;

      if (actual !== expected) {
        const actualNames = new Set((res.testcaseEntities ?? []).map((t) => t.testcaseName).filter(Boolean));
        const missing = [...expectedNames].filter((n) => !actualNames.has(n));
        setServerCheckError({ expected, actual, missingNames: missing });
        return; // rule: coi là fail -> ở lại edit
      }

      nav(`/sandbox/problems/${id}`);
    } catch (e: any) {
      alert(e?.message ?? "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!val) return <div className="hint">Loading...</div>;

  return (
    <ProblemForm
      mode="edit"
      value={val}
      onChange={setVal}
      onSubmit={submit}
      submitting={submitting}
      isAdmin={isAdmin}
      submitLabel="Update"
      serverCheckError={serverCheckError}
    />
  );
}
