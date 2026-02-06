package com.example.main_service.group.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "group_invitation")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupInvitationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id")
    private Long groupId;

    @Column(name = "inviter_id")
    private Long inviterId;

    @Column(name = "invitee_id")
    private Long inviteeId;

    @Enumerated(EnumType.STRING)
    private InvitationStatus status;

    public enum InvitationStatus {
        PENDING, ACCEPTED, DECLINED
    }
}