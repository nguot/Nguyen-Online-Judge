// src/services/submissionProgressWs.ts
import { submissionProgressStore } from "./submissionProgressStore";

export function connectSubmissionProgressWs(
  submissionId: string,
  onFinished?: (submissionId: string) => void,
  wsBaseUrl = "ws://localhost:8080"
) {
  const ws = new WebSocket(`${wsBaseUrl}/ws`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ submissionId })); // ✅ handler sẽ subscribe tại đây
  };

  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      console.log("WS progress msg:", e.data);
      submissionProgressStore.upsert({
        submissionId: data.submissionId,
        currentTest: data.currentTest,
        totalTests: data.totalTests,
        status: data.status,
      });
      if (data.totalTests > 0 && data.currentTest >= data.totalTests) {
        onFinished?.(data.submissionId);
      }
    } catch { }
  };

  ws.onerror = (e) => {
    console.error("WS error", e);
  };

  return { close: () => ws.close(), raw: ws };
}
