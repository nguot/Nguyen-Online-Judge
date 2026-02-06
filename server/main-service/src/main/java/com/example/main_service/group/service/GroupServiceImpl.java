package com.example.main_service.group.service;

import com.example.main_service.group.dtos.*;
import com.example.main_service.group.model.GroupEntity;
import com.example.main_service.group.model.GroupInvitationEntity;
import com.example.main_service.group.model.GroupMemberEntity;
import com.example.main_service.group.repo.GroupInvitationRepo;
import com.example.main_service.group.repo.GroupMemberRepo;
import com.example.main_service.group.repo.GroupRepo;
import com.example.main_service.rbac.RbacService;
import com.example.main_service.sharedAttribute.commonDto.PageRequestDto;
import com.example.main_service.sharedAttribute.commonDto.PageResult;
import com.example.main_service.user.model.UserEntity;
import com.example.main_service.user.repo.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class GroupServiceImpl implements GroupService {

    private final GroupRepo groupRepo;
    private final GroupInvitationRepo groupInvitationRepo;
    private final GroupMemberRepo groupMemberRepo;
    private final UserRepo userRepo;
    private final RbacService rbacService;

    @Override
    public CreateGroupResponse createGroup(CreateGroupRequest request, Long userId) {
        // Tạo group
        GroupEntity group = GroupEntity.builder()
                .groupName(request.getGroupName())
                .description(request.getDescription())
                .avatar(request.getAvatar())
                .createdBy(userId)
                .build();

        group = groupRepo.save(group);

        // Thêm người tạo vào group_member
        GroupMemberEntity member = GroupMemberEntity.builder()
                .groupId(group.getGroupId())
                .userId(userId)
                .inviteByUserId(userId)
                .build();
        groupMemberRepo.save(member);

        // Gán role ADMIN cho người tạo
        rbacService.assignRole(
                userId,
                "GROUP_ADMIN",
                "GROUP",
                group.getGroupId().toString()
        );

        return CreateGroupResponse.builder()
                .groupId(group.getGroupId())
                .groupName(group.getGroupName())
                .description(group.getDescription())
                .avatar(group.getAvatar())
                .build();
    }

    @Override
    public UpdateGroupResponse updateGroup(UpdateGroupRequest request, Long userId) {
        // Tìm group
        GroupEntity group = groupRepo.findById(request.getGroupId())
                .orElseThrow(() -> new RuntimeException("Group not found"));

        // Cập nhật thông tin (chỉ update các field không null)
        if (request.getGroupName() != null) {
            group.setGroupName(request.getGroupName());
        }
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }
        if (request.getAvatar() != null) {
            group.setAvatar(request.getAvatar());
        }

        group = groupRepo.save(group);

        return UpdateGroupResponse.builder()
                .groupId(group.getGroupId())
                .groupName(group.getGroupName())
                .description(group.getDescription())
                .avatar(group.getAvatar())
                .build();
    }

    @Override
    public void deleteGroup(Long groupId, Long userId) {
        // Kiểm tra group tồn tại
        GroupEntity group = groupRepo.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        // Xóa tất cả members
        List<GroupMemberEntity> members = groupMemberRepo.findByGroupId(groupId);
        for (GroupMemberEntity member : members) {
            // Xóa role của từng member
            rbacService.unassignRole(member.getUserId(), "GROUP_MEMBER", "GROUP", groupId.toString());
            rbacService.unassignRole(member.getUserId(), "GROUP_ADMIN", "GROUP", groupId.toString());
        }
        groupMemberRepo.deleteAll(members);

        // Xóa tất cả invitations
        List<GroupInvitationEntity> invitations = groupInvitationRepo.findAll()
                .stream()
                .filter(inv -> inv.getGroupId().equals(groupId))
                .collect(Collectors.toList());
        groupInvitationRepo.deleteAll(invitations);

        // Xóa group
        groupRepo.delete(group);
    }

    @Override
    @Transactional
    public GroupDetailResponse getGroupDetail(Long groupId) {
        GroupEntity group = groupRepo.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        List<Long> userIds = groupMemberRepo.findUserIdsByGroupId(groupId);
        List<UserEntity> users = userRepo.findByUserIdIn(userIds);

        List<GroupDetailResponse.GroupMemberDto> members = users.stream()
                .map(user -> {
                    // Lấy role của user trong group
                    String role = getUserRoleInGroup(user.getUserId(), groupId);
                    return GroupDetailResponse.GroupMemberDto.builder()
                            .userId(user.getUserId())
                            .userName(user.getUserName())
                            .role(role)
                            .build();
                })
                .collect(Collectors.toList());

        return GroupDetailResponse.builder()
                .groupId(group.getGroupId())
                .groupName(group.getGroupName())
                .description(group.getDescription())
                .avatar(group.getAvatar())
                .members(members)
                .build();
    }

    @Override
    @Transactional
    public PageResult<GroupListItemResponse> getGroupList(PageRequestDto<GroupListFilter> request) {
        String prefix = request.getFilter() != null ? request.getFilter().getPrefix() : null;

        Page<GroupEntity> page = groupRepo.findByPrefix(prefix, request.getPageRequest());

        List<GroupListItemResponse> data = page.getContent().stream()
                .map(g -> GroupListItemResponse.builder()
                        .groupId(g.getGroupId())
                        .groupName(g.getGroupName())
                        .description(g.getDescription())
                        .avatar(g.getAvatar())
                        .build())
                .collect(Collectors.toList());

        return PageResult.<GroupListItemResponse>builder()
                .totalCount(page.getTotalElements())
                .data(data)
                .build();
    }

    public void inviteUser(InviteUserRequest request, Long inviterId) {
        // Kiểm tra group tồn tại
        if (!groupRepo.existsById(request.getGroupId())) {
            throw new RuntimeException("Group not found");
        }

        // Kiểm tra invitee đã là thành viên chưa
        if (groupMemberRepo.existsByGroupIdAndUserId(request.getGroupId(), request.getInviteeId())) {
            throw new RuntimeException("User is already a member");
        }

        // Kiểm tra đã có lời mời PENDING chưa
        Optional<GroupInvitationEntity> existing = groupInvitationRepo
                .findByGroupIdAndInviterIdAndInviteeIdAndStatus(
                        request.getGroupId(),
                        inviterId,
                        request.getInviteeId(),
                        GroupInvitationEntity.InvitationStatus.PENDING
                );

        if (existing.isPresent()) {
            throw new RuntimeException("Invitation already exists");
        }

        // Tạo lời mời
        GroupInvitationEntity invitation = GroupInvitationEntity.builder()
                .groupId(request.getGroupId())
                .inviterId(inviterId)
                .inviteeId(request.getInviteeId())
                .status(GroupInvitationEntity.InvitationStatus.PENDING)
                .build();

        groupInvitationRepo.save(invitation);
    }

    @Override
    @Transactional
    public PageResult<InvitationListItemResponse> getInvitationList(
            PageRequestDto<InvitationListFilter> request, Long userId) {

        Long groupId = request.getFilter() != null ? request.getFilter().getGroupId() : null;
        String prefix = request.getFilter() != null ? request.getFilter().getPrefix() : null;

        Page<GroupInvitationEntity> page = groupInvitationRepo.findPendingInvitations(
                userId, groupId, prefix, request.getPageRequest());

        List<InvitationListItemResponse> data = page.getContent().stream()
                .map(inv -> {
                    GroupEntity group = groupRepo.findById(inv.getGroupId()).orElse(null);
                    return InvitationListItemResponse.builder()
                            .inviterId(inv.getInviterId())
                            .groupId(inv.getGroupId())
                            .groupName(group != null ? group.getGroupName() : null)
                            .build();
                })
                .collect(Collectors.toList());

        return PageResult.<InvitationListItemResponse>builder()
                .totalCount(page.getTotalElements())
                .data(data)
                .build();
    }

    @Override
    public InviteActionResponse handleInvitationAction(InviteActionRequest request, Long userId) {
        // Tìm lời mời
        GroupInvitationEntity invitation = groupInvitationRepo
                .findByGroupIdAndInviterIdAndInviteeIdAndStatus(
                        request.getGroupId(),
                        request.getInviterId(),
                        userId,
                        GroupInvitationEntity.InvitationStatus.PENDING
                )
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        // Cập nhật status
        invitation.setStatus(request.getStatus());
        groupInvitationRepo.save(invitation);

        // Nếu ACCEPTED thì thêm vào group_member
        if (request.getStatus() == GroupInvitationEntity.InvitationStatus.ACCEPTED) {
            GroupMemberEntity member = GroupMemberEntity.builder()
                    .groupId(request.getGroupId())
                    .userId(userId)
                    .inviteByUserId(request.getInviterId())
                    .build();
            groupMemberRepo.save(member);

            // Gán role MEMBER
            rbacService.assignRole(
                    userId,
                    "GROUP_MEMBER",
                    "GROUP",
                    request.getGroupId().toString()
            );
        }

        return InviteActionResponse.builder()
                .userId(userId)
                .inviterId(request.getInviterId())
                .groupId(request.getGroupId())
                .status(request.getStatus())
                .build();
    }

    @Override
    public void leaveGroup(Long groupId, Long userId) {
        if (!groupMemberRepo.existsByGroupIdAndUserId(groupId, userId)) {
            throw new RuntimeException("User is not a member of this group");
        }

        groupMemberRepo.deleteByGroupIdAndUserId(groupId, userId);

        // Xóa role
        rbacService.unassignRole(userId, "GROUP_MEMBER", "GROUP", groupId.toString());
        rbacService.unassignRole(userId, "GROUP_ADMIN", "GROUP", groupId.toString());
    }

    private String getUserRoleInGroup(Long userId, Long groupId) {
        // Kiểm tra role thông qua RbacService
        try {
            List<Long> adminIds = rbacService.listUserIdsByRole(
                    "GROUP_ADMIN", "GROUP", groupId.toString());
            if (adminIds.contains(userId)) {
                return "ADMIN";
            }
            return "MEMBER";
        } catch (Exception e) {
            return "MEMBER";
        }
    }
}
