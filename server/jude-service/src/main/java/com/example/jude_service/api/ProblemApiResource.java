package com.example.jude_service.api;

import com.example.jude_service.entities.PageRequestDto;
import com.example.jude_service.entities.problem.ProblemEntity;
import com.example.jude_service.entities.problem.ProblemInputDto;
import com.example.jude_service.entities.CommonResponse;
import com.example.jude_service.entities.PageResult;
import com.example.jude_service.services.ProblemService;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${api.prefix}/jude-service/problem")
@RequiredArgsConstructor
@Validated
public class ProblemApiResource {

    private final ProblemService problemService;

    @PostMapping(value = "")
    public CommonResponse<ProblemEntity> addProblem(@RequestBody ProblemInputDto input) {
        return problemService.addProblem(input);
    }

    @PostMapping(value = "/clone")
    public CommonResponse<ProblemEntity> cloneProblem(@RequestBody ProblemInputDto input) {
        return problemService.cloneProblem(input);
    }

    @PostMapping(value = "/search")
    public CommonResponse<PageResult<ProblemEntity>> getProblemPage(@RequestBody PageRequestDto<ProblemInputDto> input) {
        return problemService.getProblemPage(input);
    }

    @GetMapping(value = "/{problemId}")
    public CommonResponse<ProblemEntity> getProblemById(@PathVariable("problemId") String problemId) {
        return problemService.getProblemById(problemId);
    }

    @PostMapping(value = "/{problemId}/edit")
    public CommonResponse<ProblemEntity> updateProblem(@RequestBody ProblemInputDto input, @PathVariable("problemId") String problemId) {
        return problemService.updateProblem(input, problemId);
    }

    @PostMapping(value = "/by-contest")
    public CommonResponse<PageResult<ProblemEntity>> getProblemByContest(@RequestBody PageRequestDto<Long> input) {
        return problemService.getByContest(input);
    }

    @PostMapping(value = "/search-text")
    public CommonResponse<PageResult<ProblemEntity>> searchProblem(@RequestBody PageRequestDto<String> input) {
        return problemService.searching(input);
    }

    @DeleteMapping(value = "/{problemId}")
    public CommonResponse<ProblemEntity> deleteProblem(@PathVariable("problemId") String problemId) {
        return problemService.deleteProblem(problemId);
    }

}
