package com.example.main_service.group.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvitationListFilter {
    private Long groupId;
    private String prefix;
}
