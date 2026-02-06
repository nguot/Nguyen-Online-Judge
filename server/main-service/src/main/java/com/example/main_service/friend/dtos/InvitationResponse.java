package com.example.main_service.friend.dtos;
import com.example.main_service.friend.model.FriendshipStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Builder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class InvitationResponse {
    private Long friendId;
    private String friendName;
    private FriendshipStatus status;
}
