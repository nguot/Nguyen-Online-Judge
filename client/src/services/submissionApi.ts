// src/services/submissionApi.ts
import { apiClient } from "./apiClient";
import type { PageRequestDto, PageResult } from "../types/api";

export type SubmitRequestDto = {
  problemId: string;
  contestId: number;
  userId: number;
  sourceCode: string; // filename sau upload
  language: string;
};

export type SubmissionResultItemDto = {
  testcaseName: string;
  input: string | null;
  output: string;
  status: string;
  time: number;
  memory: number;
};

export type SubmissionDto = {
  submissionId: string;
  problemId: string;
  contestId: number;
  userId: number;
  sourceCode: string;
  language: string | null;
  submittedAt: string;
  result: SubmissionResultItemDto[];
  allAccepted: boolean;
};

// /submission/submit response trả về 1 SubmissionDto (nhìn mẫu của mày)
export type SubmitResponseDto = SubmissionDto;

export type SubmissionStatus = "AC" | "WA" | "CE" | "ML";

export type SubmissionSearchFilterDto = {
  contestId?: number;
  problemId?: string;      // giữ string theo DTO hiện tại của m
  userId?: number;
  statuses?: SubmissionStatus[]; // filter theo status tổng (nếu backend support)
};

export function deriveSubmissionStatus(sub: SubmissionDto): SubmissionStatus {
  const tc = sub.result?.map(x => x.status) ?? [];
  if (tc.some(s => s === "CE")) return "CE";
  if (tc.some(s => s === "ML")) return "ML";
  if (sub.allAccepted) return "AC";
  return "WA";
}

export const submissionApi = {
  submit: (body: SubmitRequestDto) =>
    apiClient.post<SubmitResponseDto>("/submission/submit", body),

  search: (req: PageRequestDto<SubmissionSearchFilterDto>) =>
    apiClient.post<PageResult<SubmissionDto>>("/submission/search", req),
  getById: (submissionId: string) =>
    apiClient.get<SubmissionDto>(`/submission/${submissionId}`),
};
