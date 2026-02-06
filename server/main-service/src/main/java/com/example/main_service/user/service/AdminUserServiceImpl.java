package com.example.main_service.user.service;

import com.example.main_service.rbac.model.PermissionEntity;
import com.example.main_service.rbac.model.RoleEntity;
import com.example.main_service.rbac.model.RolePermissionEntity;
import com.example.main_service.rbac.model.RoleUserEntity;
import com.example.main_service.rbac.repo.PermissionRepo;
import com.example.main_service.rbac.repo.RolePermissionRepo;
import com.example.main_service.rbac.repo.RoleRepo;
import com.example.main_service.rbac.repo.RoleUserRepo;
import com.example.main_service.sharedAttribute.commonDto.PageRequestDto;
import com.example.main_service.sharedAttribute.commonDto.PageResult;
import com.example.main_service.user.dto.*;
import com.example.main_service.user.model.UserEntity;
import com.example.main_service.user.model.UserRatingHistoryEntity;
import com.example.main_service.user.repo.UserRatingHistoryRepo;
import com.example.main_service.user.repo.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final RoleRepo roleRepository;
    private final PermissionRepo permissionRepository;
    private final RolePermissionRepo rolePermissionRepository;
    private final RoleUserRepo roleUserRepository;
    private final UserRepo userRepository;
    private final UserRatingHistoryRepo userRatingHistoryRepo;
    private final UserService userService;

    /* =========================================================
       ROLE + PERMISSION
     ========================================================= */

    @Override
    public RoleDetailDto getRoleDetail(Integer roleId) {

        RoleEntity role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        List<Integer> permissionIds =
                rolePermissionRepository.findByRoleId(roleId)
                        .stream()
                        .map(RolePermissionEntity::getPermissionId)
                        .toList();

        List<PermissionDto> permissions =
                permissionRepository.findPermissionDetailByIds(permissionIds)
                        .stream()
                        .map(p -> new PermissionDto(
                                p.getPermissionId(),
                                p.getPermissionName()
                        ))
                        .toList();

        RoleDetailDto dto = new RoleDetailDto();
        dto.setRoleId(role.getRoleId());
        dto.setRoleName(role.getRoleName());
        dto.setPermissions(permissions);

        return dto;
    }

    @Override
    @Transactional
    public void clearRolePermissions(Integer roleId) {
        rolePermissionRepository.deleteByRoleId(roleId);
    }

    @Override
    @Transactional
    public void updateRolePermissions( // make sure use clearRolePermission trước
            Integer roleId,
            UpdateRolePermissionRequestDto request
    ) {
        // ===== CHECK ROLE =====
        roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        if (request == null || request.getPermissions() == null) {
            return;
        }

        for (UpdateRolePermissionItem item : request.getPermissions()) {

            Integer permissionId = item.getPermissionId();
            String permissionName = item.getPermissionName();

            System.out.println(permissionId + " " + permissionName);

            if (permissionName == null || permissionName.isBlank()) {
                throw new RuntimeException("Permission name is required");
            }

            // ===== UPSERT PERMISSION =====
            PermissionEntity permission;

            if (permissionId != null) {
                permission = permissionRepository.findById(permissionId)
                        .orElseThrow(() ->
                                new RuntimeException("Permission not found: " + permissionId));

                // update name nếu đổi
                if (!permissionName.equals(permission.getPermissionName())) {
                    permission.setPermissionName(permissionName);
                    permissionRepository.save(permission);
                }

            } else {
                // permission mới
                permission = new PermissionEntity();
                permission.setPermissionName(permissionName);
                permission = permissionRepository.save(permission);
            }

            // ===== INSERT ROLE_PERMISSION =====
            RolePermissionEntity rp = new RolePermissionEntity();
            rp.setRoleId(roleId);
            rp.setPermissionId(permission.getPermissionId());
            rolePermissionRepository.save(rp);
        }
    }


    /* =========================================================
       USER + ROLE
     ========================================================= */

    @Override
    public PageResult<AdminUserItemDto> searchUsers(
            PageRequestDto<AdminUserFilterDto> request
    ) {
        AdminUserFilterDto filter = request.getFilter();

        String username =
                filter != null ? filter.getUsername() : null;

        Page<UserEntity> page =
                userRepository.searchUsers(
                        username,
                        request.getPageRequest()
                );

        List<AdminUserItemDto> data =
                page.getContent()
                        .stream()
                        .filter(user -> {
                            RoleUserEntity ru =
                                    roleUserRepository.findFirstByUserIdAndScopeType(
                                            user.getUserId(),
                                            RoleUserEntity.ScopeType.SYSTEM
                                    );

                            if (ru == null) return true; // user thường → OK

                            RoleEntity role =
                                    roleRepository.findById(ru.getRoleId())
                                            .orElse(null);

                            // ❌ loại ADMIN
                            return role == null || !"ADMIN".equalsIgnoreCase(role.getRoleName());
                        })
                        .map(user -> {
                            AdminUserItemDto dto = new AdminUserItemDto();
                            dto.setUserId(user.getUserId());
                            dto.setUsername(user.getUserName());
                            dto.setEmail(user.getEmail());
                            dto.setRating(userService.findRatingByUserId(user.getUserId()));

                            // gán role (non-admin)
                            RoleUserEntity ru =
                                    roleUserRepository.findFirstByUserIdAndScopeType(
                                            user.getUserId(),
                                            RoleUserEntity.ScopeType.SYSTEM
                                    );

                            if (ru != null) {
                                RoleEntity role =
                                        roleRepository.findById(ru.getRoleId())
                                                .orElse(null);

                                if (role != null) {
                                    RoleDto roleDto = new RoleDto();
                                    roleDto.setRoleId(role.getRoleId());
                                    roleDto.setRoleName(role.getRoleName());
                                    dto.setRole(roleDto);
                                }
                            }

                            return dto;
                        })
                        .toList();


        return PageResult.<AdminUserItemDto>builder()
                .totalCount(page.getTotalElements())
                .data(data)
                .build();
    }

    @Override
    @Transactional
    public void clearRoleUserSystem(Long userId) {
        roleUserRepository.deleteByUserIdAndScopeType(
                userId,
                RoleUserEntity.ScopeType.SYSTEM
        );
    }
    @Override
    public void updateUserRole(Long userId, UpdateUserRoleRequestDto request) {

        userRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new RuntimeException("Role not found"));

        if(request.getRoleId()==2) return; // nos la USER binh thuong

        RoleUserEntity ru = RoleUserEntity.builder()
                .userId(userId)
                .roleId(request.getRoleId())
                .scopeType(RoleUserEntity.ScopeType.SYSTEM)
                .scopeId("0")
                .build();

        roleUserRepository.save(ru);
    }

    /* =========================================================
       USER RATING
     ========================================================= */

    @Override
    @Transactional
    public void updateUserRating(
            Long userId,
            UpdateUserRatingRequestDto request
    ) {
        UserRatingHistoryEntity latest =
                userRatingHistoryRepo.findLatestByUserId(userId)
                        .orElseThrow(() ->
                                new RuntimeException("User has no rating history"));

        int oldRating = latest.getRating();
        int newRating = request.getRating();

        latest.setRating(newRating);
        latest.setDelta(newRating - oldRating);

        userRatingHistoryRepo.save(latest);
    }

}

