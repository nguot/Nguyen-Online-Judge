package com.example.main_service.rbac.repo;

import com.example.main_service.rbac.model.PermissionEntity;
import com.example.main_service.user.dto.PermissionDto;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PermissionRepo extends JpaRepository<PermissionEntity, Integer> {

    @Query("SELECT p.permissionName FROM PermissionEntity p WHERE p.permissionId IN :ids")
    List<String> findPermissionNamesByIds(List<Integer> ids);

    @Query("SELECT p FROM PermissionEntity p WHERE p.permissionId IN :ids")
    List<PermissionEntity> findPermissionDetailByIds(List<Integer> ids);
}
