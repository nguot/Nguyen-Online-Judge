package com.example.main_service.contest.service.impl;

import com.example.main_service.contest.dto.userContest.ContestRegistrationFilterDto;
import com.example.main_service.contest.dto.userContest.ContestRegistrationResponseDto;
import com.example.main_service.contest.service.ContestService;
import com.example.main_service.rbac.RoleService;
import com.example.main_service.sharedAttribute.exceptions.ErrorCode;
import com.example.main_service.sharedAttribute.exceptions.specException.ContestBusinessException;
import com.example.main_service.contest.model.ContestEntity;
import com.example.main_service.contest.model.ContestRegistrationEntity;
import com.example.main_service.contest.repo.ContestRegistrationRepo;
import com.example.main_service.contest.repo.ContestRepo;
import com.example.main_service.contest.repo.projections.ContestRegistrationProjection;
import com.example.main_service.contest.service.UserContestService;
import com.example.main_service.sharedAttribute.commonDto.PageRequestDto;
import com.example.main_service.sharedAttribute.commonDto.PageResult;
import com.example.main_service.sharedAttribute.enums.ContestType;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.List;

import static com.example.main_service.rbac.RbacService.getUserIdFromToken;

// handle luôn nếu header k có authorization thì trả về exception từ đầu
// ở đây mặc định là có head authorization

@Service
@Transactional
@RequiredArgsConstructor
public class UserContestServiceImpl implements UserContestService {

    private final ContestRepo contestRepo;
    private final ContestService contestService;
    private final ContestRegistrationRepo contestRegistrationRepo;
    private final RoleService roleService;   // thêm vào để check role

    @Override
    public ContestRegistrationResponseDto registerUser(Long contestId) {

        ContestEntity contest = getContestOrThrow(contestId);
        Long userId = getUserIdOrThrow();

        if (contestService.isContestFinished(contestId)) {
            throw new ContestBusinessException(ErrorCode.CONTEST_ENDED);
        }

        validateContestAccess(contest, roleService.hasSpecialContestRole(userId, contestId));

        if (contestRegistrationRepo.existsByContestIdAndUserId(contestId, userId)) {
            throw new ContestBusinessException(ErrorCode.CONTEST_ALREADY_REGISTERED);
        }

        contestRegistrationRepo.save(
                ContestRegistrationEntity.builder()
                        .contestId(contestId)
                        .userId(userId)
                        .build()
        );

        return ContestRegistrationResponseDto.builder()
                .contestId(contestId)
                .userId(userId)
                .build();
    }

    @Override
    public PageResult<ContestRegistrationResponseDto> getRegistration(
            Long contestId,
            PageRequestDto<ContestRegistrationFilterDto> input
    ) {

        if (!contestRepo.existsById(contestId)) {
            throw new ContestBusinessException(ErrorCode.CONTEST_NOT_FOUND);
        }

        Page<ContestRegistrationProjection> page =
                input.getFilter().getUserId() != null
                        ? contestRegistrationRepo.findByContestIdAndUserId(
                        contestId,
                        input.getFilter().getUserId(),
                        input.getPageRequest()
                )
                        : contestRegistrationRepo.findByContestId(
                        contestId,
                        input.getPageRequest()
                );

        List<ContestRegistrationResponseDto> data = page.map(p ->
                ContestRegistrationResponseDto.builder()
                        .contestId(p.getContestId())
                        .userId(p.getUserId())
                        .userName(p.getUserName())
                        .registeredAt(p.getRegisteredAt())
                        .build()
        ).getContent();

        return PageResult.<ContestRegistrationResponseDto>builder()
                .totalCount(page.getTotalElements())
                .data(data)
                .build();
    }



    @Override
    public void unregisterUser(Long contestId,Long userId) {

        if (contestService.isContestFinished(contestId)) {
            throw new ContestBusinessException(ErrorCode.CONTEST_ENDED);
        }

        if (!contestRegistrationRepo.existsByContestIdAndUserId(contestId, userId)) {
            throw new ContestBusinessException(ErrorCode.CONTEST_NOT_REGISTERED);
        }

        contestRegistrationRepo.deleteByContestIdAndUserId(contestId, userId);
    }


    private ContestEntity getContestOrThrow(Long contestId) {
        return contestRepo.findById(contestId)
                .orElseThrow(() -> new ContestBusinessException(ErrorCode.CONTEST_NOT_FOUND));
    }

    private Long getUserIdOrThrow() {
        Long userId = getUserIdFromToken();
        if (userId == null || userId == 0) {
            throw new ContestBusinessException(ErrorCode.USER_NOT_FOUND);
        }
        return userId;
    }

    private void validateContestAccess(ContestEntity contest, boolean isSpecial) {

        if (contest.getContestType() == ContestType.DRAFT && !isSpecial) {
            throw new ContestBusinessException(ErrorCode.CONTEST_ACCESS_DENY);
        }

        if ((contest.getContestType() == ContestType.GYM
                || contest.getContestType() == ContestType.OFFICIAL)
                && isSpecial) {
            throw new ContestBusinessException(ErrorCode.CONTEST_ACCESS_DENY);
        }
    }
}
