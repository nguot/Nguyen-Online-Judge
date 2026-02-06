package com.example.main_service.user.dto;

import lombok.Data;

@Data
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private Long expiresIn;
    private Long userId;
    private Boolean isAdmin;
    private Boolean isProUser;
}
