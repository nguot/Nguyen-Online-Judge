package com.example.main_service.contest.repo;

import com.example.main_service.contest.model.ContestEntity;
import com.example.main_service.sharedAttribute.enums.ContestStatus;
import com.example.main_service.sharedAttribute.enums.ContestType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ContestRepo extends JpaRepository<ContestEntity, Long>, JpaSpecificationExecutor<ContestEntity> {
    @Query("""
        select cp.problemId
        from ContestProblemEntity cp
        where cp.contestId = :contestId
    """)
    List<String> findProblemIdsByContestId(Long contestId);

    @Query("""
        SELECT c FROM ContestEntity c
        WHERE c.contestType = :official
          AND c.ratingCalculated = false
          AND :now >= c.startTime + (c.duration * 1 second)
    """)
    List<ContestEntity> findFinishedOfficialNotRated(
            @Param("official") ContestType official,
            @Param("now") LocalDateTime now
    );
}
