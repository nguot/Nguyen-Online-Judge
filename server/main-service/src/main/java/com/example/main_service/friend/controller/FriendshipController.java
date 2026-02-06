package com.example.main_service.friend.controller;

import com.example.main_service.friend.dtos.*;
import com.example.main_service.friend.service.FriendshipService;
import com.example.main_service.sharedAttribute.commonDto.CommonResponse;
import com.example.main_service.sharedAttribute.commonDto.PageRequestDto;
import com.example.main_service.sharedAttribute.commonDto.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.example.main_service.rbac.RbacService.getUserIdFromToken;

@RestController
@RequestMapping("/api/v1/friends")
@RequiredArgsConstructor
public class FriendshipController {

    private final FriendshipService friendshipService;

    @PostMapping("/invite")
    public CommonResponse<Void> inviteFriend(
            @RequestBody FriendInviteRequest request) {
        return friendshipService.inviteFriend(getUserIdFromToken(), request);
    }

    @GetMapping("/invitation-list")
    public CommonResponse<List<InvitationResponse>> getInvitationList() {
        return friendshipService.getInvitationList(getUserIdFromToken());
    }

    @PostMapping("/action")
    public CommonResponse<Void> handleFriendAction(
             @RequestBody FriendActionRequest request) {
        return friendshipService.handleFriendAction(getUserIdFromToken(), request);
    }

    @PostMapping("/unfriend")
    public CommonResponse<Void> unfriend(
            @RequestBody UnfriendRequest request) {
        return friendshipService.unfriend(getUserIdFromToken(), request);
    }

    @PostMapping("/list")
    public CommonResponse<PageResult<FriendResponse>> getFriendList(
            @RequestBody PageRequestDto<FriendListFilter> request) {
        return friendshipService.getFriendList(getUserIdFromToken(), request);
    }
}
