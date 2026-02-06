package com.example.main_service.contest.dto.contest;

import com.example.main_service.sharedAttribute.enums.ContestStatus;
import com.example.main_service.sharedAttribute.enums.ContestType;
import com.example.main_service.sharedAttribute.enums.ContestVisibility;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ContestFilterDto {
    private Long rated;

    private ContestStatus contestStatus;

    private ContestType contestType;

    private ContestVisibility visibility;

    private Long groupId;

    private Long authorId;
}
