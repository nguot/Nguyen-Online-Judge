package com.example.main_service.dashboard.service;

import com.example.main_service.contest.model.ContestEntity;
import com.example.main_service.contest.service.ContestService;
import com.example.main_service.sharedAttribute.enums.ContestStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ContestRatingScheduler {

    private final ContestService contestService;
    private final ContestRatingService contestRatingService;

    @Scheduled(fixedDelay = 3 * 60 * 1000) // 600_000 ms
    @Transactional
    public void calculateRatingForFinishedContests() {
        LocalDateTime now = LocalDateTime.now();

        List<ContestEntity> contests =
                contestService.findFinishedOfficialNotRated(now);

        if (contests.isEmpty()) {
            return;
        }

        log.info("[ContestRatingScheduler] Found {} contests to calculate rating", contests.size());

        for (ContestEntity contest : contests) {
            try {
                log.info("[ContestRatingScheduler] Calculating rating for contest {}", contest.getContestId());

                contestRatingService.calculateRating(contest.getContestId());

                contest.setRatingCalculated(true);
                contest.setContestStatus(ContestStatus.FINISHED);

            } catch (Exception e) {
                log.error(
                        "[ContestRatingScheduler] Failed to calculate rating for contest {}",
                        contest.getContestId(),
                        e
                );
            }
        }
    }
}

