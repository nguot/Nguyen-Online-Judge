package com.example.main_service.group.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvitationListItemResponse {
    private Long inviterId;
    private Long groupId;
    private String groupName;
}
