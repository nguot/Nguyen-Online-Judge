package com.example.main_service.group.dtos;

import com.example.main_service.group.model.GroupInvitationEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteActionResponse {
    private Long userId;
    private Long inviterId;
    private Long groupId;
    private GroupInvitationEntity.InvitationStatus status;
}
