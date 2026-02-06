package com.example.main_service.group.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGroupResponse {
    private Long groupId;
    private String groupName;
    private String description;
    private String avatar;
}
