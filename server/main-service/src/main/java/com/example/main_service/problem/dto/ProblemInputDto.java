package com.example.main_service.problem.dto;

import com.example.main_service.sharedAttribute.enums.LanguageType;
import com.example.main_service.sharedAttribute.enums.ProblemLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class ProblemInputDto { // thieu problemId so voi problem entity

    private String title;
    private Long contestId;
    private String description;
    private List<String> tags;
    private List<String> imageUrls; // tam thoi phong an :))
    private ProblemLevel level;

    private List<LanguageType> supportedLanguage;

    private String solution; // tam thoi xu ly String, sau nay la luu file
    private Integer rating;
    private Integer score;

    private Integer timeLimit;
    private Integer memoryLimit;
    private String inputType; //stdin
    private String outputType; //stdout

    private List<TestcaseEntity> testcaseEntities;

    private Long userId;
}
