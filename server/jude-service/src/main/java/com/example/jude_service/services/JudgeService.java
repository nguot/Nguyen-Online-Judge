package com.example.jude_service.services;

import com.example.jude_service.entities.judge.JudgeResult;
import com.example.jude_service.entities.submission.SubmissionInputDto;

import java.io.IOException;

public interface JudgeService {
    JudgeResult judge(String submissionId,SubmissionInputDto submission, String problemId) throws Exception;
}