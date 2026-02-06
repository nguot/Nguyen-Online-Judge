package com.example.main_service.friend.service;

import com.example.main_service.friend.dtos.*;
import com.example.main_service.sharedAttribute.commonDto.CommonResponse;
import com.example.main_service.sharedAttribute.commonDto.PageRequestDto;
import com.example.main_service.sharedAttribute.commonDto.PageResult;

import java.util.List;

public interface FriendshipService {

    CommonResponse<Void> inviteFriend(Long userId, FriendInviteRequest request);

    CommonResponse<List<InvitationResponse>> getInvitationList(Long userId);

    CommonResponse<Void> handleFriendAction(Long userId, FriendActionRequest request);

    CommonResponse<Void> unfriend(Long userId, UnfriendRequest request);

    CommonResponse<PageResult<FriendResponse>> getFriendList(Long userId, PageRequestDto<FriendListFilter> request);
}
