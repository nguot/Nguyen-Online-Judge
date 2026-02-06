package com.example.main_service.user.dto;

import lombok.Data;

@Data
public class AdminUserItemDto {
    private Long userId;
    private String username;
    private String email;
    private Integer rating;
    private RoleDto role;
}

