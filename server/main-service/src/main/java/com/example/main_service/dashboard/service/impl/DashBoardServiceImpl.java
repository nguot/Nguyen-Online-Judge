package com.example.main_service.dashboard.service.impl;

import com.example.main_service.contest.model.ContestEntity;
import com.example.main_service.contest.model.ContestParticipantsEntity;
import com.example.main_service.contest.repo.ContestParticipantsRepo;
import com.example.main_service.contest.repo.ContestRepo;
import com.example.main_service.contest.service.ContestService;
import com.example.main_service.dashboard.dtos.DashBoardItemResponseDto;
import com.example.main_service.dashboard.dtos.DashBoardPageResponseDto;
import com.example.main_service.dashboard.dtos.SolvedProblemDto;
import com.example.main_service.dashboard.service.DashBoardService;
import com.example.main_service.friend.model.UserFriendship;
import com.example.main_service.friend.repo.UserFriendshipRepo;
import com.example.main_service.problem.ProblemHttpClient;
import com.example.main_service.sharedAttribute.exceptions.ErrorCode;
import com.example.main_service.sharedAttribute.exceptions.specException.ContestBusinessException;
import com.example.main_service.user.service.UserServiceImpl;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashBoardServiceImpl implements DashBoardService {

    private final StringRedisTemplate redis;
    private final ContestService contestService;
    private final ContestRepo contestRepo;
    private final ProblemHttpClient problemGrpcClient;
    private final UserServiceImpl userService;
    private final ObjectMapper objectMapper;
    private final ContestParticipantsRepo contestParticipantsRepo;
    private final UserFriendshipRepo friendshipRepository;

    private static final long SCORE_WEIGHT = 1_000_000_000L;
    private static final long PENALTY_BLOCK_SECONDS = 30L; // block 30s

    @Override
    public void onSubmissionJudged(
            String submissionId,
            Long userId,
            Long contestId,
            String problemId,
            boolean allAccepted,
            long submitTimeEpochSeconds
    ) {
        if (!allAccepted) return;
        if (!contestService.isContestRunning(contestId)) return;

        String userBaseKey = userBaseKey(contestId, userId);
        String acSetKey = acProblemsKey(userBaseKey);

        // đã AC rồi -> skip
        if (Boolean.TRUE.equals(redis.opsForSet().isMember(acSetKey, problemId))) return;

        // mark AC
        redis.opsForSet().add(acSetKey, problemId);

        int baseScore = problemGrpcClient.getProblemById(problemId).getScore();
        long contestStart = contestService.getContestStartTime(contestId);

        long elapsed = Math.max(0, submitTimeEpochSeconds - contestStart);
        long blocks = elapsed / PENALTY_BLOCK_SECONDS;
        long earnedScore = Math.max(0L, (long) baseScore - blocks);

        // save earned score per problem
        redis.opsForHash().put(problemScoresKey(userBaseKey), problemId, String.valueOf(earnedScore));

        // update totals
        redis.opsForHash().increment(userBaseKey, "score", earnedScore);
        redis.opsForHash().increment(userBaseKey, "penalty", elapsed);

        long totalScore = getLong(userBaseKey, "score");
        long totalPenalty = getLong(userBaseKey, "penalty");

        long zScore = totalScore * SCORE_WEIGHT - totalPenalty;
        redis.opsForZSet().add(leaderboardKey(contestId), userId.toString(), zScore);
    }

    @Override
    public DashBoardPageResponseDto getDashBoard(Long contestId, int offset, int limit) {
        ContestEntity contest = contestRepo.findById(contestId)
                .orElseThrow(() -> new ContestBusinessException(ErrorCode.CONTEST_NOT_FOUND, "Dashboard"));

        if (contestService.isContestRunning(contestId)) {
            return getDashBoardRunning(contestId, offset, limit);
        }
        if (Boolean.TRUE.equals(contestService.isContestFinished(contestId))) {
            return getDashBoardFinished(contestId, offset, limit);
        }

        throw new IllegalStateException("Dashboard not available for contest status: " + contest.getContestStatus());
    }

    @Override
    public DashBoardPageResponseDto getDashBoardRunning(Long contestId, int offset, int limit) {
        if (limit <= 0) {
            return DashBoardPageResponseDto.builder().total(0L).items(List.of()).build();
        }

        String lbKey = leaderboardKey(contestId);

        Long total = redis.opsForZSet().size(lbKey);
        if (total == null || total == 0) {
            return DashBoardPageResponseDto.builder().total(0L).items(List.of()).build();
        }

        Set<String> userIdStrSet = redis.opsForZSet()
                .reverseRange(lbKey, offset, offset + limit - 1);

        if (userIdStrSet == null || userIdStrSet.isEmpty()) {
            return DashBoardPageResponseDto.builder().total(total).items(List.of()).build();
        }

        List<Long> userIds = userIdStrSet.stream().map(Long::valueOf).toList();
        Map<Long, String> userNameMap = userService.getUserNames(userIds);

        List<DashBoardItemResponseDto> items = new ArrayList<>(userIds.size());

        IntStream.range(0, userIds.size()).forEach(i -> {
            Long userId = userIds.get(i);
            long rank = (long) offset + i + 1;

            String baseKey = userBaseKey(contestId, userId);

            long totalScore = getLong(baseKey, "score");
            long penalty = getLong(baseKey, "penalty");

            List<SolvedProblemDto> solvedProblems = getSolvedProblems(baseKey);

            items.add(DashBoardItemResponseDto.builder()
                    .userId(userId)
                    .userName(userNameMap.getOrDefault(userId, ""))
                    .score((int) totalScore)
                    .penalty((int) penalty)
                    .rank(rank)
                    .solvedProblems(solvedProblems)
                    .build());
        });

        return DashBoardPageResponseDto.builder()
                .total(total)
                .items(items)
                .build();
    }

    // just đánh index bro
    @Override
    public DashBoardPageResponseDto getDashBoardFinished(Long contestId, int offset, int limit) {
        if (limit <= 0) {
            return DashBoardPageResponseDto.builder().total(0L).items(List.of()).build();
        }

        Pageable pageable = PageRequest.of(offset / limit, limit);
        Page<ContestParticipantsEntity> page =
                contestParticipantsRepo.findByContestIdOrderByRankingAsc(contestId, pageable);

        List<Long> userIds = page.getContent().stream()
                .map(ContestParticipantsEntity::getUserId)
                .toList();

        Map<Long, String> userNameMap = userService.getUserNames(userIds);

        List<DashBoardItemResponseDto> items = page.getContent().stream()
                .map(e -> mapToDashboardItem(e, userNameMap.getOrDefault(e.getUserId(), "")))
                .toList();

        return DashBoardPageResponseDto.builder()
                .items(items)
                .total(page.getTotalElements())
                .build();
    }

    @Override
    public DashBoardPageResponseDto getFriendsRanking(Long contestId, Long userId, int offset, int limit) {
        if (limit <= 0) {
            return DashBoardPageResponseDto.builder().total(0L).items(List.of()).build();
        }

        ContestEntity contest = contestRepo.findById(contestId)
                .orElseThrow(() -> new ContestBusinessException(ErrorCode.CONTEST_NOT_FOUND, "Dashboard"));

        if (contestService.isContestRunning(contestId)) {
            return getFriendsRankingRunning(contestId, userId, offset, limit);
        }
        if (Boolean.TRUE.equals(contestService.isContestFinished(contestId))) {
            return getFriendsRankingFinished(contestId, userId, offset, limit);
        }

        throw new IllegalStateException("Dashboard not available for contest status: " + contest.getContestStatus());
    }
        /**
         * Get friends' ranking for RUNNING contest (from Redis)
         * Optimized with Redis pipeline - only 3 pipeline queries total
         */
    private DashBoardPageResponseDto getFriendsRankingRunning(Long contestId, Long userId, int offset, int limit) {
        // STEP 1: Get all accepted friends from database
        List<UserFriendship> friendships = friendshipRepository.findAllAcceptedFriends(userId);

        // Extract friend IDs
        List<Long> friendIds = friendships.stream()
                .map(friendship -> friendship.getUserId().equals(userId)
                        ? friendship.getFriendId()
                        : friendship.getUserId())
                .collect(Collectors.toList());

        friendIds.add(userId); // là bạn với chính mình

        String lbKey = leaderboardKey(contestId);

        // STEP 2: Get all ranks in ONE pipeline query
        List<Long> friendRanks = redis.executePipelined((RedisCallback<Object>) connection -> {
                    for (Long friendId : friendIds) {
                        connection.zSetCommands().zRevRank(
                                lbKey.getBytes(),
                                friendId.toString().getBytes()
                        );
                    }
                    return null;
                }).stream()
                .map(obj -> obj == null ? null : (Long) obj)
                .collect(Collectors.toList());

        // Filter out friends who haven't participated
        List<Long> participatingFriendIds = new ArrayList<>();
        Map<Long, Long> friendIdToRank = new HashMap<>();

        for (int i = 0; i < friendIds.size(); i++) {
            Long rank = friendRanks.get(i);
            if (rank != null) {
                Long friendId = friendIds.get(i);
                participatingFriendIds.add(friendId);
                friendIdToRank.put(friendId, rank + 1); // Convert to 1-indexed
            }
        }

        if (participatingFriendIds.isEmpty()) {
            return DashBoardPageResponseDto.builder().total(0L).items(List.of()).build();
        }

        // STEP 3: Get all scores and penalties in ONE pipeline query
        List<Object> scoresAndPenalties = redis.executePipelined((RedisCallback<Object>) connection -> {
            for (Long friendId : participatingFriendIds) {
                String baseKey = userBaseKey(contestId, friendId);
                // Get score
                connection.hashCommands().hGet(baseKey.getBytes(), "score".getBytes());
                // Get penalty
                connection.hashCommands().hGet(baseKey.getBytes(), "penalty".getBytes());
            }
            return null;
        });

        // Build ranking data
        List<FriendRankingData> friendRankings = new ArrayList<>();

        for (int i = 0; i < participatingFriendIds.size(); i++) {
            Long friendId = participatingFriendIds.get(i);

            Object scoreObj = scoresAndPenalties.get(i * 2);
            Object penaltyObj = scoresAndPenalties.get(i * 2 + 1);

            long totalScore = scoreObj == null ? 0L : parseLongFromBytes(scoreObj);
            long penalty = penaltyObj == null ? 0L : parseLongFromBytes(penaltyObj);

            friendRankings.add(FriendRankingData.builder()
                    .friendId(friendId)
                    .rank(friendIdToRank.get(friendId))
                    .score((int) totalScore)
                    .penalty((int) penalty)
                    .build());
        }

        // Sort by rank (ascending)
        friendRankings.sort(Comparator.comparingLong(FriendRankingData::getRank));

        long total = friendRankings.size();

        // Apply pagination in memory
        int fromIndex = Math.min(offset, friendRankings.size());
        int toIndex = Math.min(offset + limit, friendRankings.size());
        List<FriendRankingData> paginatedRankings = friendRankings.subList(fromIndex, toIndex);

        // Get friend IDs for this page
        List<Long> pageFriendIds = paginatedRankings.stream()
                .map(FriendRankingData::getFriendId)
                .collect(Collectors.toList());

        // STEP 4: Get user names in batch
        Map<Long, String> userNameMap = userService.getUserNames(pageFriendIds);

        // STEP 5: Get solved problems for paginated friends in ONE pipeline query
        List<Object> solvedProblemsData = redis.executePipelined((RedisCallback<Object>) connection -> {
            for (Long friendId : pageFriendIds) {
                String baseKey = userBaseKey(contestId, friendId);
                // Get AC problem IDs
                connection.setCommands().sMembers(acProblemsKey(baseKey).getBytes());
            }
            return null;
        });

        // Get problem scores for all friends in ONE pipeline query
        List<List<String>> allAcProblemIds = new ArrayList<>();
        for (Object obj : solvedProblemsData) {
            if (obj != null && obj instanceof Set) {
                @SuppressWarnings("unchecked")
                Set<?> members = (Set<?>) obj;
                List<String> problemIds = members.stream()
                        .map(member -> {
                            if (member instanceof byte[]) {
                                return new String((byte[]) member);
                            } else if (member instanceof String) {
                                return (String) member;
                            }
                            return String.valueOf(member);
                        })
                        .collect(Collectors.toList());
                allAcProblemIds.add(problemIds);
            } else {
                allAcProblemIds.add(Collections.emptyList());
            }
        }

        // Fetch all problem scores in ONE pipeline
        List<Object> allProblemScores = redis.executePipelined((RedisCallback<Object>) connection -> {
            for (int i = 0; i < pageFriendIds.size(); i++) {
                Long friendId = pageFriendIds.get(i);
                List<String> problemIds = allAcProblemIds.get(i);

                if (!problemIds.isEmpty()) {
                    String scoresKey = problemScoresKey(userBaseKey(contestId, friendId));
                    for (String problemId : problemIds) {
                        connection.hashCommands().hGet(scoresKey.getBytes(), problemId.getBytes());
                    }
                }
            }
            return null;
        });

        // Build solved problems map
        Map<Long, List<SolvedProblemDto>> friendIdToSolvedProblems = new HashMap<>();
        int scoreIndex = 0;

        for (int i = 0; i < pageFriendIds.size(); i++) {
            Long friendId = pageFriendIds.get(i);
            List<String> problemIds = allAcProblemIds.get(i);
            List<SolvedProblemDto> solvedProblems = new ArrayList<>();

            for (String problemId : problemIds) {
                Object scoreObj = allProblemScores.get(scoreIndex++);
                long earnedScore = scoreObj == null ? 0L : parseLongFromBytes(scoreObj);

                solvedProblems.add(SolvedProblemDto.builder()
                        .problemId(problemId)
                        .score(earnedScore)
                        .build());
            }

            friendIdToSolvedProblems.put(friendId, solvedProblems);
        }

        // Build response items
        List<DashBoardItemResponseDto> items = paginatedRankings.stream()
                .map(data -> DashBoardItemResponseDto.builder()
                        .userId(data.getFriendId())
                        .userName(userNameMap.getOrDefault(data.getFriendId(), ""))
                        .score(data.getScore())
                        .penalty(data.getPenalty())
                        .rank(data.getRank())
                        .solvedProblems(friendIdToSolvedProblems.getOrDefault(data.getFriendId(), List.of()))
                        .build())
                .collect(Collectors.toList());

        return DashBoardPageResponseDto.builder()
                .total(total)
                .items(items)
                .build();
    }

    /**
     * Get friends' ranking for FINISHED contest (from Database)
     * Optimized with single query using IN clause
     */
    private DashBoardPageResponseDto getFriendsRankingFinished(Long contestId, Long userId, int offset, int limit) {
        // STEP 1: Get all accepted friends from database
        List<UserFriendship> friendships = friendshipRepository.findAllAcceptedFriends(userId);

        // Extract friend IDs
        List<Long> friendIds = friendships.stream()
                .map(friendship -> friendship.getUserId().equals(userId)
                        ? friendship.getFriendId()
                        : friendship.getUserId())
                .collect(Collectors.toList());
        friendIds.add(userId); // là bạn với chính mình

        // STEP 2: Query all participants in ONE database query
        List<ContestParticipantsEntity> participants =
                contestParticipantsRepo.findByContestIdAndUserIdIn(contestId, friendIds);

        if (participants.isEmpty()) {
            return DashBoardPageResponseDto.builder().total(0L).items(List.of()).build();
        }

        // Sort by ranking (ascending)
        participants.sort(Comparator.comparingInt(ContestParticipantsEntity::getRanking));

        long total = participants.size();

        // Apply pagination in memory
        int fromIndex = Math.min(offset, participants.size());
        int toIndex = Math.min(offset + limit, participants.size());
        List<ContestParticipantsEntity> paginatedParticipants = participants.subList(fromIndex, toIndex);

        // STEP 3: Get user names in batch
        List<Long> pageFriendIds = paginatedParticipants.stream()
                .map(ContestParticipantsEntity::getUserId)
                .collect(Collectors.toList());

        Map<Long, String> userNameMap = userService.getUserNames(pageFriendIds);

        // Build response items
        List<DashBoardItemResponseDto> items = paginatedParticipants.stream()
                .map(e -> mapToDashboardItem(e, userNameMap.getOrDefault(e.getUserId(), "")))
                .collect(Collectors.toList());

        return DashBoardPageResponseDto.builder()
                .items(items)
                .total(total)
                .build();
    }

    // ---------------- helpers ----------------

    @Builder
    @Getter
    private static class FriendRankingData {
        private Long friendId;
        private Long rank;
        private Integer score;
        private Integer penalty;
    }

    /**
     * Parse long from Redis byte array response
     */
    private long parseLongFromBytes(Object obj) {
        if (obj == null) return 0L;

        if (obj instanceof byte[]) {
            String str = new String((byte[]) obj);
            return Long.parseLong(str);
        } else if (obj instanceof String) {
            return Long.parseLong((String) obj);
        }

        return 0L;
    }

    private List<SolvedProblemDto> getSolvedProblems(String userBaseKey) {
        Set<String> solvedIds = redis.opsForSet().members(acProblemsKey(userBaseKey));
        if (solvedIds == null || solvedIds.isEmpty()) return List.of();

        // multiGet earned scores
        List<Object> fields = new ArrayList<>(solvedIds.size());
        fields.addAll(solvedIds);

        List<Object> values = redis.opsForHash().multiGet(problemScoresKey(userBaseKey), fields);
        if (values == null) values = Collections.nCopies(fields.size(), null);

        List<SolvedProblemDto> result = new ArrayList<>(solvedIds.size());
        int idx = 0;
        for (String pid : solvedIds) {
            Object v = values.size() > idx ? values.get(idx) : null;
            long earnedScore = (v == null) ? 0L : Long.parseLong(v.toString());
            result.add(SolvedProblemDto.builder().problemId(pid).score(earnedScore).build());
            idx++;
        }
        return result;
    }

    private long getLong(String key, String field) {
        Object val = redis.opsForHash().get(key, field);
        return val == null ? 0L : Long.parseLong(val.toString());
    }

    private String userBaseKey(Long contestId, Long userId) {
        return "contest:" + contestId + ":user:" + userId;
    }

    private String leaderboardKey(Long contestId) {
        return "contest:" + contestId + ":leaderboard";
    }

    private String acProblemsKey(String userBaseKey) {
        return userBaseKey + ":ac_problems";
    }

    private String problemScoresKey(String userBaseKey) {
        return userBaseKey + ":problem_scores";
    }

    private DashBoardItemResponseDto mapToDashboardItem(ContestParticipantsEntity e, String userName) {
        return DashBoardItemResponseDto.builder()
                .userId(e.getUserId())
                .userName(userName)
                .score(e.getTotalScore())
                .penalty(e.getPenalty())
                .rank((long) e.getRanking())
                .solvedProblems(parseSolvedProblems(e.getSolvedProblem()))
                .build();
    }

    private List<SolvedProblemDto> parseSolvedProblems(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<SolvedProblemDto>>() {});
        } catch (Exception e) {
            log.error("Parse solvedProblem failed", e);
            return List.of();
        }
    }
}
