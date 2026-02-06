// src/services/userProfileApi.ts
import { apiClient } from "./apiClient";

export type UserDetailDto = {
  userId: number;
  userName: string;
  email: string;
  info: string;
};

export type UserContestRatingHistoryItemDto = {
  contestId: number;
  newRating: number;
  delta: number;
};

// GET /user/{user_name}
export function getUserProfile(username: string) {
  return apiClient.get<UserDetailDto>(`/user/${username}`);
}

// GET /user/rating-history/{user_id}
export function getUserRatingHistory(userId: number) {
  return apiClient.get<UserContestRatingHistoryItemDto[]>(
    `/user/rating-history/${userId}`
  );
}
