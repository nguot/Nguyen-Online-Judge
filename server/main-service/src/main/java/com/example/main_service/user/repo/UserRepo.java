package com.example.main_service.user.repo;

import com.example.main_service.user.model.UserEntity;
import org.slf4j.Logger;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepo extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByUserName(String userName);

    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findByUserId(Long userId);

    @Query("SELECT u.userId, u.userName FROM UserEntity u WHERE u.userId IN :userIds")
    List<Object[]> findUserIdAndUserNameByUserIdIn(@Param("userIds") List<Long> userIds);

    @Query("""
        SELECT u
        FROM UserEntity u
        WHERE (:username IS NULL OR LOWER(u.userName) LIKE LOWER(CONCAT('%', :username, '%')))
    """)
    Page<UserEntity> searchUsers(
            @Param("username") String username,
            Pageable pageable
    );
    @Query("""
    select u from UserEntity u
    where lower(u.userName) like concat(:prefix, '%')
""")
    Page<UserEntity> searchByUsernamePrefix(@Param("prefix") String prefix, Pageable pageable);

    List<UserEntity> findByUserIdIn(List<Long> userIds);
}
