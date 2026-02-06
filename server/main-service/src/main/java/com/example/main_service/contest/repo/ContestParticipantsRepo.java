package com.example.main_service.contest.repo;

import com.example.main_service.contest.model.ContestParticipantsEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContestParticipantsRepo extends JpaRepository<ContestParticipantsEntity, Long> {
    boolean existsByContestId(Long contestId);

    Page<ContestParticipantsEntity> findByContestIdOrderByRankingAsc(Long contestId, Pageable pageable);

    @Query("SELECT cp FROM ContestParticipantsEntity cp " +
            "WHERE cp.contestId = :contestId AND cp.userId IN :userIds")
    List<ContestParticipantsEntity> findByContestIdAndUserIdIn(
            @Param("contestId") Long contestId,
            @Param("userIds") List<Long> userIds
    );
}
