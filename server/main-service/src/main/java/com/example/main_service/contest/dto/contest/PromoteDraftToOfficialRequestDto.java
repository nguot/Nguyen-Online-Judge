package com.example.main_service.contest.dto.contest;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PromoteDraftToOfficialRequestDto {

    private Long rated; //rated hay k

    private LocalDateTime startTime;

    private Integer duration;
}
