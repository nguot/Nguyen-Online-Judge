package com.example.main_service.rbac.repo;

import com.example.main_service.rbac.model.RoleUserEntity;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoleUserRepo extends CrudRepository<RoleUserEntity, Integer> {

    @Query("""
            SELECT ru.roleId
            FROM RoleUserEntity ru
            WHERE ru.userId = :userId
              AND ru.scopeType = :scopeType
              AND ru.scopeId = :scopeId
            """)
    List<Integer> findRoleIds(Long userId, RoleUserEntity.ScopeType scopeType , String scopeId);

    @Modifying
    @Query(
            value = "INSERT INTO role_user (role_id, user_id, scope_id, scope_type) " +
                    "VALUES (:roleId, :userId, :scopeId, :scopeType)",
            nativeQuery = true
    )
    void insertRoleUser(Integer roleId, Long userId, String scopeId, String scopeType);

    @Query("""
    SELECT r.roleName
    FROM RoleUserEntity ru
    LEFT JOIN RoleEntity r ON ru.roleId = r.roleId
    WHERE ru.userId = :userId
      AND (
            (ru.scopeType = :contestScopeType AND ru.scopeId = :contestId)
      )
""")
    List<String> findUserRolesForContest(
            Long userId,
            RoleUserEntity.ScopeType contestScopeType,
            String contestId,
            RoleUserEntity.ScopeType systemScopeType
    );

    List<RoleUserEntity> findByUserIdAndScopeType(Long userId, RoleUserEntity.ScopeType scopeType);

    void deleteByUserIdAndScopeType(Long userId, RoleUserEntity.ScopeType scopeType);

    RoleUserEntity findFirstByUserIdAndScopeType(Long userId, RoleUserEntity.ScopeType scopeType);

    @Query("""
            SELECT ru.userId
            FROM RoleUserEntity ru
            WHERE ru.roleId = :roleId
              AND ru.scopeType = :scopeType
              AND ru.scopeId = :scopeId
            """)
    List<Long> findUserIdsByRoleAndScope(Integer roleId, RoleUserEntity.ScopeType scopeType, String scopeId);

    @Modifying
    @Query("""
            DELETE FROM RoleUserEntity ru
            WHERE ru.roleId = :roleId
              AND ru.userId = :userId
              AND ru.scopeType = :scopeType
              AND ru.scopeId = :scopeId
            """)
    void deleteRoleUser(Integer roleId, Long userId, RoleUserEntity.ScopeType scopeType, String scopeId);
    List<RoleUserEntity> findByScopeTypeAndScopeId(RoleUserEntity.ScopeType scopeType , String scopeId);

    boolean existsByRoleIdAndUserIdAndScopeTypeAndScopeId(
            Integer roleId, Long userId, RoleUserEntity.ScopeType scopeType , String scopeId
    );
}
