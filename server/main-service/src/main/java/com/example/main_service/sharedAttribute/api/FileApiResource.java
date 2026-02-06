package com.example.main_service.sharedAttribute.api;

import com.example.main_service.sharedAttribute.commonDto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
}
