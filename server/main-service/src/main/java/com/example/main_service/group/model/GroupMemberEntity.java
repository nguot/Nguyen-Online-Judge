package com.example.main_service.group.model;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "group_member")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMemberEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id")
    private Long groupId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "invite_by_user_")
    private Long inviteByUserId;

    @CreationTimestamp
    @Column(name = "joined_at")
    private LocalDateTime joinedAt;
}