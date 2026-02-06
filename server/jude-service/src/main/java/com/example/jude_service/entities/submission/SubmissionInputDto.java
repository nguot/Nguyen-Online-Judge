package com.example.jude_service.entities.submission;

import com.example.jude_service.enums.LanguageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionInputDto {
    private String problemId;
    private Long contestId;
    private Long userId;
    private String sourceCode; // objectName cua source code
    private LanguageType language;
    private Boolean allAccepted;
}
