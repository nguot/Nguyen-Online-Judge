package com.example.main_service.contest.dto.contestReviewer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestReviewerListResponseDto {
    private Long contestId;
    private List<ContestReviewerItemDto> reviewers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContestReviewerItemDto {
        private Long userId;
        private String username;
        private String fullName;
        private String email;
    }
}
