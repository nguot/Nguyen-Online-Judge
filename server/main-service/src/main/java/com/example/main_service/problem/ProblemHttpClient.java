package com.example.main_service.problem;

import com.example.main_service.problem.dto.ProblemEntity;
import com.example.main_service.problem.dto.ProblemInputDto;
import com.example.main_service.problem.dto.TestcaseEntity;
import com.example.main_service.sharedAttribute.commonDto.PageRequestDto;
import com.example.main_service.sharedAttribute.commonDto.PageResult;
import com.example.main_service.sharedAttribute.enums.LanguageType;
import com.example.main_service.sharedAttribute.enums.ProblemLevel;
import com.example.proto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Service
@RequiredArgsConstructor
public class ProblemHttpClient {
    private final JudgeProblemClient judge;

    public ProblemEntity addProblem(ProblemInputDto input) {
        return judge.addProblem(input).getData();
    }

    public PageResult<ProblemEntity> getProblemPage(PageRequestDto<ProblemInputDto> input) {
        return judge.getProblemPage(input).getData();
    }
}
