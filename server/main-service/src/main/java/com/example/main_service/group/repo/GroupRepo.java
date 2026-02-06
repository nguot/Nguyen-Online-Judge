package com.example.main_service.group.repo;

import com.example.main_service.group.model.GroupEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupRepo extends JpaRepository<GroupEntity, Long> {

    @Query("SELECT g FROM GroupEntity g WHERE " +
            "(:prefix IS NULL OR :prefix = '' OR LOWER(g.groupName) LIKE LOWER(CONCAT(:prefix, '%')))")
    Page<GroupEntity> findByPrefix(@Param("prefix") String prefix, Pageable pageable);
}
