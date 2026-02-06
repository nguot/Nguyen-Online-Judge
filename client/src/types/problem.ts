export type TestcaseEntity = {
  testcaseName: string;
  input: string;   // MinIO key
  output: string;  // MinIO key
  isSample: boolean;
  score: number;
};

export type ProblemEntity = {
  problemId: string;
  contestId: number;
  title: string;
  description: string;
  tags: string[];
  imageUrls: string[];
  level: string;
  supportedLanguage: string[];
  solution: string;
  rating: number;
  score: number;
  timeLimit: number;
  memoryLimit: number;
  inputType: string;
  outputType: string;
  testcaseEntities: TestcaseEntity[];
  userId: number;
};

export type ProblemInputDto = Omit<ProblemEntity, "problemId">;
