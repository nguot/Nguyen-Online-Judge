import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProblemForm from "../../components/ProblemForm";
import { addProblem } from "../../services/problemApi";
import { getIsAdmin } from "../../storage/authStorage";
import type { ProblemInputDto } from "../../types/problem";

const emptyProblem = (): ProblemInputDto => ({
  contestId: 0,
  title: "",
  description: "",
  tags: [],
  imageUrls: [],
  level: "EASY",
  supportedLanguage: [],
  solution: "",
  rating: 0,
  score: 0,
  timeLimit: 1,
  memoryLimit: 256,
  inputType: "stdin",
  outputType: "stdout",
  testcaseEntities: [],
  userId: 0,
});

export default function ProblemCreatePage() {
  const nav = useNavigate();
  const isAdmin = true; // getIsAdmin();

  const [val, setVal] = useState<ProblemInputDto>(emptyProblem());
  const [submitting, setSubmitting] = useState(false);

  const [serverCheckError, setServerCheckError] = useState<{
    expected: number;
    actual: number;
    missingNames: string[];
  } | null>(null);

  const expectedNames = useMemo(() => new Set(val.testcaseEntities.map((t) => t.testcaseName).filter(Boolean)), [val]);

  const submit = async () => {
    setSubmitting(true);
    setServerCheckError(null);
    try {
      const expected = val.testcaseEntities.length;
      val.inputType = "stdin";
      val.outputType = "stdout";
      val.supportedLanguage = ["CPP","PYTHON","JAVA"]; // fix cung
      const res = await addProblem(val);
      const actual = res.testcaseEntities?.length ?? 0;

      if (actual !== expected) {
        const actualNames = new Set((res.testcaseEntities ?? []).map((t) => t.testcaseName).filter(Boolean));
        const missing = [...expectedNames].filter((n) => !actualNames.has(n));

        setServerCheckError({ expected, actual, missingNames: missing });

        if (res.problemId) {
          nav(`/sandbox/problems/${res.problemId}/edit`, {
            state: { serverCheckError: { expected, actual, missingNames: missing } },
            replace: true,
          });
        }
        return;
      }

      nav(`/sandbox/problems/${res.problemId}`);
    } catch (e: any) {
      alert(e?.message ?? "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProblemForm
      mode="create"
      value={val}
      onChange={setVal}
      onSubmit={submit}
      submitting={submitting}
      isAdmin={isAdmin}
      submitLabel="Create"
      serverCheckError={serverCheckError}
    />
  );
}
