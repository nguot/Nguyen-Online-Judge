package com.example.main_service.contest.dto.contest;

import com.example.main_service.contest.model.ContestProblemEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class ContestDetailDto extends ContestSummaryDto{
    private List<ContestProblemEntity> problems; // list problemId
    private String contestRole;
}
