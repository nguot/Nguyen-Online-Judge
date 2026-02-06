package com.example.main_service.submission;

import com.example.main_service.sharedAttribute.commonDto.CommonResponse;
import com.example.main_service.sharedAttribute.commonDto.PageRequestDto;
import com.example.main_service.sharedAttribute.commonDto.PageResult;
import com.example.main_service.submission.dto.SubmissionEntity;
import com.example.main_service.submission.dto.SubmissionInputDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(
        name = "judgeSubmissionClient",
        url = "${judge.base-url:http://localhost:5000}",
        path = "${judge.api-prefix:/api/v1}/judge-service/submission"
)
public interface JudgeServiceSubmissionClient {
    @PostMapping("")
    CommonResponse<SubmissionEntity> submit(@RequestBody SubmissionInputDto input);

    @PostMapping("/search")
    CommonResponse<PageResult<SubmissionEntity>> getPage(PageRequestDto<SubmissionInputDto> pageRequest);

    @GetMapping("/{submissionId}")
    CommonResponse<SubmissionEntity> getById(@PathVariable("submissionId") String submissionId);
}

