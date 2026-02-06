package com.example.jude_service.producer;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestProducer {
    private final SubmissionProgressProducer producer;

    public TestProducer(SubmissionProgressProducer producer) {
        this.producer = producer;
    }

    @GetMapping("/test/send")
    public ResponseEntity<String> testKafkaSend() {
        producer.send("abc123", 3, 10,"gay");
        return ResponseEntity.ok("Sent!");
    }
}
