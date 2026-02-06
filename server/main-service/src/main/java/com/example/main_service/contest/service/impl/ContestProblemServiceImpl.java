package com.example.main_service.contest.service.impl;

import com.example.main_service.contest.dto.contest.ContestAttachProblemRequestDto;
import com.example.main_service.contest.dto.contestProblem.ContestProblemResponseDto;
import com.example.main_service.contest.model.ContestEntity;
import com.example.main_service.contest.model.ContestProblemEntity;
import com.example.main_service.contest.repo.ContestProblemRepo;
import com.example.main_service.contest.repo.ContestRepo;
import com.example.main_service.contest.service.ContestProblemService;
import com.example.main_service.problem.ProblemHttpClient;
import com.example.main_service.problem.dto.ProblemEntity;
import com.example.main_service.problem.dto.ProblemInputDto;
import com.example.main_service.sharedAttribute.enums.ContestType;
import com.example.main_service.sharedAttribute.exceptions.ErrorCode;
import com.example.main_service.sharedAttribute.exceptions.specException.ContestBusinessException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ContestProblemServiceImpl implements ContestProblemService {

    private final ContestRepo contestRepo;
    private final ContestProblemRepo contestProblemRepo;
    private final ProblemHttpClient problemHttpClient;

    @Override
    @Transactional(rollbackOn = Exception.class)
    public ContestProblemResponseDto addProblemToContest(
            Long userId,
            Long contestId,
            ContestAttachProblemRequestDto input
    ) {
        requireUser(userId);
        if (contestId == null) throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR);
        if (input == null || input.getProblemId() == null)
            throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR);

        ContestEntity contest = getContestOrThrow(contestId);
        ensureDraft(contest);

        // =========================
        // clone problem:
        // 1) get original problem by input.problemId
        // 2) create new problem with contestId = this contestId (and remove old problemId)
        // =========================
        ProblemEntity original = problemHttpClient.getProblemById(input.getProblemId());
        if (original == null || original.getProblemId() == null) {
            throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR, "Problem goc khong ton tai");
        }

        ProblemInputDto cloneInput = ProblemInputDto.builder()
                .contestId(contestId)
                .title(original.getTitle())
                .description(original.getDescription())
                .level(original.getLevel())
                .timeLimit(original.getTimeLimit())
                .memoryLimit(original.getMemoryLimit())
                .inputType(original.getInputType())
                .outputType(original.getOutputType())
                .userId(userId) // author là user đang attach
                .imageUrls(original.getImageUrls())
                .solution(original.getSolution())
                .rating(original.getRating())
                .score(original.getScore())
                .tags(original.getTags())
                .supportedLanguage(original.getSupportedLanguage())
                .testcaseEntities(original.getTestcaseEntities())
                .build();

        ProblemEntity resp = problemHttpClient.cloneProblem(cloneInput);
        if (resp == null || resp.getProblemId() == null) {
            throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR, "Clone problem fail");
        }

        int nextOrder = contestProblemRepo.findMaxOrderByContestId(contestId).orElse(0) + 1;

        ContestProblemEntity entity = contestProblemRepo.save(
                ContestProblemEntity.builder()
                        .contestId(contestId)
                        .problemId(resp.getProblemId())
                        .problemLabel(input.getProblemLabel())
                        .problemOrder(nextOrder)
                        .build()
        );

        return ContestProblemResponseDto.builder()
                .contestId(contestId)
                .problemId(entity.getProblemId())
                .problemLabel(entity.getProblemLabel())
                .problemOrder(entity.getProblemOrder())
                .build();
    }

    @Override
    @Transactional(rollbackOn = Exception.class)
    public ContestProblemResponseDto addProblemToContestOfficial(
            Long userId,
            Long contestId,
            ContestAttachProblemRequestDto input
    ) {
        requireUser(userId);
        if (contestId == null) throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR);
        if (input == null || input.getProblemId() == null)
            throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR);

        ContestEntity contest = getContestOrThrow(contestId);
        ensureOfficial(contest);

        ProblemEntity original = problemHttpClient.getProblemById(input.getProblemId());
        if (original == null || original.getProblemId() == null) {
            throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR, "Problem goc khong ton tai");
        }

        ProblemInputDto cloneInput = ProblemInputDto.builder()
                .contestId(contestId)
                .title(original.getTitle())
                .description(original.getDescription())
                .level(original.getLevel())
                .timeLimit(original.getTimeLimit())
                .memoryLimit(original.getMemoryLimit())
                .inputType(original.getInputType())
                .outputType(original.getOutputType())
                .userId(userId) // author là user đang attach
                .imageUrls(original.getImageUrls())
                .solution(original.getSolution())
                .rating(original.getRating())
                .score(original.getScore())
                .tags(original.getTags())
                .supportedLanguage(original.getSupportedLanguage())
                .testcaseEntities(original.getTestcaseEntities())
                .build();

        ProblemEntity resp = problemHttpClient.cloneProblem(cloneInput);
        if (resp == null || resp.getProblemId() == null) {
            throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR, "Clone problem fail");
        }

        int nextOrder = contestProblemRepo.findMaxOrderByContestId(contestId).orElse(0) + 1;

        ContestProblemEntity entity = contestProblemRepo.save(
                ContestProblemEntity.builder()
                        .contestId(contestId)
                        .problemId(resp.getProblemId())
                        .problemLabel(input.getProblemLabel())
                        .problemOrder(nextOrder)
                        .build()
        );

        return ContestProblemResponseDto.builder()
                .contestId(contestId)
                .problemId(entity.getProblemId())
                .problemLabel(entity.getProblemLabel())
                .problemOrder(entity.getProblemOrder())
                .build();
    }

    @Override
    @Transactional(rollbackOn = Exception.class)
    public ContestProblemResponseDto addProblemToContestGym(
            Long userId,
            Long contestId,
            ContestAttachProblemRequestDto input
    ) {
        requireUser(userId);
        if (contestId == null) throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR);
        if (input == null || input.getProblemId() == null)
            throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR);

        ContestEntity contest = getContestOrThrow(contestId);
        ensureGym(contest);

        // =========================
        // clone problem giống như DRAFT và OFFICIAL
        // =========================
        ProblemEntity original = problemHttpClient.getProblemById(input.getProblemId());
        if (original == null || original.getProblemId() == null) {
            throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR, "Problem goc khong ton tai");
        }

        ProblemInputDto cloneInput = ProblemInputDto.builder()
                .contestId(contestId)
                .title(original.getTitle())
                .description(original.getDescription())
                .level(original.getLevel())
                .timeLimit(original.getTimeLimit())
                .memoryLimit(original.getMemoryLimit())
                .inputType(original.getInputType())
                .outputType(original.getOutputType())
                .userId(userId) // author là user đang attach
                .imageUrls(original.getImageUrls())
                .solution(original.getSolution())
                .rating(original.getRating())
                .score(original.getScore())
                .tags(original.getTags())
                .supportedLanguage(original.getSupportedLanguage())
                .testcaseEntities(original.getTestcaseEntities())
                .build();

        ProblemEntity resp = problemHttpClient.cloneProblem(cloneInput);
        if (resp == null || resp.getProblemId() == null) {
            throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR, "Clone problem fail");
        }

        int nextOrder = contestProblemRepo.findMaxOrderByContestId(contestId).orElse(0) + 1;

        ContestProblemEntity entity = contestProblemRepo.save(
                ContestProblemEntity.builder()
                        .contestId(contestId)
                        .problemId(resp.getProblemId())
                        .problemLabel(input.getProblemLabel())
                        .problemOrder(nextOrder)
                        .build()
        );

        return ContestProblemResponseDto.builder()
                .contestId(contestId)
                .problemId(entity.getProblemId())
                .problemLabel(entity.getProblemLabel())
                .problemOrder(entity.getProblemOrder())
                .build();
    }

    @Override
    @Transactional(rollbackOn = Exception.class)
    public void deleteProblemFromContest(Long userId, Long contestId, String problemId) {
        requireUser(userId);
        if (contestId == null || problemId == null)
            throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR);

        ContestEntity contest = getContestOrThrow(contestId);
        ensureDraft(contest);

        ContestProblemEntity entity = contestProblemRepo
                .findByContestIdAndProblemId(contestId, problemId)
                .orElseThrow(() -> new ContestBusinessException(ErrorCode.CONTEST_PROBLEM_NOT_FOUND));

        problemHttpClient.deleteProblem(problemId);

        contestProblemRepo.delete(entity);
    }

    @Override
    @Transactional
    public void reArrangeProblem(Long userId, Long contestId, List<String> problemIds) {
        requireUser(userId);
        if (contestId == null || problemIds == null)
            throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR);

        ContestEntity contest = getContestOrThrow(contestId);
        ensureDraft(contest);

        int order = 1;
        for (String problemId : problemIds) {
            contestProblemRepo.updateProblemOrder(contestId, problemId, order++);
        }
    }

    // =========================
    // helpers
    // =========================
    private void requireUser(Long userId) {
        if (userId == null || userId == 0) {
            throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR, "Khong biet user la ai");
        }
    }

    private ContestEntity getContestOrThrow(Long contestId) {
        return contestRepo.findById(contestId)
                .orElseThrow(() -> new ContestBusinessException(ErrorCode.CONTEST_NOT_FOUND));
    }

    private void ensureDraft(ContestEntity contest) {
        if (contest.getContestType() != ContestType.DRAFT) {
            throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR, "Contest k phải draft");
        }
    }

    private void ensureOfficial(ContestEntity contest) {
        if (contest.getContestType() != ContestType.OFFICIAL) {
            throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR, "Contest k phải official");
        }
    }

    private void ensureGym(ContestEntity contest) {
        if (contest.getContestType() != ContestType.GYM) {
            throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR, "Contest k phải gym");
        }
    }
}
