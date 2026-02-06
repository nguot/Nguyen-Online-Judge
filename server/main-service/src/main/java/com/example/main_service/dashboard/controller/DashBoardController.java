package com.example.main_service.dashboard.controller;

import com.example.main_service.dashboard.dtos.ContestRatingCalcResponseDto;
import com.example.main_service.dashboard.dtos.DashBoardPageResponseDto;
import com.example.main_service.dashboard.service.ContestRatingService;
import com.example.main_service.dashboard.service.DashBoardService;
import com.example.main_service.sharedAttribute.commonDto.CommonResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import static com.example.main_service.rbac.RbacService.getUserIdFromToken;

@RestController
@RequestMapping("${api.prefix}/contest")
@RequiredArgsConstructor
@Validated
@Slf4j

// thêm api tính rating cho problem dựa trên trung bình rating user giải nó

public class DashBoardController {
    private final DashBoardService dashBoardService;
    private final ContestRatingService contestRatingService;

    // mỗi 5-10s FE gọi lại api này dựa trên page hiện tại của user
    @PostMapping("/dashboard/page/{contestId}")
    public CommonResponse<DashBoardPageResponseDto> getDashboard(
            @PathVariable Long contestId,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return CommonResponse.success(
                dashBoardService.getDashBoard(contestId, offset, limit)
        );
    }

    @PostMapping("/dashboard/page/{contestId}/friends")
    public CommonResponse<DashBoardPageResponseDto> getFriendsRanking(
            @PathVariable Long contestId,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return CommonResponse.success(
                dashBoardService.getFriendsRanking(contestId, getUserIdFromToken(), offset, limit)
        );
    }

//    @PostMapping("/{contestId}/calculate-rating") // scheduler 30s đọc bảng contest xem có cái nào được tính chưa
//    public CommonResponse<ContestRatingCalcResponseDto> calculateRating(
//            @PathVariable Long contestId
//    ) {
//        return CommonResponse.success(
//                contestRatingService.calculateRating(contestId) // tính rating cho problem nữa
//        );
//    }
}
