import { apiClient } from "./apiClient";
import type { PageRequestDto } from "../types/api";
import type { ProblemEntity, ProblemInputDto } from "../types/problem";

export function addProblem(input: ProblemInputDto) {
  return apiClient.post<ProblemEntity>("/problem/add-problem", input);
}

// ✅ filter chỉ cần partial
export function searchProblems(req: PageRequestDto<Partial<ProblemInputDto>>) {
  return apiClient.postPage<ProblemEntity, Partial<ProblemInputDto>>("/problem/search", req);
}

// ✅ filter chỉ cần partial
export function byContest(req: PageRequestDto<Partial<ProblemInputDto>>) {
  return apiClient.postPage<ProblemEntity, Partial<ProblemInputDto>>("/problem/by-contest", req);
}

export function searchProblemsText(req: PageRequestDto<string>) {
  return apiClient.postPage<ProblemEntity, string>("/problem/search-text", req);
}

export function getProblemById(problemId: string) {
  return apiClient.get<ProblemEntity>(`/problem/get-by-id/${problemId}`);
}

export function updateProblem(problemId: string, input: ProblemInputDto) {
  return apiClient.post<ProblemEntity>(`/problem/update/${problemId}`, input);
}

export function deleteProblem(problemId: string) {
  return apiClient.del<ProblemEntity>(`/problem/delete/${problemId}`);
}
