package com.example.main_service.contest.service.impl;

import com.example.main_service.contest.dto.contest.*;
import com.example.main_service.contest.model.ContestEntity;
import com.example.main_service.contest.model.ContestProblemEntity;
import com.example.main_service.contest.repo.ContestProblemRepo;
import com.example.main_service.contest.repo.ContestRegistrationRepo;
import com.example.main_service.contest.repo.ContestRepo;
import com.example.main_service.contest.service.ContestProblemService;
import com.example.main_service.contest.service.ContestService;
import com.example.main_service.contest.specification.ContestSpec;
import com.example.main_service.contest.utils.StringUtils;
import com.example.main_service.problem.ProblemService;
import com.example.main_service.rbac.RbacService;
import com.example.main_service.sharedAttribute.commonDto.PageRequestDto;
import com.example.main_service.sharedAttribute.commonDto.PageResult;
import com.example.main_service.sharedAttribute.enums.ContestStatus;
import com.example.main_service.sharedAttribute.enums.ContestType;
import com.example.main_service.sharedAttribute.enums.ContestVisibility;
import com.example.main_service.sharedAttribute.exceptions.ErrorCode;
import com.example.main_service.sharedAttribute.exceptions.specException.ContestBusinessException;
import com.example.main_service.user.model.UserEntity;
import com.example.main_service.user.repo.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;

@Service
@Transactional
@RequiredArgsConstructor
public class ContestServiceImpl implements ContestService {

    private final ContestRepo contestRepo;
    private final ContestProblemRepo contestProblemRepo;
    private final ContestProblemService contestProblemService;
    private final ContestRegistrationRepo contestRegistrationRepo;
    private final RbacService rbacService;
    private final UserRepo userRepo;
    // =========================
    // CREATE
    // =========================
    @Override
    @Transactional(rollbackOn = Exception.class)
    public ContestCreateUpdateResponseDto createDraftContest(Long userId, ContestCreateUpdateRequestDto input) {
        requireUser(userId);

        ContestEntity entity = ContestEntity.builder()
                .title(input.getTitle())
                .description(input.getDescription())
                .startTime(input.getStartTime()) // nullable
                .duration(input.getDuration())
                .contestStatus(ContestStatus.FINISHED)
                .contestType(ContestType.DRAFT)
                .author(userId)
                .rated(input.getRated() != null ? input.getRated() : 0L)
                .visibility(ContestVisibility.PRIVATE)
                .groupId(input.getGroupId())
                .ratingCalculated(Boolean.TRUE)
                .build();

        validateContest(entity);

        ContestEntity saved = contestRepo.save(entity);

        rbacService.assignRole(
                userId,
                "AUTHOR",
                "CONTEST",
                String.valueOf(saved.getContestId())
        );

        return ContestCreateUpdateResponseDto.builder()
                .contestId(saved.getContestId())
                .build();
    }

    // =========================
    // UPDATE (router)
    // =========================
    @Override
    @Transactional(rollbackOn = Exception.class)
    public ContestCreateUpdateResponseDto updateContest(Long userId, Long contestId, ContestCreateUpdateRequestDto input) {
        requireUser(userId);
        ContestEntity contest = getContestOrThrow(contestId);

        return switch (contest.getContestType()) {
            case OFFICIAL -> updateOfficial(userId, contest, input);
            case GYM -> updateGym(userId, contest, input);
            case DRAFT -> updateDraft(userId, contest, input);
        };
    }

    private ContestCreateUpdateResponseDto updateOfficial(Long userId, ContestEntity contest, ContestCreateUpdateRequestDto input) {
        // rule: official must upcoming + admin-only
        if (!isUpcoming(contest)) throw new ContestBusinessException(ErrorCode.CONTEST_ERROR);
        if (!rbacService.isAdmin(userId)) throw new ContestBusinessException(ErrorCode.CONTEST_ACCESS_DENY);

        applyUpdateFields(contest, input);
        validateContest(contest);
        contestRepo.save(contest);

        return ContestCreateUpdateResponseDto.builder()
                .contestId(contest.getContestId())
                .build();
    }

    private ContestCreateUpdateResponseDto updateGym(Long userId, ContestEntity contest, ContestCreateUpdateRequestDto input) {
        ensureAuthorOrAdmin(userId, contest);

        // Chỉ update các field được phép cho GYM
        if (StringUtils.isNotNullOrBlank(input.getTitle())) contest.setTitle(input.getTitle());
        if (StringUtils.isNotNullOrBlank(input.getDescription())) contest.setDescription(input.getDescription());

        validateContest(contest);
        contestRepo.save(contest);

        return ContestCreateUpdateResponseDto.builder()
                .contestId(contest.getContestId())
                .build();
    }

    private ContestCreateUpdateResponseDto updateDraft(Long userId, ContestEntity contest, ContestCreateUpdateRequestDto input) {
        // draft: author/admin
        ensureAuthorOrAdmin(userId, contest);

        applyUpdateFields(contest, input);
        validateContest(contest);
        contestRepo.save(contest);

        return ContestCreateUpdateResponseDto.builder()
                .contestId(contest.getContestId())
                .build();
    }

    private void applyUpdateFields(ContestEntity contest, ContestCreateUpdateRequestDto input) {
        if (StringUtils.isNotNullOrBlank(input.getTitle())) contest.setTitle(input.getTitle());
        if (StringUtils.isNotNullOrBlank(input.getDescription())) contest.setDescription(input.getDescription());
        if (input.getStartTime() != null) contest.setStartTime(input.getStartTime());
        if (input.getDuration() != null) contest.setDuration(input.getDuration());
        if (input.getRated() != null) contest.setRated(input.getRated());
        if (input.getGroupId() != null) contest.setGroupId(input.getGroupId());
    }

    // =========================
    // DELETE
    // =========================
    @Override
    @Transactional(rollbackOn = Exception.class)
    public void deleteContest(Long userId, Long contestId) {
        requireUser(userId);
        if (contestId == null) throw new ContestBusinessException(ErrorCode.CONTEST_ERROR);

        ContestEntity contest = getContestOrThrow(contestId);
        ensureCanDelete(userId, contest);

        // official/gym: đang chạy hoặc đã xong thì không cho xóa
        if (contest.getContestType() == ContestType.OFFICIAL) {
            if (!isUpcoming(contest)) throw new ContestBusinessException(ErrorCode.CONTEST_ERROR);
        }

        contestRepo.deleteById(contestId);
    }

    // =========================
    // SEARCH
    // =========================
    @Override
    public PageResult<ContestEntity> search(Long userId, PageRequestDto<ContestFilterDto> input) {
        requireUser(userId);

        ContestFilterDto filter = input.getFilter();
        Specification<ContestEntity> spec = buildSearchSpec(filter);

        var page = contestRepo.findAll(spec, input.getPageRequest());

        List<ContestEntity> data = page.getContent().stream()
                .map(c -> filterContest(userId, c))
                .filter(Objects::nonNull)
                .toList();

        PageResult<ContestEntity> result = new PageResult<>();
        result.setData(data);
        result.setTotalCount(page.getTotalElements()); // giữ logic paging theo DB (lọc response thôi)
        return result;
    }

    private Specification<ContestEntity> buildSearchSpec(ContestFilterDto filter) {
        if (filter == null) {
            return Specification.where((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("rated"), 0L));
        }

        if (filter.getRated() == null) filter.setRated(0L);

        Specification<ContestEntity> spec = Specification.where(ContestSpec.hasRated(filter.getRated()));

        if (filter.getContestStatus() != null) spec = spec.and(ContestSpec.hasContestStatus(filter.getContestStatus()));
        if (filter.getContestType() != null) spec = spec.and(ContestSpec.hasContestType(filter.getContestType()));
        if (filter.getGroupId() != null) spec = spec.and(ContestSpec.hasGroupId(filter.getGroupId()));
        if (filter.getAuthorId() != null) spec = spec.and(ContestSpec.hasAuthorId(filter.getAuthorId()));
        if (filter.getVisibility() != null) spec = spec.and(ContestSpec.hasVisibility(filter.getVisibility()));

        return spec;
    }

    private ContestEntity filterContest(Long userId, ContestEntity contest) {
        // PRIVATE DRAFT contest: chỉ author/admin/reviewer mới được thấy
        // PUBLIC => thoai mai
        if (contest.getVisibility() == ContestVisibility.PRIVATE) {
            boolean canView = isAuthor(userId, contest)
                    || rbacService.isAdmin(userId)
                    || isReviewer(userId, contest)
                    || (contest.getGroupId() != null && rbacService.isGroupMember(userId, contest.getGroupId()));

            if (!canView) return null;
        }
        contest.setContestStatus(resolveStatus(contest));
        return contest;
    }

    // =========================
    // DETAIL
    // =========================
    @Override
    public ContestDetailDto getContestDetail(Long userId, Long contestId) {
        requireUser(userId);
        ContestEntity contest = getContestOrThrow(contestId);

        ensureCanView(userId, contest);

        ContestSummaryDto summary = toSummaryDto(contest);

        boolean canViewProblems = canViewProblemInContest(userId, contest);
        List<ContestProblemEntity> problemIds = canViewProblems ? loadProblemIds(contestId) : List.of();

        String contestRole = isAuthor(userId,contest) ? "AUTHOR" : (isReviewer(userId,contest) ? "REVIEWER" : "PARTICIPANT");

        ContestDetailDto response = ContestDetailDto.builder()
                .problems(problemIds)
                .contestRole(contestRole)
                .build();

        BeanUtils.copyProperties(summary, response);
        return response;
    }

    @Override
    public Boolean canViewProblemInContest(Long userId, ContestEntity contest) {

        if (rbacService.isAdmin(userId) || isAuthor(userId, contest) || isReviewer(userId,contest)) return true;

        // Group member có thể xem nếu contest thuộc group của họ
        if (contest.getGroupId() != null && rbacService.isGroupMember(userId, contest.getGroupId())) {
            return true; // tạm thời contest group k thi
        }
        ContestStatus status = resolveStatus(contest);

        if (status == ContestStatus.UPCOMING) return false;
        if (status == ContestStatus.FINISHED) return true;

        if (status == ContestStatus.RUNNING) {
            return contestRegistrationRepo.existsByContestIdAndUserId(contest.getContestId(), userId);
        }

        return false;
    }

    private ContestSummaryDto toSummaryDto(ContestEntity contest) {
        return ContestSummaryDto.builder()
                .contestId(contest.getContestId())
                .title(contest.getTitle())
                .description(contest.getDescription())
                .startTime(contest.getStartTime())
                .duration(contest.getDuration())
                .contestType(contest.getContestType())
                .contestStatus(resolveStatus(contest))
                .authorId(contest.getAuthor())
                .rated(contest.getRated())
                .visibility(contest.getVisibility())
                .groupId(contest.getGroupId())
                .build();
    }

    private List<ContestProblemEntity> loadProblemIds(Long contestId) {
        return contestProblemRepo.findProblemIdsByContestId(contestId);
    }

    // =========================
    // PROMOTE
    // =========================
    @Override
    @Transactional
    public void promoteDraftToGym(Long userId, Long contestId, PromoteDraftToGymRequestDto input) {
        requireUser(userId);

        ContestEntity draft = getContestOrThrow(contestId);

        if (draft.getContestType() != ContestType.DRAFT) {
            throw new ContestBusinessException(ErrorCode.CONTEST_ERROR);
        }

        ensureAuthorOrAdmin(userId, draft);

        // ===== CLONE BASE INFO =====
        ContestEntity gym = new ContestEntity();

        gym.setTitle(draft.getTitle());
        gym.setDescription(draft.getDescription());
        gym.setAuthor(draft.getAuthor());

        ///  tam thoi cho contest finished luon
//        gym.setStartTime(input.getStartTime() != null ? input.getStartTime() : draft.getStartTime());
//        gym.setDuration(input.getDuration() != null ? input.getDuration() : draft.getDuration());
        gym.setGroupId(input.getGroupId() != null ? input.getGroupId() : draft.getGroupId());

        // ===== SET GYM FLAGS =====
        gym.setContestType(ContestType.GYM);
        gym.setVisibility(ContestVisibility.PRIVATE); // Mặc định PRIVATE
        gym.setRated(0L); // GYM không rated
        gym.setContestStatus(ContestStatus.FINISHED);

        // ===== SAVE GYM FIRST (để có id) =====
        Long contestGymId = contestRepo.save(gym).getContestId();

        // ===== CLONE CONTEST - PROBLEM MAPPING =====
        List<ContestProblemEntity> draftLinks = contestProblemRepo.findProblemIdsByContestId(draft.getContestId());

        for (ContestProblemEntity link : draftLinks) {
            ContestAttachProblemRequestDto req = new ContestAttachProblemRequestDto();
            req.setProblemId(String.valueOf(link.getProblemId()));
            req.setProblemLabel(link.getProblemLabel());

            contestProblemService.addProblemToContestGym(
                    draft.getAuthor(),
                    contestGymId,
                    req
            );
        }

        // ===== CLONE ROLE-USER =====
        rbacService.cloneRoleUsersForScope(
                "CONTEST",
                draft.getContestId().toString(),
                "CONTEST",
                contestGymId.toString()
        );
    }

    @Override
    @Transactional
    public void promoteDraftToOfficial(Long userId, Long contestId, PromoteDraftToOfficialRequestDto input) {
        requireUser(userId);

        ContestEntity draft = getContestOrThrow(contestId);

        if (draft.getContestType() != ContestType.DRAFT) {
            throw new ContestBusinessException(ErrorCode.CONTEST_ERROR);
        }

        ensureAuthorOrAdmin(userId, draft);

        // ===== CLONE BASE INFO =====
        ContestEntity official = new ContestEntity();

        official.setTitle(draft.getTitle());
        official.setDescription(draft.getDescription());
        official.setAuthor(draft.getAuthor());

        // ===== OVERRIDE BY INPUT (ưu tiên input, fallback draft) =====
        official.setStartTime(input.getStartTime() != null ? input.getStartTime() : draft.getStartTime());
        official.setDuration(input.getDuration() != null ? input.getDuration() : draft.getDuration());

        Long ratedVal = input.getRated() != null ? input.getRated() : draft.getRated();
        official.setRated(ratedVal != null ? ratedVal : 0L);
        if(ratedVal==0) official.setRatingCalculated(Boolean.TRUE);

        // ===== SET OFFICIAL FLAGS =====
        official.setContestType(ContestType.OFFICIAL);
        official.setVisibility(ContestVisibility.PUBLIC);

        // resolveStatus dựa trên official (startTime/duration đã set)
        official.setContestStatus(resolveStatus(official));

        // validate BEFORE save để bắt lỗi duration/startTime null sớm
        validateContest(official);

        // ===== SAVE OFFICIAL FIRST (để có id) =====
        Long contestOfficialId = contestRepo.save(official).getContestId();

        // ===== CLONE CONTEST - PROBLEM MAPPING ===
        List<ContestProblemEntity> draftLinks = contestProblemRepo.findProblemIdsByContestId(draft.getContestId());

        for (ContestProblemEntity link : draftLinks) {
            ContestAttachProblemRequestDto req = new ContestAttachProblemRequestDto();
            req.setProblemId(String.valueOf(link.getProblemId()));     // nếu problemId trong entity là Long/Integer
            req.setProblemLabel(link.getProblemLabel());

            contestProblemService.addProblemToContestOfficial(
                    draft.getAuthor(),
                    contestOfficialId,
                    req
            );
        }
        // clone ca trong role-user
        rbacService.cloneRoleUsersForScope("CONTEST",draft.getContestId().toString(),"CONTEST",contestOfficialId.toString());
    }


    // =========================
    // REVIEWER
    // =========================
    @Override
    @Transactional
    public void assignReviewer(Long userId, Long contestId, Long reviewerId) {
        requireUser(userId);
        ContestEntity contest = getContestOrThrow(contestId);

        rbacService.assignRole(reviewerId, "REVIEWER", "CONTEST", contestId.toString());

        List<String> problemIds = contestProblemRepo.findProblemIdsByContestId(contestId)
                .stream()
                .map(ContestProblemEntity::getProblemId)   // hoặc getProblemId().toString() nếu là Integer/Long
                .toList();

        for (String problemId : problemIds) {
            rbacService.assignRole(reviewerId, "REVIEWER", "PROBLEM", problemId);
        }
    }

    @Override
    @Transactional
    public void unassignReviewer(Long userId, Long contestId, Long reviewerId) {
        requireUser(userId);
        ContestEntity contest = getContestOrThrow(contestId);

        // 1) Gỡ quyền reviewer ở contest scope
        rbacService.unassignRole(reviewerId, "REVIEWER", "CONTEST", contestId.toString());

        // 2) Gỡ quyền reviewer ở từng problem thuộc contest
        List<String> problemIds = contestProblemRepo.findProblemIdsByContestId(contestId)
                .stream()
                .map(ContestProblemEntity::getProblemId)
                .toList();

        for (String problemId : problemIds) {
            rbacService.unassignRole(reviewerId, "REVIEWER", "PROBLEM", problemId);
        }
    }

    @Override
    public ContestReviewerListResponseDto listReviewersByContestId(Long userId, Long contestId) {
        requireUser(userId);
        getContestOrThrow(contestId);

        List<Long> reviewerIds = rbacService.listUserIdsByRole("REVIEWER", "CONTEST", contestId.toString());

        List<UserEntity> users = new java.util.ArrayList<>();
        userRepo.findAllById(reviewerIds).forEach(users::add);

        return ContestReviewerListResponseDto.builder()
                .contestId(contestId)
                .reviewers(
                        users.stream()
                                .map(u -> ContestReviewerListResponseDto.ContestReviewerItemDto.builder()
                                        .userId(u.getUserId())
                                        .username(u.getUserName())
                                        .email(u.getEmail())
                                        .build()
                                )
                                .toList()
                )
                .build();
    }


    // =========================
    // REGISTRATION
    // =========================
    @Override
    public Boolean isUserRegistered(Long contestId, Long userId) {
        return contestRegistrationRepo.existsByContestIdAndUserId(contestId, userId);
    }
    @Override
    public Boolean canUserSubmit(Long contestId, Long userId) {
        requireUser(userId);
        ContestEntity contest = getContestOrThrow(contestId);

        return canViewProblemInContest(userId, contest);
    }

    @Override
    public List<ContestEntity> findFinishedOfficialNotRated(LocalDateTime now) {
        return contestRepo.findFinishedOfficialNotRated(
                ContestType.OFFICIAL,
                now
        );
    }

    // =========================
    // STATUS CHECK
    // =========================
    @Override
    public Boolean isContestRunning(Long contestId) {
        ContestEntity contest = getContestOrThrow(contestId);
        boolean running = isRunning(contest);
        contest.setContestStatus(resolveStatus(contest));
        return running;
    }

    @Override
    public Boolean isContestPublic(Long contestId) {
        return null;
    }

    @Override
    public Boolean isContestUpcoming(Long contestId) {
        ContestEntity contest = getContestOrThrow(contestId);
        boolean upcoming = isUpcoming(contest);
        contest.setContestStatus(resolveStatus(contest));
        return upcoming;
    }

    @Override
    public Boolean isContestFinished(Long contestId) {
        ContestEntity contest = getContestOrThrow(contestId);
        boolean finished = isFinished(contest);
        contest.setContestStatus(resolveStatus(contest));
        return finished;
    }

    // =========================
    // START TIME
    // =========================
    @Override
    public Long getContestStartTime(Long contestId) {
        ContestEntity contest = getContestOrThrow(contestId);
        if (contest.getStartTime() == null) throw new ContestBusinessException(ErrorCode.CONTEST_ERROR);

        return contest.getStartTime()
                .atZone(ZoneId.systemDefault())
                .toEpochSecond();
    }

    // =========================
    // PRIVATE HELPERS
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

    private ContestStatus resolveStatus(ContestEntity contest) {
        if (isFinished(contest)) return ContestStatus.FINISHED;
        if (isRunning(contest)) return ContestStatus.RUNNING;
        return ContestStatus.UPCOMING;
    }

    private boolean isUpcoming(ContestEntity contest) {
        if (contest.getStartTime() == null) return false;
        return LocalDateTime.now().isBefore(contest.getStartTime());
    }

    private boolean isRunning(ContestEntity contest) {
        if (contest.getStartTime() == null || contest.getDuration() == null) return false;
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime end = contest.getStartTime().plusSeconds(contest.getDuration());
        return now.isAfter(contest.getStartTime()) && now.isBefore(end);
    }

    private boolean isFinished(ContestEntity contest) {
        if (contest.getStartTime() == null || contest.getDuration() == null) return true;
        LocalDateTime end = contest.getStartTime().plusSeconds(contest.getDuration());
        return LocalDateTime.now().isAfter(end);
    }

    private void validateContest(ContestEntity contest) {
        if (!StringUtils.isNotNullOrBlank(contest.getTitle())) {
            throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR, "Title khong duoc rong");
        }

        if (contest.getDuration() != null && contest.getDuration() < 0) {
            throw new ContestBusinessException(ErrorCode.CONTEST_VALIDATION_ERROR, "Duration khong duoc am");
        }

        // OFFICIAL bắt buộc có startTime + duration
        if (contest.getContestType() == ContestType.OFFICIAL) {
            if (contest.getStartTime() == null || contest.getDuration() == null) {
                throw new ContestBusinessException(
                        ErrorCode.CONTEST_VALIDATION_ERROR,
                        "Official phai co startTime & duration"
                );
            }
        }

        // startTime không được ở quá khứ (nếu có)
        if (contest.getStartTime() != null && contest.getStartTime().isBefore(LocalDateTime.now())) {
            throw new ContestBusinessException(ErrorCode.CONTEST_INVALID_START_TIME);
        }
    }

    private boolean isAuthor(Long userId, ContestEntity contest) {
        return contest.getAuthor() != null && contest.getAuthor().equals(userId);
    }

    private boolean isReviewer(Long userId, ContestEntity contest) {
        return rbacService.isReviewer(userId,contest.getContestId());
    }

    private void ensureAuthorOrAdmin(Long userId, ContestEntity contest) {
        if (!isAuthor(userId, contest) && !rbacService.isAdmin(userId) && !isReviewer(userId,contest)) {
            throw new ContestBusinessException(ErrorCode.CONTEST_ACCESS_DENY);
        }
    }

    private void ensureCanView(Long userId, ContestEntity contest) {
        ContestVisibility v = contest.getVisibility();

        if (v == ContestVisibility.PUBLIC) return;

        if (v == ContestVisibility.PRIVATE) {

            //check common permissions
            if (isAuthor(userId, contest) || rbacService.isAdmin(userId) || isReviewer(userId,contest)) return;

            /// Check group scope permissions
            if (contest.getGroupId() != null && rbacService.isGroupMember(userId, contest.getGroupId())) {
                return;
            }
            throw new ContestBusinessException(ErrorCode.CONTEST_ACCESS_DENY);
        }

        throw new ContestBusinessException(ErrorCode.CONTEST_ACCESS_DENY);
    }

    private void ensureCanDelete(Long userId, ContestEntity contest) {
        if (contest.getContestType() == ContestType.OFFICIAL) {
            if (!rbacService.isAdmin(userId)) throw new ContestBusinessException(ErrorCode.CONTEST_ACCESS_DENY);
            return;
        }

        if (contest.getContestType() == ContestType.GYM) {
            ensureAuthorOrAdmin(userId, contest);
            return;
        }

        // draft
        ensureAuthorOrAdmin(userId, contest);
    }
}
