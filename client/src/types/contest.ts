export type ContestType = "DRAFT" | "OFFICIAL";
export type ContestVisibility = "PUBLIC" | "PRIVATE";
export type ContestStatus = "UPCOMING" | "RUNNING" | "FINISHED"; // backend trả gì thì UI hiển thị đúng vậy
export type ContestRole = "AUTHOR" | "REVIEWER" | "ADMIN" | string;

// ===== /contest/search item (snake_case) =====
export type ContestSearchItem = {
  contestId: number;
  title: string;
  description: string;
  startTime: string | null;
  duration: number | null;
  contestStatus: ContestStatus;
  contestType: ContestType;
  author: number | null;
  rated: number | null;
  visibility: ContestVisibility;
  groupId: number | null;
  ratingCalculated: number | null;
};

export type ContestSearchFilter = {
  rated?: number;
  contestStatus?: ContestStatus;
  contestType?: ContestType;
  visibility?: ContestVisibility;
  groupId?: number;
  authorId?: number;
};

// ===== GET /contest/{contestId} detail (mixed keys đúng như sample) =====
export type ContestProblemItem = {
  id: number;
  contestId: number;
  problemId: string;
  problemLabel: string;
  problemOrder: number;
};

export type ContestDetail = {
  authorId: number;
  contestRole: ContestRole;
  contestStatus: ContestStatus;
  contestType: ContestType;

  contestId: number;
  title: string;
  description: string;
  startTime: string | null;
  duration: number | null;
  groupId: number | null;
  rated: number | null;
  visibility: ContestVisibility;

  problems: ContestProblemItem[];
};

// ===== Inputs =====
export type ContestCreateInput = {
  title: string;
  description: string;
  startTime?: string | null;
  duration?: number | null;
};

export type ContestEditInput = {
  title: string;
  description: string;
  startTime?: string | null;
  duration?: number | null;
};

export type AddContestProblemInput = {
  problemId: string;
  problemLabel: string;
};

// response của add problem (snake_case)
export type AddContestProblemResponse = {
  contest_id: number;
  problem_id: string;
  problem_label: string;
  problem_order: number;
};

export type MakeOfficialInput = {
  rated: 0 | 1;
  startTime: string;
  duration: number; // seconds
};
