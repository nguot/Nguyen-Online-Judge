package com.example.main_service.friend.repo;

import com.example.main_service.friend.model.UserFriendship;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserFriendshipRepo extends JpaRepository<UserFriendship, Long> {

    // Find friendship between two users (bidirectional)
    @Query("SELECT uf FROM UserFriendship uf WHERE " +
            "(uf.userId = :userId AND uf.friendId = :friendId) OR " +
            "(uf.userId = :friendId AND uf.friendId = :userId)")
    Optional<UserFriendship> findFriendship(@Param("userId") Long userId,
                                            @Param("friendId") Long friendId);

    // Find all pending invitations for a user (where user is the friend_id)
    @Query("SELECT uf FROM UserFriendship uf WHERE uf.friendId = :userId AND uf.status = 'PENDING'")
    List<UserFriendship> findPendingInvitations(@Param("userId") Long userId);

    // Find all accepted friends with pagination
    @Query("SELECT uf FROM UserFriendship uf " +
            "WHERE ((uf.userId = :userId OR uf.friendId = :userId) AND uf.status = 'ACCEPTED')")
    Page<UserFriendship> findAcceptedFriends(@Param("userId") Long userId, Pageable pageable);

    // Find accepted friends with name filter
    @Query("""
        SELECT uf FROM UserFriendship uf 
        JOIN UserEntity u ON (CASE WHEN uf.userId = :userId THEN uf.friendId ELSE uf.userId END) = u.userId 
        WHERE ((uf.userId = :userId OR uf.friendId = :userId) AND uf.status = 'ACCEPTED' 
        AND (:friendName IS NULL OR LOWER(u.userName) LIKE LOWER(CONCAT('%', :friendName, '%'))))
        """)
    Page<UserFriendship> findAcceptedFriendsWithFilter(@Param("userId") Long userId,
                                                       @Param("friendName") String friendName,
                                                       Pageable pageable);

    // Delete friendship
    @Modifying
    @Query("DELETE FROM UserFriendship uf WHERE " +
            "((uf.userId = :userId AND uf.friendId = :friendId) OR " +
            "(uf.userId = :friendId AND uf.friendId = :userId)) AND uf.status = 'ACCEPTED'")
    void deleteFriendship(@Param("userId") Long userId, @Param("friendId") Long friendId);

    @Query("""
    SELECT uf FROM UserFriendship uf
    WHERE (uf.userId = :userId OR uf.friendId = :userId)
      AND uf.status = 'ACCEPTED'
""")
    List<UserFriendship> findAllAcceptedFriends(@Param("userId") Long userId);
}