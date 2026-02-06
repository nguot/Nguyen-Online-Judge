package com.example.main_service.contest.repo;

import com.example.main_service.contest.model.ContestProblemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContestProblemRepo extends JpaRepository<ContestProblemEntity, Long> {
    Optional<ContestProblemEntity> findByContestIdAndProblemId(Long contestId, String problemId);

    @Query(value = """
                SELECT c.author
                FROM contest_problem cp
                JOIN contest c ON cp.contest_id = c.contest_id
                WHERE cp.problem_id = :problemId
            """,nativeQuery = true)
    Optional<Long> findByProblemId(@Param("problemId") String problemId);

    List<ContestProblemEntity> findProblemIdsByContestId(Long contestId);

    @Query("SELECT MAX(cp.problemOrder) FROM ContestProblemEntity cp WHERE cp.contestId = :contestId")
    Optional<Integer> findMaxOrderByContestId(@Param("contestId") Long contestId);

    @Modifying
    @Query("""
    UPDATE ContestProblemEntity cp
    SET cp.problemOrder = :order
    WHERE cp.contestId = :contestId
      AND cp.problemId = :problemId
""")
    void updateProblemOrder(
            @Param("contestId") Long contestId,
            @Param("problemId") String problemId,
            @Param("order") int order
    );


}
