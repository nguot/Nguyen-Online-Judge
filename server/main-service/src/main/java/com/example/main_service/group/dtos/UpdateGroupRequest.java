package com.example.main_service.group.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGroupRequest {
    private Long groupId;
    private String groupName;
    private String description;
    private String avatar;
}