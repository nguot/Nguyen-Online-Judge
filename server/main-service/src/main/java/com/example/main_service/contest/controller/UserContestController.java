package com.example.main_service.contest.controller;

import com.example.main_service.contest.dto.userContest.*;
import com.example.main_service.sharedAttribute.commonDto.CommonResponse;
import com.example.main_service.contest.service.UserContestService;
import com.example.main_service.sharedAttribute.commonDto.PageRequestDto;
import com.example.main_service.sharedAttribute.commonDto.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import static com.example.main_service.rbac.RbacService.getUserIdFromToken;

@RestController
@RequestMapping("${api.prefix}/contest")
@RequiredArgsConstructor
public class UserContestController {

    private final UserContestService userContestService;

    @PostMapping("/{contestId}/register")
    public CommonResponse<ContestRegistrationResponseDto> registerUserToContest(@PathVariable("contestId") Long contestId) {
        return CommonResponse.success(userContestService.registerUser(contestId));
    }

    @PostMapping("{contestId}/registrations/search")
    public CommonResponse<PageResult<ContestRegistrationResponseDto>> getAllRegistration(
            @PathVariable("contestId") Long contestId,
            @RequestBody PageRequestDto<ContestRegistrationFilterDto> pageRequestDto
    ) {
        return CommonResponse.success(userContestService.getRegistration(contestId, pageRequestDto));
    }

    @DeleteMapping("/{contestId}/unregister")
    public CommonResponse<String> unregisterUserFromContest(
            @PathVariable("contestId") Long contestId
    ) {
        userContestService.unregisterUser(contestId,getUserIdFromToken());
        return CommonResponse.success("Unregister contest successfully");
    }
}
