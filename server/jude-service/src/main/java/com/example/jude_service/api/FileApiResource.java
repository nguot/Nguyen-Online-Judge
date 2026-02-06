package com.example.jude_service.api;

import com.example.jude_service.entities.CommonResponse;
import com.example.jude_service.entities.ReadFileRequest;
import com.example.jude_service.services.MinioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@RestController
@RequestMapping("${api.prefix}/file")
@RequiredArgsConstructor
public class FileApiResource {

    private final MinioService minioService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CommonResponse<String> upload(@RequestParam("file") MultipartFile file) {
        String objectName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        String res = minioService.upload(file, objectName);
        return CommonResponse.success(res);
    }

    @PostMapping(value = "/read-file-content")
    public CommonResponse<String> getFileContent(@RequestBody ReadFileRequest req) {
        String content = minioService.readFileAsString(req.getFileName(), StandardCharsets.UTF_8, 5 * 1024 * 1024);
        return CommonResponse.success(normalizeNewlines(content));
    }
    public static String normalizeNewlines(String s) {
        if (s == null) return null;

        // trường hợp đã là xuống dòng thật (CRLF / CR)
        s = s.replace("\r\n", "\n").replace("\r", "\n");

        // trường hợp đang là ký tự lạ dạng text: "\r\n", "\n", "\r"
        s = s.replace("\\r\\n", "\n")
                .replace("\\n", "\n")
                .replace("\\r", "\n");

        return s;
    }

    @PostMapping(value = "/read-file-bytes")
    public ResponseEntity<byte[]> readFileBytes(@RequestBody ReadFileRequest req) {
        try (InputStream in = minioService.getObjectStream(req.getFileName());
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) >= 0) out.write(buf, 0, n);

            byte[] bytes = out.toByteArray();

            // đoán mime theo extension (đủ dùng cho avatar)
            String name = req.getFileName() == null ? "" : req.getFileName().toLowerCase();
            String contentType = "application/octet-stream";
            if (name.endsWith(".png")) contentType = MediaType.IMAGE_PNG_VALUE;
            else if (name.endsWith(".jpg") || name.endsWith(".jpeg")) contentType = MediaType.IMAGE_JPEG_VALUE;
            else if (name.endsWith(".webp")) contentType = "image/webp";
            else if (name.endsWith(".gif")) contentType = MediaType.IMAGE_GIF_VALUE;

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
