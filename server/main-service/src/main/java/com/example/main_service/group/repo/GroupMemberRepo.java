package com.example.main_service.group.repo;

import com.example.main_service.group.model.GroupMemberEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupMemberRepo extends JpaRepository<GroupMemberEntity, Long> {

    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    List<GroupMemberEntity> findByGroupId(Long groupId);

    void deleteByGroupIdAndUserId(Long groupId, Long userId);

    @Query("SELECT gm.userId FROM GroupMemberEntity gm WHERE gm.groupId = :groupId")
    List<Long> findUserIdsByGroupId(@Param("groupId") Long groupId);
}
