package com.example.main_service.contest.model;

import com.example.main_service.sharedAttribute.enums.ContestStatus;
import com.example.main_service.sharedAttribute.enums.ContestType;
import com.example.main_service.sharedAttribute.enums.ContestVisibility;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "contest")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestEntity {

    @Id
    @Column(name = "contest_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long contestId;

    private String title;
    private String description;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    private Integer duration;

    @Column(name = "contest_status")
    @Enumerated(EnumType.STRING)
    private ContestStatus contestStatus;

    @Column(name = "contest_type")
    @Enumerated(EnumType.STRING)
    private ContestType contestType;

    private Long author;
    private Long rated;

    @Enumerated(EnumType.STRING)
    private ContestVisibility visibility;

    @Column(name = "group_id")
    private Long groupId;

    @Column(name = "rating_calculated", nullable = false)
    private Boolean ratingCalculated = false;

    public ContestStatus getContestStatus() {
        // Nếu không có startTime thì không thể suy ra -> giữ giá trị đang lưu (nếu có), mặc định UPCOMING
        if (this.startTime == null) {
            return this.contestStatus != null ? this.contestStatus : ContestStatus.UPCOMING;
        }

        // duration null / <= 0: coi như contest chỉ “đến giờ là chạy”, không có end rõ ràng
        // (tuỳ business m có thể đổi sang FINISHED luôn; ở đây chọn RUNNING khi đã tới giờ)
        int dur = (this.duration == null ? 0 : this.duration);

        LocalDateTime now = LocalDateTime.now();

        // Chưa đến giờ bắt đầu
        if (now.isBefore(this.startTime)) {
            return ContestStatus.UPCOMING;
        }

        // Đã đến giờ bắt đầu
        if (dur <= 0) {
            return ContestStatus.RUNNING;
        }

        LocalDateTime endTime = this.startTime.plusSeconds(dur);

        // now >= endTime => FINISHED, còn lại => RUNNING
        return now.isBefore(endTime) ? ContestStatus.RUNNING : ContestStatus.FINISHED;
    }
}
