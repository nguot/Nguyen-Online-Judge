export type SubmissionProgress = {
  submissionId: string;
  currentTest: number;
  totalTests: number;
  status: string; // RUNNING/DONE/CE/RTE...
  updatedAt: number;
};

type Listener = () => void;

const map = new Map<string, SubmissionProgress>();
const listeners = new Set<Listener>();

export const submissionProgressStore = {
  upsert(p: Omit<SubmissionProgress, "updatedAt">) {
    map.set(p.submissionId, { ...p, updatedAt: Date.now() });
    listeners.forEach((l) => l());
  },
  get(submissionId: string) {
    return map.get(submissionId);
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {listeners.delete(listener)};
  },
};
