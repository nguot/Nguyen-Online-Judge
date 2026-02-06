package com.example.main_service.user.repo;

import com.example.main_service.user.model.UserRatingHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRatingHistoryRepo
        extends JpaRepository<UserRatingHistoryEntity, Long> {

    // lấy rating mới nhất của user
    Optional<UserRatingHistoryEntity> findFirstByUserIdOrderByContestIdDesc(Long userId);

    boolean existsByUserIdAndContestId(Long userId, Long contestId);

    List<UserRatingHistoryEntity> findByUserIdOrderByContestIdAsc(Long userId);

    @Query("""
        SELECT r FROM UserRatingHistoryEntity r
        WHERE r.userId = :userId
        AND r.contestId = (
            SELECT MAX(r2.contestId)
            FROM UserRatingHistoryEntity r2
            WHERE r2.userId = :userId
        )
    """)
    Optional<UserRatingHistoryEntity> findLatestByUserId(Long userId);
}

