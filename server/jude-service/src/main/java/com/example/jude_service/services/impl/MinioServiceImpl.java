package com.example.jude_service.services.impl;

import com.example.jude_service.services.MinioService;
import com.example.jude_service.utils.StringUtils;
import io.minio.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Files;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioServiceImpl implements MinioService {

    private final MinioClient minioClient;
    @Value("${minio.bucket-name}")
    private String bucketName;

    @Override
    public String upload(MultipartFile file, String objectName) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        try (InputStream inputStream = file.getInputStream()) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                            .build()
            );
            return objectName;
        } catch (Exception e) {
            log.error("error on save file", e);
            throw new RuntimeException(e);
        }
    }

    @Override
    public InputStream getFile(String objectName) {

        if (StringUtils.isNullOrBlank(objectName)) {
            throw new IllegalArgumentException("Object name is empty");
        }

        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
        } catch (Exception e) {
            log.error("error on get file", e);
            throw new RuntimeException(e);
        }
    }

    @Override
    public String uploadLocalFile(Path path, String objectName) {
        try {
            if (!Files.exists(path)) {
                throw new RuntimeException("File does not exist");
            }
            minioClient.uploadObject(
                    UploadObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .filename(path.toString())
                            .build()
            );
            return objectName;
        } catch (Exception e) {
            log.error("error on save file", e);
            throw new RuntimeException(e);
        }
    }

    @Override
    public void deleteFile(String objectName) {
        if (StringUtils.isNullOrBlank(objectName)) {
            throw new IllegalArgumentException("Object name is empty");
        }
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
        } catch (Exception e) {
            log.error("error on delete file", e);
            throw new RuntimeException(e);
        }
    }

    @Override
    public byte[] readFileBytes(String objectName, long maxBytes) {
        if (StringUtils.isNullOrBlank(objectName)) {
            throw new IllegalArgumentException("Object name is empty");
        }
        if (maxBytes <= 0) {
            throw new IllegalArgumentException("maxBytes must be > 0");
        }

        try (InputStream in = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .build()
        )) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();

            byte[] buf = new byte[8192];
            long total = 0;

            int n;
            while ((n = in.read(buf)) != -1) {
                total += n;
                if (total > maxBytes) {
                    throw new IllegalArgumentException("File too large (>" + maxBytes + " bytes)");
                }
                out.write(buf, 0, n);
            }
            return out.toByteArray();
        } catch (Exception e) {
            log.error("error on read file bytes: {}", objectName, e);
            throw new RuntimeException(e);
        }
    }

    @Override
    public String readFileAsString(String objectName, Charset charset, long maxBytes) {
        if (charset == null) charset = StandardCharsets.UTF_8;
        byte[] bytes = readFileBytes(objectName, maxBytes);
        return new String(bytes, charset);
    }

    public InputStream getObjectStream(String objectName) {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

}
