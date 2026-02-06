package com.example.main_service.group.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Request DTOs
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateGroupRequest {
    private String groupName;
    private String description;
    private String avatar;
}
