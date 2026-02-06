package com.example.main_service.group.service;

import com.example.main_service.group.dtos.*;
import com.example.main_service.sharedAttribute.commonDto.PageRequestDto;
import com.example.main_service.sharedAttribute.commonDto.PageResult;

public interface GroupService {
    CreateGroupResponse createGroup(CreateGroupRequest request, Long userId);
    public GroupDetailResponse getGroupDetail(Long groupId);
    public PageResult<GroupListItemResponse> getGroupList(PageRequestDto<GroupListFilter> request);
    public void inviteUser(InviteUserRequest request, Long inviterId);
    public PageResult<InvitationListItemResponse> getInvitationList(
            PageRequestDto<InvitationListFilter> request, Long userId);
    public InviteActionResponse handleInvitationAction(InviteActionRequest request, Long userId);
    public void leaveGroup(Long groupId, Long userId);
    UpdateGroupResponse updateGroup(UpdateGroupRequest request, Long userId);
    void deleteGroup(Long groupId, Long userId);
}
