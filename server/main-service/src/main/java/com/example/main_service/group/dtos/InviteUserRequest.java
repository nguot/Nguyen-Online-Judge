package com.example.main_service.group.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.jetbrains.annotations.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InviteUserRequest {
    @NotNull
    private Long groupId;
    @NotNull
    private Long inviteeId;
}
