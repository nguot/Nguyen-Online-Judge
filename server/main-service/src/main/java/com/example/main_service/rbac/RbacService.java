package com.example.main_service.rbac;

import com.example.main_service.rbac.model.RoleUserEntity;
import com.example.main_service.rbac.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor

public class RbacService {

    private final RoleUserRepo roleUserRepo;
    private final RolePermissionRepo rolePermissionRepo;
    private final PermissionRepo permRepo;
    private final RoleRepo roleRepo;


    public boolean hasPermission(Authentication auth,
                                 String permission,
                                 String scopeTypeStr,
                                 String scopeId) {

        if (auth == null) return false;
        Long userId =  (Long) auth.getPrincipal();
        RoleUserEntity.ScopeType scopeType = RoleUserEntity.ScopeType.valueOf(scopeTypeStr);

        if(isAdmin(userId)) return true;

        try {
            List<Integer> roleIds = roleUserRepo.findRoleIds(userId, scopeType, scopeId);
            if (roleIds.isEmpty()) return false;
            List<Integer> permIds = rolePermissionRepo.findPermissionIdsByRoleIds(roleIds);
            if (permIds.isEmpty()) return false;
            List<String> permNames = permRepo.findPermissionNamesByIds(permIds);
            return permNames.contains(permission);

        } catch (Exception e) {
            return false; // bắt mọi lỗi → coi như không có permission
        }
    }

    @Transactional
    public void cloneRoleUsersForScope(
            String oldScopeType,
            String oldScopeId,
            String newScopeType,
            String newScopeId
    ) {
        List<RoleUserEntity> oldRows =
                roleUserRepo.findByScopeTypeAndScopeId(RoleUserEntity.ScopeType.valueOf(oldScopeType), oldScopeId);

        if (oldRows.isEmpty()) return;

        List<RoleUserEntity> toSave = new ArrayList<>();

        for (RoleUserEntity r : oldRows) {
            Integer roleId = r.getRoleId();
            Long userId = r.getUserId();

            // tránh duplicate
            boolean exists = roleUserRepo.existsByRoleIdAndUserIdAndScopeTypeAndScopeId(
                    roleId, userId, RoleUserEntity.ScopeType.valueOf(newScopeType), newScopeId
            );
            if (exists) continue;

            RoleUserEntity clone = new RoleUserEntity();
            clone.setRoleId(roleId);
            clone.setUserId(userId);
            clone.setScopeType(RoleUserEntity.ScopeType.valueOf(newScopeType));
            clone.setScopeId(newScopeId);

            toSave.add(clone);
        }

        roleUserRepo.saveAll(toSave);
    }

    @Transactional
    public void assignRole(Long userId,
                           String roleName,
                           String scopeTypeStr,
                           String scopeId) {

        Integer roleId = roleRepo.findRoleIdByName(roleName);
        if (roleId == null) {
            throw new IllegalStateException("Role not found: " + roleName);
        }

        RoleUserEntity.ScopeType scopeType = RoleUserEntity.ScopeType.valueOf(scopeTypeStr);
        roleUserRepo.insertRoleUser(roleId, userId, scopeId, scopeType.name());
    }


    public static Long getUserIdFromToken() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return 0l; // tuc la k care mày là ai

        Object principal = auth.getPrincipal();

        if (principal instanceof Long l) {
            return l;
        }
        return 0l;
    }

    public boolean isAdmin(Long userId) {
        if (userId == null || userId == 0L) return false;

        try {
            Integer adminRoleId = roleRepo.findRoleIdByName("ADMIN");
            if (adminRoleId == null) return false;

            // SYSTEM scope: scope_id "0" nghĩa là global
            RoleUserEntity.ScopeType scopeType = RoleUserEntity.ScopeType.SYSTEM;
            List<Integer> roleIds = roleUserRepo.findRoleIds(userId, scopeType, "0");

            return roleIds.contains(adminRoleId);
        } catch (Exception e) {
            return false;
        }
    }
    public boolean isProUser(Long userId) {
        if (userId == null || userId == 0L) return false;

        try {
            Integer proUserRoleId = roleRepo.findRoleIdByName("PRO_USER");
            if (proUserRoleId == null) return false;

            RoleUserEntity.ScopeType scopeType = RoleUserEntity.ScopeType.SYSTEM;
            List<Integer> roleIds = roleUserRepo.findRoleIds(userId, scopeType, "0");

            return roleIds.contains(proUserRoleId);
        } catch (Exception e) {
            return false;
        }
    }
    public boolean isReviewer(Long userId,Long contestId) {
        if (userId == null || userId == 0L) return false;

        try {
            Integer reviewerRoleId = roleRepo.findRoleIdByName("REVIEWER");
            if (reviewerRoleId == null) return false;

            RoleUserEntity.ScopeType scopeType = RoleUserEntity.ScopeType.CONTEST;
            List<Integer> roleIds = roleUserRepo.findRoleIds(userId, scopeType, contestId.toString());

            return roleIds.contains(reviewerRoleId);
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional
    public void unassignRole(Long userId,
                             String roleName,
                             String scopeTypeStr,
                             String scopeId) {

        Integer roleId = roleRepo.findRoleIdByName(roleName);
        if (roleId == null) return; // idempotent

        RoleUserEntity.ScopeType scopeType = RoleUserEntity.ScopeType.valueOf(scopeTypeStr);
        roleUserRepo.deleteRoleUser(roleId, userId, scopeType, scopeId);
    }

    public List<Long> listUserIdsByRole(String roleName,
                                        String scopeTypeStr,
                                        String scopeId) {

        Integer roleId = roleRepo.findRoleIdByName(roleName);
        if (roleId == null) return List.of();

        RoleUserEntity.ScopeType scopeType = RoleUserEntity.ScopeType.valueOf(scopeTypeStr);
        return roleUserRepo.findUserIdsByRoleAndScope(roleId, scopeType, scopeId);
    }

    public boolean isGroupMember(Long userId, Long groupId) {
        if (userId == null || groupId == null) return false;

        try {
            RoleUserEntity.ScopeType scopeType = RoleUserEntity.ScopeType.GROUP;
            List<Integer> roleIds = roleUserRepo.findRoleIds(userId, scopeType, groupId.toString());
            return !roleIds.isEmpty(); // Có bất kỳ role nào trong group
        } catch (Exception e) {
            return false;
        }
    }

    public boolean hasGroupPermission(Long userId, Long groupId, String permission) {
        if (userId == null || groupId == null) return false;

        try {
            RoleUserEntity.ScopeType scopeType = RoleUserEntity.ScopeType.GROUP;
            List<Integer> roleIds = roleUserRepo.findRoleIds(userId, scopeType, groupId.toString());
            if (roleIds.isEmpty()) return false;

            List<Integer> permIds = rolePermissionRepo.findPermissionIdsByRoleIds(roleIds);
            if (permIds.isEmpty()) return false;

            List<String> permNames = permRepo.findPermissionNamesByIds(permIds);
            return permNames.contains(permission);
        } catch (Exception e) {
            return false;
        }
    }

    public List<Long> listReviewersByContestId(Long contestId) {
        if (contestId == null) return List.of();
        return listUserIdsByRole("REVIEWER", "CONTEST", contestId.toString());
    }
}
