package com.example.main_service.user.dto;

import lombok.Data;

import java.util.List;

@Data
public class UpdateRolePermissionRequestDto {
    private List<UpdateRolePermissionItem> permissions;
}

