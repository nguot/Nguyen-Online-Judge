package com.example.jude_service.services.impl;

import com.example.jude_service.entities.CommonResponse;
import com.example.jude_service.entities.PageRequestDto;
import com.example.jude_service.entities.PageResult;
import com.example.jude_service.entities.judge.TestCaseResult;
import com.example.jude_service.entities.problem.ProblemEntity;
import com.example.jude_service.entities.problem.ProblemInputDto;
import com.example.jude_service.entities.testcase.TestcaseEntity;
import com.example.jude_service.enums.LanguageType;
import com.example.jude_service.enums.ResponseStatus;
import com.example.jude_service.exceptions.ErrorCode;
import com.example.jude_service.exceptions.specException.ProblemBusinessException;
import com.example.jude_service.repo.ProblemRepo;
import com.example.jude_service.services.ProblemService;
import com.example.jude_service.services.SubmissionService;
import com.example.jude_service.utils.StringUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;


@Service
@RequiredArgsConstructor
public class ProblemServiceImpl implements ProblemService {

    private final ProblemRepo problemRepo;
    private final MongoTemplate mongoTemplate;
    private final SubmissionService submissionService;
    private final DockerSandboxService dockerSandboxService;

    @Override
    public CommonResponse<ProblemEntity> addProblem(ProblemInputDto input) {
        validateBeforeInsertProblem(input);

        ProblemEntity entity = ProblemEntity.builder()
                .title(input.getTitle())
                .description(input.getDescription())
                .tags(input.getTags())
                .imageUrls(input.getImageUrls())
                .level(input.getLevel())
                .supportedLanguage(input.getSupportedLanguage())
                .rating(input.getRating())
                .score(input.getScore())
                .timeLimit(input.getTimeLimit())
                .memoryLimit(input.getMemoryLimit())
                .inputType(input.getInputType())
                .outputType(input.getOutputType())
                .authorId(input.getUserId())
                .createdBy(input.getUserId())
                .lastModifiedBy(input.getUserId())
                .contestId(input.getContestId())
                .build();

        Boolean isActive = input.getSolution() != null && input.getTestcaseEntities() != null;
        var testcaseList = input.getTestcaseEntities();
        if (testcaseList != null && !testcaseList.isEmpty()) {
            var response = validateTestcaseEntities(testcaseList, null, input.getSolution());
            testcaseList = response.getSecond();
            isActive = response.getFirst();
        }

        entity.setIsActive(isActive);
        entity.setTestcaseEntities(testcaseList);
        entity.setSolution(input.getSolution());

        problemRepo.save(entity);
        return CommonResponse.success(entity);
    }

    @Override
    public CommonResponse<ProblemEntity> cloneProblem(ProblemInputDto input) {
        validateBeforeInsertProblem(input);

        ProblemEntity entity = ProblemEntity.builder()
                .title(input.getTitle())
                .description(input.getDescription())
                .tags(input.getTags())
                .imageUrls(input.getImageUrls())
                .level(input.getLevel())
                .supportedLanguage(input.getSupportedLanguage())
                .rating(input.getRating())
                .score(input.getScore())
                .timeLimit(input.getTimeLimit())
                .memoryLimit(input.getMemoryLimit())
                .inputType(input.getInputType())
                .outputType(input.getOutputType())
                .authorId(input.getUserId())
                .createdBy(input.getUserId())
                .lastModifiedBy(input.getUserId())
                .contestId(input.getContestId())
                .build();

        Boolean isActive = input.getSolution() != null && input.getTestcaseEntities() != null;

        entity.setIsActive(isActive);
        entity.setTestcaseEntities(input.getTestcaseEntities());
        entity.setSolution(input.getSolution());

        problemRepo.save(entity);
        return CommonResponse.success(entity);
    }

    @Override
    public CommonResponse<PageResult<ProblemEntity>> getProblemPage(PageRequestDto<ProblemInputDto> input) {
        Query query = new Query();
        if (input.getFilter() != null) {
            query = filter(input);
        }
        PageResult<ProblemEntity> result = queryByFilter(query, input.getPageRequest());
        return CommonResponse.success(result);
    }

    @Override
    public CommonResponse<ProblemEntity> getProblemById(String problemId) {
        ProblemEntity entity = problemRepo.findById(problemId)
                .orElseThrow(() -> new ProblemBusinessException(ErrorCode.PROBLEM_NOT_FOUND));
        return CommonResponse.success(entity);
    }

    @Override
    public CommonResponse<PageResult<ProblemEntity>> getByContest(PageRequestDto<Long> input) {
        Long contestId = input.getFilter();

        Query query = new Query();
        query.addCriteria(
                Criteria.where("contestId").is(contestId)
        );

        PageResult<ProblemEntity> result = queryByFilter(query, input.getPageRequest());

        return CommonResponse.success(result);
    }

    @Override
    public CommonResponse<PageResult<ProblemEntity>> searching(PageRequestDto<String> input) {
        String searchTerm = input.getFilter();

        /**
         * TODO: lam tim kiem that chinh xac
         */
        Query query = new Query();
        query.addCriteria(
                new Criteria().orOperator(
                        Criteria.where("title").regex(searchTerm),
                        Criteria.where("description").regex(searchTerm)
                )
        );

        PageResult<ProblemEntity> result = queryByFilter(query, input.getPageRequest());
        return CommonResponse.success(result);
    }

    @Override
    public CommonResponse<ProblemEntity> updateProblem(ProblemInputDto input, String problemId) {
        ProblemEntity entity = problemRepo.findById(problemId)
                .orElseThrow(() -> new ProblemBusinessException(ErrorCode.PROBLEM_NOT_FOUND));

        /**
         * TODO: check lại yêu cầu từ FE, xem nếu một trường được cập nhat là xoá hêts gia tri trong do thi la khong gui truong do hay la gui truong rong, vi du isEmpty
         */

        if (!StringUtils.isNullOrEmpty(input.getTitle())) {
            entity.setTitle(input.getTitle());
        }
        if (input.getTags() != null && !input.getTags().isEmpty()) {
            entity.setTags(input.getTags());
        }
        if (input.getImageUrls() != null && !input.getImageUrls().isEmpty()) {
            entity.setImageUrls(input.getImageUrls());
        }
        if (input.getLevel() != null) {
            entity.setLevel(input.getLevel());
        }
        if (input.getSupportedLanguage() != null && !input.getSupportedLanguage().isEmpty()) {
            entity.setSupportedLanguage(input.getSupportedLanguage());
        }
        if (!StringUtils.isNullOrEmpty(input.getSolution())) {
            entity.setSolution(input.getSolution());
        }
        if (input.getRating() != null) {
            entity.setRating(input.getRating());
        }
        if (input.getScore() != null) {
            entity.setScore(input.getScore());
        }
        if (input.getTimeLimit() != null) {
            entity.setTimeLimit(input.getTimeLimit());
        }
        if (input.getMemoryLimit() != null) {
            entity.setMemoryLimit(input.getMemoryLimit());
        }
        if (!StringUtils.isNullOrEmpty(input.getInputType())) {
            entity.setInputType(input.getInputType());
        }
        if (!StringUtils.isNullOrEmpty(input.getOutputType())) {
            entity.setOutputType(input.getOutputType());
        }
        if (input.getTestcaseEntities() != null && !input.getTestcaseEntities().isEmpty()) {
            var validateTestcases = validateTestcaseEntities(input.getTestcaseEntities(), entity.getTestcaseEntities(), input.getSolution() != null? input.getSolution() : entity.getSolution());
            entity.setTestcaseEntities(
                    validateTestcases.getSecond()
            );
            entity.setIsActive(validateTestcases.getFirst());
        }
        if (input.getUserId() != null) {
            if (!input.getUserId().equals(entity.getAuthorId())){
                throw new ProblemBusinessException(ErrorCode.UNAUTHORIZED, "ban khong co quyen sua");
            }
            entity.setLastModifiedBy(input.getUserId());
        }

        problemRepo.save(entity);
        return CommonResponse.success(entity);
    }

    @Override
    public CommonResponse<ProblemEntity> deleteProblem(String problemId) {
        ProblemEntity problem = problemRepo.findById(problemId)
                .orElseThrow(() -> new ProblemBusinessException(ErrorCode.PROBLEM_NOT_FOUND));
        submissionService.deleteByProblem(problemId);
        problemRepo.delete(problem);
        return CommonResponse.success(problem);
    }

    void validateBeforeInsertProblem(ProblemInputDto input) {
        if (StringUtils.isNullOrEmpty(input.getTitle())) {
            throw new ProblemBusinessException(ErrorCode.PROBLEM_VALIDATE);
        }
        if (StringUtils.isNullOrEmpty(input.getDescription())) {
            throw new ProblemBusinessException(ErrorCode.PROBLEM_VALIDATE);
        }
        if (input.getSupportedLanguage().isEmpty()) {
            throw new ProblemBusinessException(ErrorCode.PROBLEM_VALIDATE);
        }
    }

    Pair<Boolean, List<TestcaseEntity>> validateTestcaseEntities(List<TestcaseEntity> newTestCaseList, List<TestcaseEntity> entityTestcases, String sourceCode) {
        Set<TestcaseEntity> set = new HashSet<>();
        if (entityTestcases != null && !entityTestcases.isEmpty()) {
            set.addAll(entityTestcases);
        }
        entityTestcases = new ArrayList<>();

        boolean isActive = Boolean.TRUE;
        if (sourceCode == null || sourceCode.isEmpty()) {
            isActive = Boolean.FALSE;
        }

        for (var testcase: newTestCaseList) {
            if (set.contains(testcase)) {
                continue;
            }
            Path currentRelativePath = Paths.get("");
            final String COMPILE_TEMP_DIR = String.valueOf(currentRelativePath.toAbsolutePath().resolve("compile-temp"));
            if (isActive == Boolean.TRUE) {
                TestCaseResult testCaseResult = dockerSandboxService.executeTestCase(
                        UUID.randomUUID() + sourceCode,
                        UUID.randomUUID().toString(),
                        testcase,
                        sourceCode,
                        1,
                        128,
                        COMPILE_TEMP_DIR
                );
                if (testCaseResult.getVerdict() != ResponseStatus.AC) {
                    continue;
                }
            }
            set.add(testcase);
            entityTestcases.add(testcase);
        }
        return Pair.of(isActive, entityTestcases);
    }

    Query filter(PageRequestDto<ProblemInputDto> input) {
        Query query = new Query();
        ProblemInputDto term = input.getFilter();

        if(term.getContestId()!=null) {
            query.addCriteria(
                    Criteria.where("contestId").is(term.getContestId())
            );
        }

        if(term.getUserId()!=null) {
            query.addCriteria(
                    Criteria.where("authorId").is(term.getUserId())
            );
        }
        if (term.getTags() != null && !term.getTags().isEmpty()) {
            query.addCriteria(
                    Criteria.where("tags").in(term.getTags())
            );
        }
        if (term.getLevel() != null) {
            query.addCriteria(
                    Criteria.where("level").is(term.getLevel())
            );
        }

        // can xem xet them, vi dang ra yeu cau chi la mot loai thoi
        if (term.getSupportedLanguage() != null && !term.getSupportedLanguage().isEmpty()) {
            LanguageType language = term.getSupportedLanguage().getFirst();
            query.addCriteria(
                    Criteria.where("supportedLanguage").is(language)
            );
        }

        if (term.getRating() != null) {
            query.addCriteria(
                    Criteria.where("rating").is(term.getRating())
            );
        }

        if (term.getScore() != null) {
            query.addCriteria(
                    Criteria.where("score").is(term.getScore())
            );
        }

        return query;
    }

    PageResult<ProblemEntity> queryByFilter(Query query, PageRequest input) {
        long count = mongoTemplate.count(query, ProblemEntity.class);

        query.with(input);

        List<ProblemEntity> entities = mongoTemplate.find(query, ProblemEntity.class);

        PageResult<ProblemEntity> pageResult = new PageResult<>();
        pageResult.setTotalCount(count);
        pageResult.setData(entities);
        return pageResult;
    }


}