package com.example.main_service.friend.dtos;

import com.example.main_service.friend.model.FriendshipStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FriendActionRequest {
    private Long friendId;

    private FriendshipStatus status; // ACCEPTED or DECLINED
}
