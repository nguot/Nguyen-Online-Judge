package com.example.jude_service.services;

import com.example.jude_service.entities.judge.JudgeResult;
import com.example.jude_service.entities.judge.TestCaseResult;
import com.example.jude_service.entities.submission.SubmissionEntity;
import com.example.jude_service.entities.submission.SubmissionInputDto;
import com.example.jude_service.entities.submission.SubmissionResultEntity;
import com.example.jude_service.repo.SubmissionRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionJudgeAsyncService {

    private final JudgeService judgeService;
    private final SubmissionRepo submissionRepo;

    @Async("judgeExecutor")
    public void judgeAndUpdate(String submissionId, SubmissionInputDto input) {
        try {
            JudgeResult judgeResult = judgeService.judge(submissionId, input, input.getProblemId());

            List<SubmissionResultEntity> results = judgeResult.getTestCaseResults().stream()
                    .map(this::convertToSubmissionResult)
                    .collect(Collectors.toList());

            SubmissionEntity entity = submissionRepo.findById(submissionId).orElseThrow();
            entity.setResult(results);
            // nếu m có field status/finalVerdict thì set thêm ở đây
            submissionRepo.save(entity);

        } catch (Exception e) {
            log.error("Async judge failed submissionId={}", submissionId, e);
            submissionRepo.findById(submissionId).ifPresent(entity -> {
                submissionRepo.save(entity);
            });
        }
    }

    private SubmissionResultEntity convertToSubmissionResult(TestCaseResult testCaseResult) {
        return SubmissionResultEntity.builder()
                .testcaseName(testCaseResult.getTestCaseId())
                .input(null)
                .output(testCaseResult.getActualOutput())
                .status(testCaseResult.getVerdict())
                .time(testCaseResult.getExecutionTime() != null ? testCaseResult.getExecutionTime().floatValue() : 0f)
                .memory(testCaseResult.getMemoryUsed() != null ? testCaseResult.getMemoryUsed().floatValue() : 0f)
                .build();
    }
}
