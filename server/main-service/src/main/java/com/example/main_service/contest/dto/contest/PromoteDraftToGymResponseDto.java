package com.example.main_service.contest.dto.contest;

import com.example.main_service.sharedAttribute.enums.ContestType;
import com.example.main_service.sharedAttribute.enums.ContestVisibility;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PromoteDraftToGymResponseDto {
    private Long contestId;

    private ContestType newType;

    private ContestVisibility visibility;

    private Boolean approved;

    private String message;
}
