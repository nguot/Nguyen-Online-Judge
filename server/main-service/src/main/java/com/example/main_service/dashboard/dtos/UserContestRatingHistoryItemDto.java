package com.example.main_service.dashboard.dtos;


import lombok.Builder;
import lombok.Data;

@Data
@Builder

public class UserContestRatingHistoryItemDto {
    private Long contestId;
    private Integer newRating;  // rating sau contest
    private Integer delta;      // newRating - prevNewRating
}
