package com.example.main_service.group.controller;

import com.example.main_service.group.dtos.*;
import com.example.main_service.group.service.GroupService;
import com.example.main_service.rbac.RbacService;
import com.example.main_service.sharedAttribute.commonDto.CommonResponse;
import com.example.main_service.sharedAttribute.commonDto.PageRequestDto;
import com.example.main_service.sharedAttribute.commonDto.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import static com.example.main_service.rbac.RbacService.getUserIdFromToken;

@RestController
@RequestMapping("/api/v1/group")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping("/create")
    public CommonResponse<CreateGroupResponse> createGroup(@RequestBody CreateGroupRequest request) {
        return CommonResponse.success(groupService.createGroup(request,getUserIdFromToken()));
    }

    @PostMapping("/update")
    @PreAuthorize("@rbacService.hasPermission(authentication, 'group:update','GROUP',#request.groupId)")
    public CommonResponse<UpdateGroupResponse> updateGroup(@RequestBody UpdateGroupRequest request) {
        Long userId = RbacService.getUserIdFromToken();
        UpdateGroupResponse response = groupService.updateGroup(request, userId);
        return CommonResponse.success(response);
    }

    @GetMapping("/detail/{groupId}")
    @PreAuthorize("@rbacService.hasPermission(authentication, 'group:view','GROUP',#groupId)")
    public CommonResponse<GroupDetailResponse> getGroupDetail(@PathVariable Long groupId) {
        GroupDetailResponse response = groupService.getGroupDetail(groupId);
        return CommonResponse.success(response);
    }

    @PostMapping("/delete/{groupId}")
    @PreAuthorize("@rbacService.hasPermission(authentication, 'group:delete','GROUP',#groupId)")
    public CommonResponse<Void> deleteGroup(@PathVariable Long groupId) {
        Long userId = RbacService.getUserIdFromToken();
        groupService.deleteGroup(groupId, userId);
        return CommonResponse.success(null);
    }

    @PostMapping("/list")
    public CommonResponse<PageResult<GroupListItemResponse>> getGroupList(
            @RequestBody PageRequestDto<GroupListFilter> request) {
        PageResult<GroupListItemResponse> response = groupService.getGroupList(request);
        return CommonResponse.success(response);
    }

    @PostMapping("/invite")
    @PreAuthorize("@rbacService.hasPermission(authentication, 'group:invite','GROUP', #request.groupId)")
    public CommonResponse<Void> inviteUser(@RequestBody InviteUserRequest request) {
        Long userId = RbacService.getUserIdFromToken();
        groupService.inviteUser(request, userId);
        return CommonResponse.success(null);
    }

    @PostMapping("/invitation-list")
    public CommonResponse<PageResult<InvitationListItemResponse>> getInvitationList(
            @RequestBody PageRequestDto<InvitationListFilter> request) {
        Long userId = RbacService.getUserIdFromToken();
        PageResult<InvitationListItemResponse> response = groupService.getInvitationList(request, userId);
        return CommonResponse.success(response);
    }

    @PostMapping("/invite/action")
    public CommonResponse<InviteActionResponse> handleInvitationAction(
            @RequestBody InviteActionRequest request) {
        Long userId = RbacService.getUserIdFromToken();
        InviteActionResponse response = groupService.handleInvitationAction(request, userId);
        return CommonResponse.success(response);
    }

    @PostMapping("/leave/{groupId}")
    @PreAuthorize("@rbacService.hasPermission(authentication, 'group:leave','GROUP',#groupId)")
    public CommonResponse<Void> leaveGroup(@PathVariable Long groupId) {
        Long userId = RbacService.getUserIdFromToken();
        groupService.leaveGroup(groupId, userId);
        return CommonResponse.success(null);
    }
}