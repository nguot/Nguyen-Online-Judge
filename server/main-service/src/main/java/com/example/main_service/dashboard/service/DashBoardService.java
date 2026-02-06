package com.example.main_service.dashboard.service;

import com.example.main_service.dashboard.dtos.DashBoardPageResponseDto;

public interface DashBoardService {

    void onSubmissionJudged(
            String submissionId,
            Long userId,
            Long contestId,
            String problemId,
            boolean allAccepted,
            long submitTimeEpochSeconds
    );

    DashBoardPageResponseDto getDashBoard(
            Long contestId,
            int offset,
            int limit
    );

    DashBoardPageResponseDto getDashBoardRunning(
            Long contestId,
            int offset,
            int limit
    );

    DashBoardPageResponseDto getDashBoardFinished(
            Long contestId,
            int offset,
            int limit
    );
    DashBoardPageResponseDto getFriendsRanking(Long contestId, Long userId, int offset, int limit);
}
