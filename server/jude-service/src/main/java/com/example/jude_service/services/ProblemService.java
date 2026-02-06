package com.example.jude_service.services;

import com.example.jude_service.entities.CommonResponse;
import com.example.jude_service.entities.PageRequestDto;
import com.example.jude_service.entities.PageResult;
import com.example.jude_service.entities.problem.ProblemEntity;
import com.example.jude_service.entities.problem.ProblemInputDto;

public interface ProblemService {
    CommonResponse<ProblemEntity> addProblem(ProblemInputDto input);
    CommonResponse<ProblemEntity> cloneProblem(ProblemInputDto input);
    CommonResponse<PageResult<ProblemEntity>> getProblemPage(PageRequestDto<ProblemInputDto> input);
    CommonResponse<ProblemEntity> getProblemById(String problemId);
    CommonResponse<PageResult<ProblemEntity>> getByContest(PageRequestDto<Long> input);
    CommonResponse<PageResult<ProblemEntity>> searching(PageRequestDto<String> input);
    CommonResponse<ProblemEntity> updateProblem(ProblemInputDto input, String problemId);
    CommonResponse<ProblemEntity> deleteProblem(String problemId);
}
