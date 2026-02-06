package com.example.main_service.group.dtos;

import com.example.main_service.group.model.GroupInvitationEntity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.jetbrains.annotations.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InviteActionRequest {
    @NotNull
    private Long inviterId;
    @NotNull
    private Long groupId;
    @NotNull
    private GroupInvitationEntity.InvitationStatus status; // ACCEPTED or DECLINED
}
