import { apiClient } from "./apiClient";
import type { PageRequestDto, PageResult } from "../types/api";
import type {
  ContestCreateInput,
  ContestEditInput,
  ContestSearchFilter,
  ContestSearchItem,
  ContestDetail,
  AddContestProblemInput,
  AddContestProblemResponse,
  MakeOfficialInput,
} from "../types/contest";

// POST /contest
export function createContest(input: ContestCreateInput) {
  return apiClient.post<{ contestId: number }>("/contest", input);
}

// POST /contest/{contestId}/edit
export function editContest(contestId: number, input: ContestEditInput) {
  return apiClient.post<{ contestId: number }>(`/contest/${contestId}/edit`, input);
}

// POST /contest/search
export function searchContests(req: PageRequestDto<ContestSearchFilter>) {
  return apiClient.postPage<ContestSearchItem, ContestSearchFilter>("/contest/search", req);
}

// GET /contest/{contestId}
export function getContestDetail(contestId: number) {
  return apiClient.get<ContestDetail>(`/contest/${contestId}`);
}

// DELETE /contest/{contestId}
export function deleteContest(contestId: number) {
  return apiClient.del<{ message: string }>(`/contest/${contestId}`);
}

// POST /contest/{contestId}/problems
export function addProblemToContest(contestId: number, input: AddContestProblemInput) {
  return apiClient.post<AddContestProblemResponse>(`/contest/${contestId}/problems`, input);
}

// DELETE /contest/{contestId}/{problemId}
export function removeProblemFromContest(contestId: number, problemId: string) {
  return apiClient.del<string>(`/contest/${contestId}/problem/${problemId}`);
}

// POST /contest/{contestId}/problems/re-arrange  { list problemIds }
export function rearrangeContestProblems(contestId: number, problemIds: string[]) {
  return apiClient.post<string>(`/contest/${contestId}/problems/re-arrange`, {problemIds});
}

// POST /contest/{contestId}/make-official
export function makeContestOfficial(contestId: number, input: MakeOfficialInput) {
  return apiClient.post<string>(`/contest/${contestId}/make-official`, input);
}

// ===== Reviewers =====

// GET /contest/{contestId}/reviewers
// BE data:
// {
//   contestId: 10,
//   reviewers: [{ userId, username, email }]
// }
export type ContestReviewersResponse = {
  contestId: number;
  reviewers: Array<{
    userId: number;
    username: string;
    email: string;
  }>;
};

export function getContestReviewers(contestId: number) {
  return apiClient.get<ContestReviewersResponse>(`/contest/${contestId}/reviewers`);
}

// POST /contest/{contestId}/assign-reviewer/{reviewer_id}
// BE data: "Reviewer assigned successfully"
export function assignReviewerToContest(contestId: number, reviewerId: number) {
  // body không được nói rõ -> gửi {} cho chắc để fetch có payload hợp lệ
  return apiClient.post<string>(`/contest/${contestId}/assign-reviewer/${reviewerId}`, {});
}

// POST /contest/{contestId}/unassign-reviewer/{reviewer_id}
// BE data: "Reviewer unassigned successfully"
export function unassignReviewerFromContest(contestId: number, reviewerId: number) {
  return apiClient.post<string>(`/contest/${contestId}/unassign-reviewer/${reviewerId}`, {});
}

// POST /users/search-prefix
// BE data:
// {
//   totalCount: 1,
//   data: [{ id, username }]
// }
export type UserSearchPrefixResponse = {
  totalCount: number;
  data: Array<{
    id: number;
    username: string;
  }>;
};

export function searchUsersByPrefix(prefix: string) {
  return apiClient.post<UserSearchPrefixResponse>(`/users/search-prefix`, {
    maxResultCount: 10,
    skipCount: 0,
    sorting: "userId asc",
    filter: { prefix },
  });
}

// POST /contest/{contestId}/register
export function registerContest(contestId: number) {
  return apiClient.post<{
    contestId: number;
    userId: number;
    userName: string;
    registeredAt: string; // localDateTime
  }>(`/contest/${contestId}/register`, {});
}

// DELETE /contest/{contestId}/unregister
export function unregisterContest(contestId: number) {
  return apiClient.del<string>(`/contest/${contestId}/unregister`);
}

// POST /contest/{contestId}/registerations/search
export function searchContestRegistrations(
  contestId: number,
  req: PageRequestDto<{ userId?: number }>
) {
  return apiClient.postPage<
    {
      contestId: number;
      userId: number;
      userName: string;
      registeredAt: string; // localDateTime
    },
    { userId?: number }
  >(`/contest/${contestId}/registrations/search`, req);
}




