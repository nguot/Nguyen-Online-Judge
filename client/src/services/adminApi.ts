import {apiClient} from "./apiClient";
import type {
  RoleDetailDto,
  UpdateRolePermissionRequestDto,
  PageRequestDto,
  AdminUserFilterDto,
  PageResult,
  AdminUserItemDto,
  UpdateUserRoleRequestDto,
  UpdateUserRatingRequestDto,
} from "../types/admin";

// ===== Roles =====
export const adminApi = {
  getRoleDetail: (roleId: number) =>
    apiClient.get<RoleDetailDto>(`/admin/roles/${roleId}`),

  updateRolePermissions: (roleId: number, body: UpdateRolePermissionRequestDto) =>
    apiClient.post<string>(`/admin/roles/${roleId}/permissions`, body),

  // ===== Users =====
  searchUsers: (body: PageRequestDto<AdminUserFilterDto>) =>
    apiClient.post<PageResult<AdminUserItemDto>>(`/admin/users/search`, body),

  updateUserRole: (userId: number, body: UpdateUserRoleRequestDto) =>
    apiClient.post<string>(`/admin/users/${userId}/role`, body),

  updateUserRating: (userId: number, body: UpdateUserRatingRequestDto) =>
    apiClient.post<string>(`/admin/users/${userId}/rating`, body),
};
