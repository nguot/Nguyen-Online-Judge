package com.example.main_service.submission;

import com.example.main_service.sharedAttribute.commonDto.CommonResponse;
import com.example.main_service.sharedAttribute.commonDto.PageRequestDto;
import com.example.main_service.sharedAttribute.commonDto.PageResult;
import com.example.main_service.submission.dto.SubmissionEntity;
import com.example.main_service.submission.dto.SubmissionInputDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionHttpClient {

    private final JudgeServiceSubmissionClient judge;
    SubmissionEntity submit(SubmissionInputDto submission) {
        return unwrap(judge.submit(submission));
    }

    PageResult<SubmissionEntity> getPage(PageRequestDto<SubmissionInputDto> pageRequest) {
        System.out.println("======Submission http client=======" + pageRequest.getFilter());
        return unwrap(judge.getPage(pageRequest));
    }

    SubmissionEntity getById(String submissionId) {
        return unwrap(judge.getById(submissionId));
    }

    private static <T> T unwrap(CommonResponse<T> res) {
        if (res == null) return null;
        if (Boolean.FALSE.equals(res.getIsSuccessfull())) {
            throw new RuntimeException(res.getMessage());
        }
        return res.getData();
    }
}

