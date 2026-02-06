package com.example.main_service.group.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupDetailResponse {
    private Long groupId;
    private String groupName;
    private String description;
    private String avatar;
    private List<GroupMemberDto> members;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GroupMemberDto {
        private Long userId;
        private String userName;
        private String role;
    }
}
