package com.example.main_service.contest.controller;

import com.example.main_service.contest.dto.contestProblem.RearrangeContestProblemRequestDto;
import com.example.main_service.sharedAttribute.commonDto.CommonResponse;
import com.example.main_service.sharedAttribute.commonDto.PageRequestDto;
import com.example.main_service.sharedAttribute.commonDto.PageResult;
import com.example.main_service.contest.dto.contest.*;
import com.example.main_service.contest.model.ContestEntity;
import com.example.main_service.contest.dto.contestProblem.ContestProblemResponseDto;
import com.example.main_service.contest.service.ContestProblemService;
import com.example.main_service.contest.service.ContestService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import static com.example.main_service.rbac.RbacService.getUserIdFromToken;


@RestController
@RequestMapping("${api.prefix}/contest")
@RequiredArgsConstructor
public class ContestController {
    private final ContestService contestService;
    private final ContestProblemService contestProblemService;

    @PostMapping("")
    public CommonResponse<ContestCreateUpdateResponseDto> create(@RequestBody ContestCreateUpdateRequestDto input) {
        return CommonResponse.success(contestService.createDraftContest(getUserIdFromToken(),input));
    }

    @PostMapping("/{contestId}/edit")
    public CommonResponse<ContestCreateUpdateResponseDto> update(
            @PathVariable Long contestId,
            @RequestBody ContestCreateUpdateRequestDto input) {
        return CommonResponse.success(contestService.updateContest(getUserIdFromToken(),contestId, input));
    }

    @PostMapping("/search")
    public CommonResponse<PageResult<ContestEntity>> getPages(@RequestBody PageRequestDto<ContestFilterDto> input) {
        return CommonResponse.success(contestService.search(getUserIdFromToken(),input));
    }

    @GetMapping("/{contestId}")
    public CommonResponse<ContestDetailDto> getById(@PathVariable Long contestId) {
        return CommonResponse.success(contestService.getContestDetail(getUserIdFromToken(),contestId));
    }

    @DeleteMapping("/{contestId}")
    @PreAuthorize("@rbacService.hasPermission(authentication, 'contest:edit', 'CONTEST', #contestId)")
    public CommonResponse<String> delete(@PathVariable Long contestId) {
        contestService.deleteContest(getUserIdFromToken(),contestId);
        return CommonResponse.success("delete contest success");
    }

    @PostMapping("/{contestId}/problems")
    @PreAuthorize("@rbacService.hasPermission(authentication, 'contest:edit', 'CONTEST', #contestId)")
    public CommonResponse<ContestProblemResponseDto> addProblem(
            @PathVariable Long contestId,
            @RequestBody ContestAttachProblemRequestDto input) {
        return CommonResponse.success(contestProblemService.addProblemToContest(getUserIdFromToken(),contestId, input));
    }

    @DeleteMapping("/{contestId}/problem/{problemId}")
    @PreAuthorize("@rbacService.hasPermission(authentication, 'contest:edit', 'CONTEST', #contestId)")
    public CommonResponse<String> deleteProblem(@PathVariable Long contestId, @PathVariable String problemId) {
        // official và gym (skip)
        contestProblemService.deleteProblemFromContest(getUserIdFromToken(),contestId, problemId);
        return CommonResponse.success();
    }

    // promote to gym
    @PostMapping("{contestId}/promote-to-group")
    @PreAuthorize("@rbacService.hasPermission(authentication, 'contest:edit', 'CONTEST', #contestId)")
    public CommonResponse<String> promoteDraftToGroup(
            @PathVariable("contestId") Long contestId,
            @RequestBody PromoteDraftToGymRequestDto input
    ) {
        contestService.promoteDraftToGym(getUserIdFromToken(),contestId, input);
        return CommonResponse.success("ContestId promoted to GYM sucessfully");
    }

    @PostMapping("/{contest_id}/make-official") //Pro_user or admin
    @PreAuthorize("@rbacService.hasPermission(authentication, 'contest:make_official', 'SYSTEM', 0)")
    public CommonResponse<String> promoteDrafttoOfficial (
           @PathVariable("contest_id") Long contestId,
                   @RequestBody PromoteDraftToOfficialRequestDto request
    ) {
        contestService.promoteDraftToOfficial(getUserIdFromToken(),contestId, request);
        return CommonResponse.success("ContestId promoted to OFFICIAL sucessfully");
    }

    @PostMapping("/{contestId}/problems/re-arrange")
    @PreAuthorize("@rbacService.hasPermission(authentication, 'contest:edit', 'CONTEST', #contestId)")
    public CommonResponse<String> reArrangeProblems(
            @PathVariable Long contestId,
            @RequestBody RearrangeContestProblemRequestDto input
    ) {
        contestProblemService.reArrangeProblem(getUserIdFromToken(),contestId, input.getProblemIds());
        return CommonResponse.success("Re-arrange problems successfully");
    }

    @PostMapping("/{contestId}/assign-reviewer/{reviewerId}")
    @PreAuthorize("@rbacService.hasPermission(authentication, 'contest:edit', 'CONTEST', #contestId)")
    public CommonResponse<String> assignReviewer(
            @PathVariable Long contestId,
            @PathVariable Long reviewerId
    ) {
        contestService.assignReviewer(getUserIdFromToken(),contestId, reviewerId);
        return CommonResponse.success("Reviewer assigned successfully");
    }

    @PostMapping("/{contestId}/unassign-reviewer/{reviewerId}")
    @PreAuthorize("@rbacService.hasPermission(authentication, 'contest:edit', 'CONTEST', #contestId)")
    public CommonResponse<String> unassignReviewer(
            @PathVariable Long contestId,
            @PathVariable Long reviewerId
    ) {
        contestService.unassignReviewer(getUserIdFromToken(), contestId, reviewerId);
        return CommonResponse.success("Reviewer unassigned successfully");
    }

    @GetMapping("/{contestId}/reviewers")
    @PreAuthorize("@rbacService.hasPermission(authentication, 'contest:edit', 'CONTEST', #contestId)")
    public CommonResponse<ContestReviewerListResponseDto> listReviewers(
            @PathVariable Long contestId
    ) {
        return CommonResponse.success(
                contestService.listReviewersByContestId(getUserIdFromToken(), contestId)
        );
    }

}
