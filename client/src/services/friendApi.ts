import { apiClient } from "./apiClient";
import type { PageRequestDto, PageResult } from "../types/api";

/* ================= TYPES ================= */

export type FriendStatus = "ACCEPTED" | "PENDING" | "DECLINED";

export type FriendInvitationDto = {
  friendId: number;
  friendName: string;
  status: FriendStatus;
};

export type FriendListItemDto = {
  friendId: number;
  friendName: string;
  rating: number;
};

/* ================= API ================= */

// gửi lời mời kết bạn
export function inviteFriend(friendId: number) {
  return apiClient.post<void>(`/friends/invite`,{friendId});
}

// danh sách invitation (poll)
export function getInvitationList() {
  return apiClient.get<FriendInvitationDto[]>(`/friends/invitation-list`);
}

// accept / decline
export function actionInvitation(
  friendId: number,
  status: "ACCEPTED" | "DECLINED"
) {
  return apiClient.post<void>(`/friends/action`, {
    friendId,
    status,
  });
}

// hủy kết bạn
export function unfriend(friendId: number) {
  return apiClient.post<void>(`/friends/unfriend`,{friendId});
}

// danh sách bạn bè (có paging)
export function listFriends(
  req: PageRequestDto<{ friendName?: string }>
) {
  return apiClient.post<PageResult<FriendListItemDto>>(
    `/friends/list`,
    req
  );
}
