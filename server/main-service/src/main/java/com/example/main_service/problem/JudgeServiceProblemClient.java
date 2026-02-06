package com.example.main_service.problem;

import com.example.main_service.problem.dto.ProblemEntity;
import com.example.main_service.problem.dto.ProblemInputDto;
import com.example.main_service.sharedAttribute.commonDto.CommonResponse;
import com.example.main_service.sharedAttribute.commonDto.PageRequestDto;
import com.example.main_service.sharedAttribute.commonDto.PageResult;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(
        name = "judgeProblemClient",
        url = "${judge.base-url:http://localhost:5000}",
        path = "${judge.api-prefix:/api/v1}/jude-service/problem"
)
public interface JudgeServiceProblemClient {
    @PostMapping("")
    CommonResponse<ProblemEntity> addProblem(@RequestBody ProblemInputDto input);

    @PostMapping("/clone")
    CommonResponse<ProblemEntity> cloneProblem(@RequestBody ProblemInputDto input);

    @PostMapping("/search")
    CommonResponse<PageResult<ProblemEntity>> getProblemPage(@RequestBody PageRequestDto<ProblemInputDto> input);

    @GetMapping("/{problemId}")
    CommonResponse<ProblemEntity> getProblemById(@PathVariable String problemId);

    @PostMapping("/{problemId}/edit")
    CommonResponse<ProblemEntity> updateProblem(@RequestBody ProblemInputDto input, @PathVariable String problemId);

    @PostMapping("/by-contest")
    CommonResponse<PageResult<ProblemEntity>> getProblemByContest(@RequestBody PageRequestDto<Long> input);

    @PostMapping("/search-text")
    CommonResponse<PageResult<ProblemEntity>> searchProblem(@RequestBody PageRequestDto<String> input);

    @DeleteMapping("/{problemId}")
    CommonResponse<ProblemEntity> deleteProblem(@PathVariable String problemId);
}

