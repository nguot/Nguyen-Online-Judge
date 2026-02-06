package com.example.main_service.problem.dto;

import com.example.main_service.sharedAttribute.enums.LanguageType;
import com.example.main_service.sharedAttribute.enums.ProblemLevel;
import lombok.*;
import org.springframework.data.annotation.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class ProblemEntity {
    @Id
    private String problemId;

    private Long contestId;

    private String title;

    private String description; // de bai, chi luu url vao minio, dinh dang markdown

    private List<String> tags; // ví dụ như Backtrack, Dynamic Programing, ...
    private List<String> imageUrls; // hinfh anh dinh kem de bai, hinh anh duoc su dung trong de bai

    private ProblemLevel level;

    private List<LanguageType> supportedLanguage;

    private String solution; // tam thoi xu ly String, sau nay la luu file
    private Integer rating;
    private Integer score; // luu diem ma nguoi dung co the nhan duoc sau khi pass

    private Integer timeLimit; // giây
    private Integer memoryLimit;

    private String inputType;

    private String outputType;
    // 2 trường inputType và outputType cần xem xét thêm vì có thể gán mặc định là stdin/stdout, nhưng cần xem xét thêm đối với các ngôn ngữ như java, python, javascript

    private Long authorId;
    private List<TestcaseEntity> testcaseEntities;

    private Long createdBy;
    private Long lastModifiedBy;

}
