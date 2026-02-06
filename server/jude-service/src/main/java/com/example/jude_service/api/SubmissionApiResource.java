package com.example.jude_service.api;

import com.example.jude_service.entities.CommonResponse;
import com.example.jude_service.entities.PageRequestDto;
import com.example.jude_service.entities.PageResult;
import com.example.jude_service.entities.submission.SubmissionEntity;
import com.example.jude_service.entities.submission.SubmissionInputDto;
import com.example.jude_service.services.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${api.prefix}/judge-service/submission")
@RequiredArgsConstructor
@Validated
public class SubmissionApiResource {

    private final SubmissionService submissionService;

    @PostMapping("")
    public CommonResponse<SubmissionEntity> submit(@RequestBody SubmissionInputDto input) {
        return submissionService.submit(input);
    }

    @PostMapping("/search")
    public CommonResponse<PageResult<SubmissionEntity>> getPage(@RequestBody PageRequestDto<SubmissionInputDto> pageRequest) {
        return submissionService.getPage(pageRequest);
    }

    @GetMapping("/{submissionId}")
    public CommonResponse<SubmissionEntity> getById(@PathVariable("submissionId") String submissionId) {
        return submissionService.getById(submissionId);
    }
}
