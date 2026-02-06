// ===== Roles =====
export type PermissionDto = {
  permissionId: number;
  permissionName: string;
};

export type RoleDetailDto = {
  roleId: number;
  roleCode: string;
  roleName: string;
  permissions: PermissionDto[];
};

export type UpdateRolePermissionItem = {
  permissionId?: number | null;
  permissionName: string;
};

export type UpdateRolePermissionRequestDto = {
  permissions: UpdateRolePermissionItem[];
};

// ===== Users =====
export type RoleDto = {
  roleId: number;
  roleName: string;
};

export type AdminUserItemDto = {
  userId: number;
  username: string;
  email: string;
  rating: number;
  role: RoleDto;
};

export type AdminUserFilterDto = {
  username?: string;
  roleId?: number;
};

export type PageRequestDto<TFilter> = {
  maxResultCount: number;
  skipCount: number;
  sorting?: string; // dùng "" nếu không sort
  filter: TFilter;
};

export type PageResult<T> = {
  totalCount: number;
  data: T[];
};

// change role
export type UpdateUserRoleRequestDto = {
  roleId: number;
};

// rating
export type UpdateUserRatingRequestDto = {
  rating: number;
  reason?: string;
};
