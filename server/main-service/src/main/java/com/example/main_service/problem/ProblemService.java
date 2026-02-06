package com.example.main_service.problem;

import com.example.main_service.contest.model.ContestEntity;
import com.example.main_service.contest.repo.ContestRepo;
import com.example.main_service.contest.service.ContestService;
import com.example.main_service.problem.dto.ProblemEntity;
import com.example.main_service.problem.dto.ProblemInputDto;
import com.example.main_service.problem.dto.TestcaseEntity;
import com.example.main_service.rbac.RbacService;
import com.example.main_service.sharedAttribute.commonDto.PageRequestDto;
import com.example.main_service.sharedAttribute.commonDto.PageResult;
import com.example.main_service.sharedAttribute.enums.ContestType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemHttpClient problemGrpcClient;
    private final ContestService contestService;
    private final ContestRepo contestRepo;
    private final RbacService rbacService;

    // =====================
    // CRUD
    // =====================

    public ProblemEntity addProblem(Long userId, ProblemInputDto input) {
        input.setUserId(userId);
        // chỉ gọi grpc + sanitize output
        ProblemEntity p = problemGrpcClient.addProblem(input);
        rbacService.assignRole(
                userId,
                "AUTHOR",
                "PROBLEM",
                p.getProblemId()
        );
        return p;
    }

    public ProblemEntity updateProblem(Long userId, String problemId, ProblemInputDto input) {
        ProblemEntity p = problemGrpcClient.updateProblem(input, problemId);
        return p;
    }

    public ProblemEntity deleteProblem(Long userId, String problemId) {
        ProblemEntity p = problemGrpcClient.deleteProblem(problemId);
        return sanitizeProblem(p);
    }

    public ProblemEntity getProblemById(Long userId, String problemId) {
        ProblemEntity p = problemGrpcClient.getProblemById(problemId);
        p = ensureCanViewProblemOrNull(userId, p);
        if(p.getAuthorId().equals(userId)) return p;
        return sanitizeProblem(p);
    }

    // =====================
    // PAGE / SEARCH
    // =====================

    public PageResult<ProblemEntity> getProblemPage(Long userId, PageRequestDto<ProblemInputDto> input) {
        PageResult<ProblemEntity> page = problemGrpcClient.getProblemPage(input);
        return filterPageByContestPermission(userId, page);
    }

    public PageResult<ProblemEntity> getProblemByContest(Long userId, PageRequestDto<Long> input) {
        PageResult<ProblemEntity> page = problemGrpcClient.getProblemByContest(input);
        return filterPageByContestPermission(userId, page);
    }

    public PageResult<ProblemEntity> getByContest(Long userId, PageRequestDto<Long> input) {
        return getProblemByContest(userId, input);
    }

    public PageResult<ProblemEntity> searchProblem(Long userId, PageRequestDto<String> input) {
        PageResult<ProblemEntity> page = problemGrpcClient.searchProblem(input);
        return filterPageByContestPermission(userId, page);
    }

    public PageResult<ProblemEntity> searching(Long userId, PageRequestDto<String> input) {
        return searchProblem(userId, input);
    }

    // =====================
    // INTERNAL HELPERS
    // =====================

    private PageResult<ProblemEntity> filterPageByContestPermission(Long userId, PageResult<ProblemEntity> page) {
        if (page == null || page.getData() == null) return page;

        List<ProblemEntity> filtered = page.getData().stream()
                .map(p -> ensureCanViewProblemOrNull(userId, p))
                .filter(Objects::nonNull)
                .map(this::sanitizeProblem)
                .toList();

        page.setData(filtered);
        return page;
    }
    private ProblemEntity ensureCanViewProblemOrNull(Long userId, ProblemEntity problem) {
        if (problem == null) return null;

        Long contestId = problem.getContestId();
        if(contestId==null) return null;

        ContestEntity contest = contestRepo.findById(contestId).orElse(null);

        if(contest==null) {
            if (contestId==0 && userId.equals(problem.getAuthorId())) return problem;
            return null;
        }

        boolean ok = contestService.canViewProblemInContest(userId, contest);
        if (ok==true) System.out.println(problem.getContestId());
        return ok ? problem : null;
    }

    private ProblemEntity sanitizeProblem(ProblemEntity problem) {
        if (problem == null) return null;

        List<TestcaseEntity> tcs = problem.getTestcaseEntities();
        if (tcs != null) {
            problem.setTestcaseEntities(
                    tcs.stream()
                            .map(tc -> {
                                if (tc == null) return null;
                                // Nếu không phải sample testcase, ẩn input/output
                                if (!Boolean.TRUE.equals(tc.getIsSample())) {
                                    tc.setInput(null);
                                    tc.setOutput(null);
                                }
                                return tc;
                            })
                            .toList()
            );
        }

        return problem;
    }
}
