package com.example.main_service.problem;

import com.example.main_service.problem.dto.ProblemEntity;
import com.example.main_service.problem.dto.ProblemInputDto;
import com.example.main_service.sharedAttribute.commonDto.CommonResponse;
import com.example.main_service.sharedAttribute.commonDto.PageRequestDto;
import com.example.main_service.sharedAttribute.commonDto.PageResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProblemHttpClient {

    private final JudgeServiceProblemClient judge;

    public ProblemEntity addProblem(ProblemInputDto input) {
        return unwrap(judge.addProblem(input));
    }

    public ProblemEntity cloneProblem(ProblemInputDto input) {
        return unwrap(judge.cloneProblem(input));
    }

    public PageResult<ProblemEntity> getProblemPage(PageRequestDto<ProblemInputDto> input) {
        return unwrap(judge.getProblemPage(input));
    }

    public ProblemEntity getProblemById(String problemId) {
        return unwrap(judge.getProblemById(problemId));
    }

    public ProblemEntity updateProblem(ProblemInputDto input, String problemId) {
        return unwrap(judge.updateProblem(input, problemId));
    }

    public PageResult<ProblemEntity> getProblemByContest(PageRequestDto<Long> input) {
        return unwrap(judge.getProblemByContest(input));
    }

    public PageResult<ProblemEntity> searchProblem(PageRequestDto<String> input) {
        return unwrap(judge.searchProblem(input));
    }

    public ProblemEntity deleteProblem(String problemId) {
        return unwrap(judge.deleteProblem(problemId));
    }

    private static <T> T unwrap(CommonResponse<T> res) {
        if (res == null) return null;
        if (Boolean.FALSE.equals(res.getIsSuccessfull())) {
            throw new RuntimeException(res.getMessage());
        }
        return res.getData();
    }
}
