package com.example.main_service.group.repo;

import com.example.main_service.group.model.GroupInvitationEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GroupInvitationRepo extends JpaRepository<GroupInvitationEntity, Long> {

    Optional<GroupInvitationEntity> findByGroupIdAndInviterIdAndInviteeIdAndStatus(
            Long groupId, Long inviterId, Long inviteeId, GroupInvitationEntity.InvitationStatus status);

    @Query("SELECT gi FROM GroupInvitationEntity gi " +
            "JOIN GroupEntity g ON gi.groupId = g.groupId " +
            "WHERE gi.inviteeId = :inviteeId " +
            "AND gi.status = 'PENDING' " +
            "AND (:groupId IS NULL OR gi.groupId = :groupId) " +
            "AND (:prefix IS NULL OR :prefix = '' OR LOWER(g.groupName) LIKE LOWER(CONCAT(:prefix, '%')))")
    Page<GroupInvitationEntity> findPendingInvitations(
            @Param("inviteeId") Long inviteeId,
            @Param("groupId") Long groupId,
            @Param("prefix") String prefix,
            Pageable pageable);
}
