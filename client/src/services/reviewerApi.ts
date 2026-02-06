import { apiClient } from "./apiClient";

// ===== Reviewers APIs (đúng theo spec mày đưa) =====

// GET /contest/{contestId}/reviewers
export function getContestReviewers(contestId: number) {
  return apiClient.get<{
    contestId: number;
    reviewers: Array<{
      userId: number;
      username: string;
      email: string;
    }>;
  }>(`/contest/${contestId}/reviewers`);
}

// POST /contest/{contestId}/assign-reviewer/{reviewer_id}
export function assignReviewerToContest(contestId: number, reviewerId: number) {
  return apiClient.post<string>(`/contest/${contestId}/assign-reviewer/${reviewerId}`, {});
  // nếu backend không cần body thì {} ok, apiClient của mày thường vẫn post body
}

// POST /contest/{contestId}/unassign-reviewer/{reviewer_id}
export function unassignReviewerFromContest(contestId: number, reviewerId: number) {
  return apiClient.post<string>(`/contest/${contestId}/unassign-reviewer/${reviewerId}`, {});
}

// POST /users/search-prefix
export function searchUsersByPrefix(prefix: string) {
  return apiClient.post<{
    totalCount: number;
    data: Array<{
      id: number;
      username: string;
    }>;
  }>(`/users/search-prefix`, {
    maxResultCount: 10,
    skipCount: 0,
    sorting: "userId asc",
    filter: { prefix },
  });
}
