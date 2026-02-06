package com.example.jude_service.producer;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class SubmissionProgressProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    public void send(String submissionId, int current, int total,String status) {
        try {
            var r = kafkaTemplate.send(
                    "submission.progress",
                    submissionId,
                    mapper.writeValueAsString(
                            Map.of(
                                    "submissionId", submissionId,
                                    "currentTest", current,
                                    "totalTests", total,
                                    "status", status
                            )
                    )
            );
            var result = r.get();
            System.out.println("sent " + result.getRecordMetadata());
            System.out.println("submission.progress topic ==== " + submissionId + " ==== " + current + " ===== " + total);
        } catch (Exception ignored) {}
    }
    public void send(
            String submissionId,
            int current,
            int total,
            String status,
            Map<String, Object> extra
    ) {
        try {
            Map<String, Object> base = new java.util.HashMap<>();
            base.put("submissionId", submissionId);
            base.put("currentTest", current);
            base.put("totalTests", total);
            base.put("status", status);

            if (extra != null) base.putAll(extra);

            var r = kafkaTemplate.send(
                    "submission.progress",
                    submissionId,
                    mapper.writeValueAsString(base)
            );
            r.get();
        } catch (Exception ignored) {}
    }

}
