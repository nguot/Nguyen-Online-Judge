package com.example.main_service.friend.service;

import com.example.main_service.friend.dtos.*;
import com.example.main_service.friend.model.FriendshipStatus;
import com.example.main_service.friend.model.UserFriendship;
import com.example.main_service.friend.repo.UserFriendshipRepo;
import com.example.main_service.sharedAttribute.commonDto.CommonResponse;
import com.example.main_service.sharedAttribute.commonDto.PageRequestDto;
import com.example.main_service.sharedAttribute.commonDto.PageResult;
import com.example.main_service.sharedAttribute.exceptions.ErrorCode;
import com.example.main_service.user.model.UserEntity;
import com.example.main_service.user.repo.UserRepo;
import com.example.main_service.user.service.UserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FriendshipServiceImpl implements FriendshipService {

    private final UserFriendshipRepo friendshipRepository;
    private final UserRepo userRepo;
    private final UserService userService;

    @Override
    public CommonResponse<Void> inviteFriend(Long userId, FriendInviteRequest request) {
        // Validate not inviting self
        if (userId.equals(request.getFriendId())) {
            return CommonResponse.fail(ErrorCode.BAD_REQUEST, "Cannot invite yourself");
        }

        // Check if friend exists
        Optional<UserEntity> friendOpt = userRepo.findByUserId(request.getFriendId());

        if (friendOpt.isEmpty()) {
            return CommonResponse.fail(ErrorCode.NOT_FOUND, "User not found");
        }

        // Check if friendship already exists
        Optional<UserFriendship> existing = friendshipRepository
                .findFriendship(userId, request.getFriendId());

        if (existing.isPresent()) {
            UserFriendship existingFriendship = existing.get();
            if (existingFriendship.getStatus() == FriendshipStatus.PENDING) {
                return CommonResponse.fail(ErrorCode.BAD_REQUEST,
                        "Friend invitation already sent");
            } else if (existingFriendship.getStatus() == FriendshipStatus.ACCEPTED) {
                return CommonResponse.fail(ErrorCode.BAD_REQUEST,
                        "Already friends with this user");
            } else if (existingFriendship.getStatus() == FriendshipStatus.DECLINED) {
                return CommonResponse.fail(ErrorCode.BAD_REQUEST,
                        "Friend request was previously declined");
            }
        }

        // Create new friendship invitation
        UserFriendship friendship = UserFriendship.builder()
                .userId(userId)
                .friendId(request.getFriendId())
                .status(FriendshipStatus.PENDING)
                .build();

        friendshipRepository.save(friendship);

        return CommonResponse.success(null, "Friend invitation sent successfully");
    }

    @Override
    @Transactional
    public CommonResponse<List<InvitationResponse>> getInvitationList(Long userId) {
        List<UserFriendship> invitations = friendshipRepository.findPendingInvitations(userId);

        if (invitations.isEmpty()) {
            return CommonResponse.success(Collections.emptyList());
        }

        // Get all sender user IDs
        List<Long> senderIds = invitations.stream()
                .map(UserFriendship::getUserId)
                .collect(Collectors.toList());

        // Batch fetch user details using your existing query
        List<Object[]> userIdAndNames = userRepo.findUserIdAndUserNameByUserIdIn(senderIds);

        // Convert to map for quick lookup
        Map<Long, String> userNameMap = userIdAndNames.stream()
                .collect(Collectors.toMap(
                        arr -> (Long) arr[0],    // userId
                        arr -> (String) arr[1]   // userName
                ));

        // Build response list
        List<InvitationResponse> responses = invitations.stream()
                .map(friendship -> InvitationResponse.builder()
                        .friendId(friendship.getUserId())
                        .friendName(userNameMap.getOrDefault(friendship.getUserId(), "Unknown"))
                        .status(friendship.getStatus())
                        .build())
                .collect(Collectors.toList());

        return CommonResponse.success(responses);
    }

    @Override
    public CommonResponse<Void> handleFriendAction(Long userId, FriendActionRequest request) {
        // Validate status
        if (request.getStatus() != FriendshipStatus.ACCEPTED &&
                request.getStatus() != FriendshipStatus.DECLINED) {
            return CommonResponse.fail(ErrorCode.BAD_REQUEST,
                    "Status must be ACCEPTED or DECLINED");
        }

        // Find pending invitation where userId is the friendId (receiver)
        Optional<UserFriendship> friendshipOpt = friendshipRepository
                .findFriendship(request.getFriendId(), userId);

        if (friendshipOpt.isEmpty()) {
            return CommonResponse.fail(ErrorCode.NOT_FOUND,
                    "Friend invitation not found");
        }

        UserFriendship friendship = friendshipOpt.get();

        // Verify it's a pending invitation for this user
        if (!friendship.getFriendId().equals(userId) ||
                friendship.getStatus() != FriendshipStatus.PENDING) {
            return CommonResponse.fail(ErrorCode.BAD_REQUEST,
                    "Invalid invitation or invitation is not pending");
        }

        // Update status
        friendship.setStatus(request.getStatus());
        friendshipRepository.save(friendship);

        String message = request.getStatus() == FriendshipStatus.ACCEPTED
                ? "Friend request accepted"
                : "Friend request declined";

        return CommonResponse.success(null, message);
    }

    @Override
    public CommonResponse<Void> unfriend(Long userId, UnfriendRequest request) {
        Optional<UserFriendship> friendshipOpt = friendshipRepository
                .findFriendship(userId, request.getFriendId());

        if (friendshipOpt.isEmpty()) {
            return CommonResponse.fail(ErrorCode.NOT_FOUND, "Friendship not found");
        }

        UserFriendship friendship = friendshipOpt.get();
        if (friendship.getStatus() != FriendshipStatus.ACCEPTED) {
            return CommonResponse.fail(ErrorCode.BAD_REQUEST,
                    "Can only unfriend accepted friends");
        }

        friendshipRepository.deleteFriendship(userId, request.getFriendId());

        return CommonResponse.success(null, "Unfriended successfully");
    }

    @Override
    @Transactional
    public CommonResponse<PageResult<FriendResponse>> getFriendList(
            Long userId, PageRequestDto<FriendListFilter> request) {

        // Get filter
        String friendName = null;
        if (request.getFilter() != null && request.getFilter().getFriendName() != null) {
            friendName = request.getFilter().getFriendName().trim();
            if (friendName.isEmpty()) {
                friendName = null;
            }
        }

        // Query with filter
        Page<UserFriendship> friendshipsPage;
        if (friendName != null) {
            friendshipsPage = friendshipRepository.findAcceptedFriendsWithFilter(
                    userId, friendName, request.getPageRequest());
        } else {
            friendshipsPage = friendshipRepository.findAcceptedFriends(
                    userId, request.getPageRequest());
        }

        if (friendshipsPage.getContent().isEmpty()) {
            PageResult<FriendResponse> pageResult = new PageResult<>();
            pageResult.setData(Collections.emptyList());
            pageResult.setTotalCount(0L);
            return CommonResponse.success(pageResult);
        }

        // Extract friend IDs
        List<Long> friendIds = friendshipsPage.getContent().stream()
                .map(friendship -> friendship.getUserId().equals(userId)
                        ? friendship.getFriendId()
                        : friendship.getUserId())
                .collect(Collectors.toList());

        // Batch fetch user details using your existing query
        List<Object[]> userIdAndNames = userRepo.findUserIdAndUserNameByUserIdIn(friendIds);

        // Convert to map for quick lookup
        Map<Long, String> userNameMap = userIdAndNames.stream()
                .collect(Collectors.toMap(
                        arr -> (Long) arr[0],    // userId
                        arr -> (String) arr[1]   // userName
                ));

        // Build response list
        List<FriendResponse> friends = friendshipsPage.getContent().stream()
                .map(friendship -> {
                    Long friendId = friendship.getUserId().equals(userId)
                            ? friendship.getFriendId()
                            : friendship.getUserId();

                    return FriendResponse.builder()
                            .friendId(friendId)
                            .friendName(userNameMap.getOrDefault(friendId, "Unknown"))
                            .rating(calculateRating(friendId)) // You can implement rating logic
                            .build();
                })
                .collect(Collectors.toList());

        PageResult<FriendResponse> pageResult = new PageResult<>();
        pageResult.setData(friends);
        pageResult.setTotalCount(friendshipsPage.getTotalElements());

        return CommonResponse.success(pageResult);
    }

    private int calculateRating(Long friendId) {
        return userService.findRatingByUserId(friendId);
    }
}
