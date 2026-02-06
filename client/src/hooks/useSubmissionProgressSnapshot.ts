import { useEffect, useState } from "react";
import { submissionProgressStore } from "../services/submissionProgressStore";
import type { SubmissionProgress } from "../services/submissionProgressStore";

export function useSubmissionProgressSnapshot(submissionId?: string) {
  const [v, setV] = useState<SubmissionProgress | undefined>(
    submissionId ? submissionProgressStore.get(submissionId) : undefined
  );

  useEffect(() => {
    if (!submissionId) return;
    const unsub = submissionProgressStore.subscribe(() => {
      setV(submissionProgressStore.get(submissionId));
    });
    // init again
    setV(submissionProgressStore.get(submissionId));
    return unsub;
  }, [submissionId]);

  return v;
}
