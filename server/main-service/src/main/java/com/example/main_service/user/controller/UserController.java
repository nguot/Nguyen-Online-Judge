package com.example.main_service.user.controller;

import com.example.main_service.dashboard.dtos.UserContestRatingHistoryItemDto;
import com.example.main_service.sharedAttribute.commonDto.CommonResponse;
import com.example.main_service.sharedAttribute.commonDto.PageRequestDto;
import com.example.main_service.sharedAttribute.commonDto.PageResult;
import com.example.main_service.user.dto.*;
import com.example.main_service.user.service.AdminUserService;
import com.example.main_service.user.service.UserServiceImpl;
import lombok.AllArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// làm trang user detail và rating hisotory

@RestController
@RequestMapping("/api/v1")
@AllArgsConstructor
public class UserController {

    private final UserServiceImpl userService;
    private final AdminUserService adminUserService;

    @GetMapping("/admin/roles/{roleId}")
    @PreAuthorize("@rbacService.hasPermission(authentication, 'rbac', 'SYSTEM', 0)")
    public CommonResponse<RoleDetailDto> getRoleDetail(
            @PathVariable Integer roleId
    ) {
        return CommonResponse.success(
                adminUserService.getRoleDetail(roleId)
        );
    }

    @PostMapping("/admin/roles/{roleId}/permissions")
    @PreAuthorize("@rbacService.hasPermission(authentication, 'rbac', 'SYSTEM', 0)")
    public CommonResponse<String> updateRolePermissions(
            @PathVariable Integer roleId,
            @RequestBody UpdateRolePermissionRequestDto request
    ) {
        adminUserService.clearRolePermissions(roleId);
        adminUserService.updateRolePermissions(roleId, request);
        return CommonResponse.success("permissions for role " + roleId + " update successfully");
    }

    @PostMapping("/admin/users/search")
    @PreAuthorize("@rbacService.hasPermission(authentication, 'rbac', 'SYSTEM', 0)")
    public CommonResponse<PageResult<AdminUserItemDto>> searchUsers(
            @RequestBody PageRequestDto<AdminUserFilterDto> request
    ) {
        return CommonResponse.success(
                adminUserService.searchUsers(request)
        );
    }

    // Thay role user => ADMIN, PRO USER, USER only => scope auto 0 và type = SYSTEM
    @PostMapping("/admin/users/{userId}/role")
    @PreAuthorize("@rbacService.hasPermission(authentication, 'rbac', 'SYSTEM', 0)")
    public CommonResponse<String> updateUserRole(
            @PathVariable Long userId,
            @RequestBody UpdateUserRoleRequestDto request
    ) {
        adminUserService.clearRoleUserSystem(userId);
        adminUserService.updateUserRole(userId, request);
        return CommonResponse.success("update role successfully");
    }

    // Admin chỉnh rating user (manual override)
    @PostMapping("/admin/users/{userId}/rating")
    public CommonResponse<String> updateUserRating(
            @PathVariable Long userId,
            @RequestBody UpdateUserRatingRequestDto request
    ) {
        adminUserService.updateUserRating(userId, request);
        return CommonResponse.success("update rating successfully");
    }

    /// /////user////////
    @GetMapping("/user/{user_name}")
    public CommonResponse<UserDetailDto> getUserProfile(@PathVariable("user_name") String username) {
        return CommonResponse.success(userService.getUserDetail(username));
    }

    @GetMapping("/user/rating-history/{user_id}")
    public CommonResponse<List<UserContestRatingHistoryItemDto>> getRatingHistory(
            @PathVariable("user_id") Long userId
    ) {
        List<UserContestRatingHistoryItemDto> list =
                userService.getUserRatingHistory(userId);

        list.forEach(item -> System.out.println(item));

        System.out.println(userService.getUserRatingHistory(userId).size());
        return CommonResponse.success(userService.getUserRatingHistory(userId));
    }

    @PostMapping("/users/search-prefix")
    public CommonResponse<PageResult<UserPrefixItemDto>> searchUsersByPrefixPage(
            @RequestBody PageRequestDto<UserPrefixFilterDto> request
    ) {
        return CommonResponse.success(
                userService.searchUsersByPrefixPage(request)
        );
    }


}
