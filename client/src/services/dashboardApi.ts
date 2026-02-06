import {apiClient} from "./apiClient";

/* =======================
 * Types
 * ======================= */

export type SolvedProblem = {
  problemId: string;
  score: number;
};

export type DashboardItem = {
  user_id: number;
  user_name: string;
  score: number;
  penalty: number;
  rank: number;
  solvedProblems: SolvedProblem[];
};

export type DashboardPageResponse = {
  total: number;
  items: DashboardItem[];
};

export type CommonResponse<T> = {
  isSuccessfull: boolean;
  data: T;
  code: string;
  message: string;
};

/* =======================
 * API
 * ======================= */

/**
 * Get contest dashboard (ranking table)
 * POST /dashboard/page/{contestId}
 * body: { offset, limit }
 */
export async function getContestDashboard(
  contestId: string,
  offset = 0,
  limit = 10
): Promise<DashboardPageResponse> {
  return apiClient.post<DashboardPageResponse>(
    `/contest/dashboard/page/${contestId}`,
    { offset, limit }
  );
}

export async function getContestDashboardFriend(
  contestId: string,
  offset = 0,
  limit = 10
): Promise<DashboardPageResponse> {
  return apiClient.post<DashboardPageResponse>(
    `/contest/dashboard/page/${contestId}/friends`,
    { offset, limit }
  );
}

