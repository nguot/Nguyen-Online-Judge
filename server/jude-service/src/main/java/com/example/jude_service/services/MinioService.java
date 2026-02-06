package com.example.jude_service.services;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.charset.Charset;
import java.nio.file.Path;

public interface MinioService {
    String upload(MultipartFile file, String objectName);
    InputStream getFile(String objectName);
    String uploadLocalFile(Path path, String objectName);
    void deleteFile(String objectName);
    byte[] readFileBytes(String objectName, long maxBytes);
    String readFileAsString(String objectName, Charset charset, long maxBytes);
    InputStream getObjectStream(String objectName);
}
