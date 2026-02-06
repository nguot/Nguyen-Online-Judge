package com.example.main_service.contest.service;

import com.example.main_service.contest.dto.contest.ContestAttachProblemRequestDto;
import com.example.main_service.contest.dto.contestProblem.ContestProblemResponseDto;
import java.util.List;

public interface ContestProblemService {
    ContestProblemResponseDto addProblemToContest(Long userId,Long contestId, ContestAttachProblemRequestDto input);
    ContestProblemResponseDto addProblemToContestOfficial(Long userId,Long contestId, ContestAttachProblemRequestDto input);
    ContestProblemResponseDto addProblemToContestGym(
            Long userId,
            Long contestId,
            ContestAttachProblemRequestDto input
    );
    void deleteProblemFromContest(Long userId,Long contestId, String problemId);
    void reArrangeProblem(Long userId,Long contestId, List<String> problemIds);

}

