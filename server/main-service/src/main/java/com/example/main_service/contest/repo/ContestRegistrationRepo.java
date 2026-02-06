package com.example.main_service.contest.repo;

import com.example.main_service.contest.model.ContestRegistrationEntity;
import com.example.main_service.contest.repo.projections.ContestRegistrationProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Set;

public interface ContestRegistrationRepo extends JpaRepository<ContestRegistrationEntity, Long> {


    @Query(value = """
        SELECT cr.contest_id AS contestId,
               cr.user_id AS userId,
               ud.user_name AS userName,
               cr.registered_at AS registeredAt
        FROM contest_registration cr
        JOIN user_details ud ON cr.user_id=ud.user_id
        WHERE cr.contest_id=:contestId AND cr.user_id=:userId
    """, nativeQuery = true)
    Page<ContestRegistrationProjection> findByContestIdAndUserId(@Param("contestId") Long contestId, @Param("userId") Long userId, Pageable pageable);

    @Query(value = """
        SELECT cr.contest_id AS contestId, cr.user_id AS userId, ud.user_name AS userName, cr.registered_at AS registeredAt
        FROM contest_registration cr
        JOIN user_details ud ON cr.user_id = ud.user_id
        WHERE cr.contest_id = :contestId
    """, nativeQuery = true)
    Page<ContestRegistrationProjection> findByContestId(@Param("contestId") Long contestId, Pageable pageable);

    Boolean existsByContestIdAndUserId(Long contestId, Long userId);

    @Query("SELECT cr.contestId FROM ContestRegistrationEntity cr WHERE cr.userId = :userId AND cr.contestId IN :contestIds")
    Set<Long> findContestIdsByUserIdAndContestIdIn(@Param("userId") Long userId, @Param("contestIds") Collection<Long> contestIds);

    void deleteByContestIdAndUserId(Long contestId, Long userId);

}

