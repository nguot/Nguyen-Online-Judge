package com.example.main_service.contest.dto.contest;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PromoteDraftToGymRequestDto {
    private LocalDateTime startTime;
    private Integer duration;
    private Long groupId; // Thêm field này
}
