package com.example.main_service.websocket;



import com.example.main_service.dashboard.service.DashBoardService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class SubmissionProgressConsumer {

    private final SubmissionConnectionManager wsManager;
    private final ObjectMapper mapper = new ObjectMapper();
    private final DashBoardService dashBoardService;
    public SubmissionProgressConsumer(SubmissionConnectionManager wsManager, DashBoardService dashBoardService) {
        this.wsManager = wsManager;
        this.dashBoardService = dashBoardService;
    }

    @KafkaListener(topics = "submission.progress", groupId = "submission-progress-consumer")
    public void onProgress(String message) throws Exception {
        JsonNode json = mapper.readTree(message);

        String submissionId = json.path("submissionId").asText(null);
        if (submissionId == null) return;

        // realtime WS trước
        wsManager.broadcast(submissionId, message);

        String status = json.path("status").asText("");
        if (!"DONE".equalsIgnoreCase(status)) return;

        // DONE cần đủ field
        JsonNode userIdNode = json.path("userId");
        JsonNode contestIdNode = json.path("contestId");
        JsonNode problemIdNode = json.path("problemId");
        JsonNode submittedAtEpochNode = json.path("submittedAtEpoch");

        if (userIdNode.isMissingNode() || contestIdNode.isMissingNode()
                || problemIdNode.isMissingNode() || submittedAtEpochNode.isMissingNode()) {
            System.out.println("[WARN] DONE event missing fields: " + message);
            return;
        }

        long userId = userIdNode.asLong();
        long contestId = contestIdNode.asLong();
        String problemId = problemIdNode.asText();
        boolean allAccepted = json.path("allAccepted").asBoolean(false);
        long submittedAtEpoch = submittedAtEpochNode.asLong();

        try {
            dashBoardService.onSubmissionJudged(
                    submissionId, userId, contestId, problemId, allAccepted, submittedAtEpoch
            );
        } catch (Exception ex) {
            // tuyệt đối đừng throw ra ngoài listener
            System.out.println("[ERROR] dashboard hook failed: " + ex.getMessage());
        }
    }

}

