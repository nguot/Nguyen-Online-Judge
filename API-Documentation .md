# Online Judge — Tài liệu tra cứu API 
> 0) **Tất cả Data trả về** mặc định được hiểu là bọc trong **`CommonResponse`**
> 1) **Tất cả list/search endpoints** dùng **`POST .../search`** với body `PageRequestDto<FilterDto>`.  
> 2) **GET** chỉ dùng cho **lấy chi tiết theo ID**.  
> 3) **Dùng Redis ZSET cho Dashboard realtime** (tạm thời chưa dùng SSE/WebSocket vì khó config)  
---

## (*) Use Case 

### A. Auth  
1. **Đăng ký (Register)**  
2. **Đăng nhập (Login)** — cấp access_token & refresh_token  

### B. Contest Management  
3. **CRUD Draft Contest**  
4. **Submit Draft Contest vào Proposal Queue**  
5. **Add Draft Contest vào Gym**    
6. **Bot duyệt Draft Contest thành Official Contest**  
7. **Author mời Tester vào Draft Contest của mình**  
8. **User đăng ký tham gia Contest (Official/Gym)**  
9. **Vào Contest (Contest đang chạy)**  
10. **Tính Rating sau khi kết thúc Contest**  
11. **Mở lời giải cho Problem sau Contest**

### C. Problem Management  
13. **CRUD Problem**

### D. Submission  
14. **Submit trong Contest**  
15. **Submit ngoài Contest**  
16. **Xem Submission trong Contest**  
17. **Xem Submission ngoài Contest**

### E. Dashboard  
18. **Xem Dashboard Contest theo trang**  
19. **Xem Dashboard Contest của bạn bè**  
20. **Xem Dashboard Contest của user cùng Group**

### F. Group  
21. **User mời người khác vào Group của mình**
22. **Add Draft Contest vào Group**

### G. Admin  
23. **Quản lý User (Admin)** — quản lý role, quản lý rating user  
24. **Quản lý Contest (Admin)** — đặt `unrated`

---

## (*) Enum & Database Mapping

### SQL
| Bảng | Trường | Giá trị hợp lệ |
|------|---------|----------------|
| `contest.contest_status` | Trạng thái contest | `"Upcoming"`, `"running"`, `"finished"` |
| `contest.contest_type` | Loại contest | `"Draft"`, `"Gym"`, `"Official"` |
| `contest.visibility` | Kiểu hiển thị | `"PRIVATE"`, `"PUBLIC"` |
| `submission_result.result` | Kết quả chấm | `"SKIPPED"`, `"PENDING"`, `"AC"`, `"WA"`, `"TLE"`, `"MLE"`, `"CE"` |
| `submission_result.status` | Trạng thái bài nộp | `"IN_CONTEST"`, `"PRACTICE"` |
| `group_invitation.status` | Trạng thái lời mời nhóm | `"PENDING"`, `"ACCEPTED"`, `"DECLINED"`, `"EXPIRED"` |
| `contest_invitation.status` | Trạng thái lời mời tester | `"PENDING"`, `"ACCEPTED"`, `"DECLINED"`, `"EXPIRED"` |
| `comment.type` | Loại bình luận | `"tester_comment"`, `"official_comment"` |
| `user_friendship.status` | Quan hệ bạn bè | `"ACCEPTED"`, `"BLOCKED"` |

---

### Role & Permission
| Enum | Giá trị |
|------|---------|
| **Role** | `"Admin"`, `"Normal_User"`, `"Pro_User"`, `"Author"`, `"Tester"`, `"Participants"`, `"Group_Admin"`, `"Group_Member"` |
| **ScopeType** | `"System"`, `"Contest"`, `"Problem"`, `"Group"` |
### Contest Permissions
- `contest:schedule`
- `contest:invite`
- `contest:submit_review`
- `contest:create`
- `contest:set_unrated`
- `contest:edit`
- `contest:participate`
- `contest:testing`
- `contest:rate`
- `contest:update_score`
- `contest:tester_comment`
- `contest:participants_comment`

### Problem Permissions
- `problem:view`
- `problem:edit`
- `problem:delete`
- `problem:create`

### Group Permissions
- `group:delete`
- `group:create_contest`
- `group:invite`
- `group:delete` <!-- duplicated? -->

### User Permissions
- `user:delete`
- `user:set_rating`
- `user:grant`
- `user:revoke`


---

## 0) Chuẩn chung

### 0.1 CommonResponse<T>
```json
{
  "isSuccessful": true,
  "data": "T",
  "code": "200",
  "message": "Successful"
}
```
- `code`: có thể trùng HTTP (200/400/401/403/404/409/422/500) hoặc app-code nội bộ.
- **Mọi API** trả về CommonResponse.

### 0.2 Phân trang + Filter (bắt buộc cho list/search)
- **PageRequestDto<FilterDto>**
```json
{
  "maxResultCount": 10,
  "skipCount": 0,
  "sorting": "created_at desc",
  "filter": { }
}
```
- **PageResult<T>**
```json
{
  "totalCount": 123,
  "data": [ ]
}
```

### 0.3 RBAC (permission)
- Request thường sẽ đi kèm `token`, có token sẽ có `user`, có user tra bảng `role` sẽ có `permission`.
- BE kiểm tra quyền qua `role_user(scope_type, scope_id)` khi cần.
- Quy ước role: `admin`, `pro_user`, `user`


---

## 1) Catalog: Entities (map 1-1 với DB)
### 1.1 SQL
- **user_details**: `{ user_id, user_name, email, password, info }`
- **auth_refresh_token**: `{ token_id, user_id, refresh_token, issued_at, expired_at, revoked, ip_addr }`
- **role**: `{ role_id, role_name }`
- **permission**: `{ permission_id, permission_name }`
- **role_permission**: `{ role_id, permission_id }`
- **role_user**: `{ role_id, user_id, scope_id, scope_type }`

- **contest**: `{ contest_id, title, description, start_time, duration, contest_status, contest_type, author_id, rated, visibility, group_id }`
- **contest_problem**: `{ contest_id, problem_id }` // `problem_id` là Mongo ID (string)
- **contest_registration**: `{ contest_id, user_id, registered_at }`
- **contest_participants**: `{ contest_id, user_id, penalty, total_score, rank }`
- **contest_testers**: `{ contest_id, user_id, total_score }`
- **contest_invitation**: `{ invite_id, contest_id, inviter_id, invitee_id, status, created_at, responded_at }`

- **tester_feedback**: `{ problem_id, contest_id, user_id, like, comment_id, created_at }`
- **comment**: `{ comment_id, user_id, contents, is_deleted, parent_id, source_id, type, created_at, updated_at }`

- **submission_result**: `{ submission_id, user_id, contest_id, result, status, created_at }`
- **user_rating_history**: `{ user_id, contest_id, rating, delta }`
- **user_friendship**: `{ user_id, friend_id, status, created_at }`

- **user_group**: `{ group_id, owner_id, group_name, group_image }`
- **group_member**: `{ group_id, user_id, invite_by_user_id, joined_at }`
- **group_invitation**: `{ invite_id, group_id, inviter_id, invitee_id, status, created_at, responded_at }`

### 1.2 Mongo
- **problem**: `{ problem_id, author_id, title, description, time_limit, memory_limit, tags, sample, system_test, score, solution, tutorial, rating }`
- **submission**: `{ submission_id, problem_id, source_code, lang, submit_time, result }`

---

## 2) Catalog: DTOs (request/response)

> **InputDto** = request body. **ResponseDto** = phần `data` trong CommonResponse.  
### 2.1 Auth
- **RegisterRequestDto**: `{ user_name, email, password }`
- **RegisterResponseDto**: `{ user_id, user_name, email }`
- **LoginRequestDto**: `{ user_name, password }`
- **LoginResponseDto**: `{ access_token, refresh_token, expires_in }`
- **RefreshRequestDto**: `{ refresh_token }`
- **RefreshResponseDto**: `{ access_token, expires_in }`

### 2.2 User
- **UserSummaryDto**: `{ user_id, user_name, email }`
- **UserDetailDto**: `{ user_id, user_name, email, info }`
- **UserFilterDto**: `{ user_id?, user_name? }`

### 2.3 Contest
- **ContestCreateRequestDto**: `{ title, description, start_time, duration, contest_type, visibility, group_id }`
- **ContestUpdateRequestDto**: `{ title?, description?, start_time?, duration?, rated?, visibility?, group_id? }`
- **ContestSummaryDto**: `{ contest_id, title, description, start_time, duration, contest_status, contest_type, author_id, rated, visibility, group_id }`
- **ContestDetailDto**: `ContestSummaryDto & { problems: [ { problem_id } ] }`
- **ContestFilterDto**: `{ rated?, contest_status?, contest_type?, visibility?, group_id?, author_id? }`
- **ContestRegistrationDto**: `{ contest_id, user_id, registered_at }`
- **ContestRegistrationFilterDto**: `{ user_id? }`
- **ContestParticipantDto**: `{ contest_id, user_id, penalty, total_score, rank }`
- **ContestParticipantFilterDto**: `{ user_id? }`
- **ContestInvitationDto**: `{ invite_id, contest_id, inviter_id, invitee_id, status, created_at, responded_at }`
- **ContestInvitationFilterDto**: `{ status?, invitee_id? }`
- **InviteTesterRequestDto**: `{ invitee_user_id }`
- **ContestMakeOfficialRequestDto**: `{ rated?, start_time? }`
- **ContestAttachProblemRequestDto**: `{ problem_id }`
- **ContestRatingCalcRequestDto**: `{ recalc_all?: boolean }` // mặc định `false`
- **OpenSolutionsRequestDto**: `{ problems?: string[], open?: boolean }` // nếu không truyền `problems` → mở tất cả
- **SubmitDraftToQueueRequestDto**: `{ reviewer_id? , reason? }`  
  _(Dùng khi user submit draft contest vào hàng chờ duyệt. Nếu `reviewer_id` không có, hệ thống tự chọn reviewer.)_
- **PromoteDraftToGymRequestDto**: `{ contest_id, make_public? }`  
  _(Chuyển contest draft sang dạng Gym — tự động set `contest_type = "Gym"` và `visibility = "PUBLIC"` nếu `make_public = true`.)_

### 2.4 Problem (Mongo)
- **ProblemCreateRequestDto**: `{ problem_id, author_id, title, description, time_limit, memory_limit, tags, sample, system_test, score, solution, tutorial, rating }`
- **ProblemUpdateRequestDto**: _partial_ của ProblemCreateRequestDto
- **ProblemSummaryDto**: `{ problem_id, author_id, title, score, rating, tags }`
- **ProblemDetailDto**: full `problem` document
- **ProblemFilterDto**: `{ author_id?, tags?[] }`
- **ProblemByContestFilterDto**: `{ contest_id }`
- **ProblemSearchFilter** (primitive): `"keyword"`

### 2.5 Submission (SQL + Mongo)
- **SubmissionCreateRequestDto**: `{ problem_id, contest_id?, lang, source_code }`
- **SubmissionSummaryDto**: `{ submission_id, user_id, contest_id, result, status, created_at }`
- **SubmissionDetailDto**: `SubmissionSummaryDto & { problem_id, lang, submit_time, source_code?, result_detail }`
- **SubmissionFilterDto**: `{ user_id?, contest_id?, status?, result?[] }`

### 2.6 Comment
- **CommentCreateRequestDto**: `{ source_id, type, contents, parent_id? }`
- **CommentDetailDto**: `{ comment_id, user_id, contents, is_deleted, parent_id, source_id, type, created_at, updated_at }`
- **CommentFilterDto**: `{ source_id, type?, user_id? }`

### 2.7 Group
- **GroupCreateRequestDto**: `{ group_name, group_image }`
- **GroupDetailDto**: `{ group_id, owner_id, group_name, group_image }`
- **GroupFilterDto**: `{ owner_id? }`
- **GroupMemberDto**: `{ group_id, user_id, invite_by_user_id, joined_at }`
- **GroupMemberFilterDto**: `{ user_id? }`
- **GroupInviteRequestDto**: `{ invitee_user_id }`
- **GroupInvitationDto**: `{ invite_id, group_id, inviter_id, invitee_id, status, created_at, responded_at }`
- **GroupInvitationFilterDto**: `{ status?, invitee_id? }`
- **CreateGroupContestRequestDto**: `{ group_id: number, title, description, start_time, duration, visibility?: "PRIVATE" | "PUBLIC" }`  
  _(Tạo contest trực tiếp trong group — quyền `group:contest:create` của owner hoặc moderator.)_


### 2.8 Rating
- **UserRatingHistoryDto**: `{ user_id, contest_id, rating, delta }`
- **UserRatingHistoryFilterDto**: `{ user_id? }`

### 2.9 RBAC (tham chiếu)
- **RoleDto**: `{ role_id, role_name }`
- **PermissionDto**: `{ permission_id, permission_name }`

### 2.10 Admin (User Ops)
- **AdjustUserRatingRequestDto**: `{ delta, reason }`  // delta ±
- **SetUserRatingRequestDto**: `{ rating, reason }`     // set tuyệt đối
- **GrantRoleRequestDto**: `{ role_name }`              // ví dụ: `pro_user`
- **RevokeRoleRequestDto**: `{ role_name }`

### 2.11 Dashboard  (per contest)
- **DashboardPageRequestDto**: `{ offset: number, limit: number }`
- **DashboardFriendsRequestDto**: `{ offset: number, limit: number }` // dùng danh sách bạn của caller
- **DashboardGroupRequestDto**: `{ offset: number, limit: number, group_id?: number }` // nếu không truyền, lấy group mặc định/của caller

---

## 3) Endpoints

### 3.1 Auth
- **POST** `/api/v1/auth/register` — Body: `RegisterRequestDto` → Data: `RegisterResponseDto`
- **POST** `/api/v1/auth/login` — Body: `LoginRequestDto` → Data: `LoginResponseDto`
- **POST** `/api/v1/auth/refresh` — Body: `RefreshRequestDto` → Data: `RefreshResponseDto`
- **POST** `/api/v1/auth/logout` — Data: `{}`

---

### 3.2 Users
- **POST** `/api/v1/users/search` — Body: `PageRequestDto<UserFilterDto>` → Data: `PageResult<UserSummaryDto>`
- **GET** `/api/v1/user/{user_name}` — Data: `UserDetailDto`

---

### 3.3 Contests
- **POST** `/api/v1/contests/search` — Body: `PageRequestDto<ContestFilterDto>` → Data: `PageResult<ContestSummaryDto>`
- **GET** `/api/v1/contest/{contest_id}` — Data: `ContestDetailDto`
- **POST** `/api/v1/contests` _(permission: `contest:create`)_ — Body: `ContestCreateRequestDto` → Data: `{ "contest_id": 201 }`
- **POST** `/api/v1/contest/{contest_id}/edit` _(permission: `contest:edit`)_ — Body: `ContestUpdateRequestDto` → Data: `{ "contest_id": 201 }`
- **POST** `/api/v1/contest/{contest_id}/problems` _(permission: `contest:edit`)_ — Body: `ContestAttachProblemRequestDto` → Data: `{ "contest_id": 201, "problem_id": "prob-xyz" }`
- **DELETE** `/api/v1/contest/{contest_id}/problem/{problem_id}` _(permission: `contest:edit`)_ — Data: `{}`
- **POST** `/api/v1/contest/{contest_id}/submit-draft` — Data: `{ "contest_id": 201, "submitted": true }`
- **POST** `/api/v1/contest/{contest_id}/make-official` _(bot/admin)_ — Body: `ContestMakeOfficialRequestDto` → Data: `{ "contest_id": 201, "contest_type": "Official", "rated": true }`
- **POST** `/api/v1/contest/{contest_id}/register` — Data: `ContestRegistrationDto`
- **POST** `/api/v1/contest/{contest_id}/registrations/search` — Body: `PageRequestDto<ContestRegistrationFilterDto>` → Data: `PageResult<ContestRegistrationDto>`
- **POST** `/api/v1/contest/{contest_id}/participants/search` — Body: `PageRequestDto<ContestParticipantFilterDto>` → Data: `PageResult<ContestParticipantDto>`
- **POST** `/api/v1/contest/{contest_id}/invite-tester` _(permission: `contest:invite`)_ — Body: `InviteTesterRequestDto` → Data: `ContestInvitationDto`
- **POST** `/api/v1/contest/{contest_id}/invitations/search` — Body: `PageRequestDto<ContestInvitationFilterDto>` → Data: `PageResult<ContestInvitationDto>`
- **POST** `/api/v1/contest/{contest_id}/feedback` _(permission: `contest:tester_comment`)_ — Body: `{ "problem_id": "...", "like": true, "comment": "..." }` → Data: `{ "contest_id": 201, "problem_id": "prob-xyz", "user_id": 124, "like": true, "comment_id": 7001 }`
- **POST** `/api/v1/contest/{contest_id}/rankings/search` — Body: `PageRequestDto<ContestParticipantFilterDto>` → Data: `PageResult<ContestParticipantDto>`
- **POST** `/api/v1/contest/{contest_id}/calculate-rating` _(permission: `contest:rate`)_ — Body: `ContestRatingCalcRequestDto` → Data: `{ "contest_id": 201, "updated": true, "affected_users": 320 }`
- **POST** `/api/v1/contest/{contest_id}/open-solutions` _(permission: `contest:edit`)_ — Body: `OpenSolutionsRequestDto` → Data: `{ "contest_id": 201, "solutions_opened": true, "problems": ["p1","p2","..."] }`
- **POST** `/api/v1/contest/{contest_id}/submit-draft` — Data: `{ "contest_id": 201, "submitted": true }`
- **POST** `/api/v1/contest/{contest_id}/submit-draft/queue` _(permission: `contest:submit_review`)_ — Body: `SubmitDraftToQueueRequestDto`  
  → Data: `{ "contest_id": 201, "queued": true, "approved": false, "message": "Waiting for review" }`
- **POST** `/api/v1/group/{group_id}/contest/create` _(permission: `group:contest_create`)_  
  — Body: `CreateGroupContestRequestDto`  
  → Data: `{ "contest_id": 350, "group_id": 42, "status": "Created" }`

- **POST** `/api/v1/contest/{contest_id}/promote-to-gym`   
  — Body: `PromoteDraftToGymRequestDto`  
  → Data: `{ "contest_id": 201, "new_type": "Gym", "visibility": "PUBLIC", "approved": true, "message": "Contest is now public in Gym" }`

---

### 3.4 Problems (Mongo)
- **POST** `/api/v1/problems` _(permission: `problem:create`)_ — Body: `ProblemCreateRequestDto` → Data: `{ "problem_id": "prob-xyz" }`
- **POST** `/api/v1/problem/{problem_id}/edit` _(permission: `problem:edit`)_ — Body: `ProblemUpdateRequestDto` → Data: `{ "problem_id": "prob-xyz" }`
- **DELETE** `/api/v1/problem/{problem_id}` _(permission: `problem:delete`)_ — Data: `{}`
- **POST** `/api/v1/problems/search` — Body: `PageRequestDto<ProblemFilterDto>` → Data: `PageResult<ProblemSummaryDto>`
- **GET** `/api/v1/problem/{problem_id}` — Data: `ProblemDetailDto`
- **POST** `/api/v1/problems/search-text` — Body: `PageRequestDto<string>` (`filter` = keyword) → Data: `PageResult<ProblemSummaryDto>`
- **POST** `/api/v1/problems/by-contest` — Body: `PageRequestDto<ProblemByContestFilterDto>` → Data: `PageResult<ProblemSummaryDto>`

---

### 3.5 Submissions (SQL + Mongo)
- **POST** `/api/v1/submissions` — Body: `SubmissionCreateRequestDto` → Data: `{ "submission_id": "sub-1001" }`
- **POST** `/api/v1/submissions/search` — Body: `PageRequestDto<SubmissionFilterDto>` → Data: `PageResult<SubmissionSummaryDto>`
- **GET** `/api/v1/submission/{submission_id}` — Data: `SubmissionDetailDto`  _(trả `source_code` theo quyền)_
- **DELETE** `/api/v1/submission/{submission_id}` _(admin)_ — Data: `{}`
- **DELETE** `/api/v1/submission/by-problem/{problem_id}` _(admin)_ — Data: `{ "deleted": 15 }`
- **DELETE** `/api/v1/submission/by-user/{user_id}` _(admin)_ — Data: `{ "deleted": 42 }`

---

### 3.6 Comments
- **POST** `/api/v1/comments/search` — Body: `PageRequestDto<CommentFilterDto>` → Data: `PageResult<CommentDetailDto>`
- **POST** `/api/v1/comments` — Body: `CommentCreateRequestDto` → Data: `{ "comment_id": 7001 }`
- **DELETE** `/api/v1/comment/{comment_id}` _(moderator/admin)_ — Data: `{}`

---

### 3.7 Groups
- **POST** `/api/v1/groups` _(permission: `group:create`)_ — Body: `GroupCreateRequestDto` → Data: `{ "group_id": 600 }`
- **POST** `/api/v1/groups/search` — Body: `PageRequestDto<GroupFilterDto>` → Data: `PageResult<GroupDetailDto>`
- **GET** `/api/v1/group/{group_id}` — Data: `GroupDetailDto`
- **POST** `/api/v1/group/{group_id}/members/search` — Body: `PageRequestDto<GroupMemberFilterDto>` → Data: `PageResult<GroupMemberDto>`
- **POST** `/api/v1/group/{group_id}/invite` _(permission: `group:invite`)_ — Body: `GroupInviteRequestDto` → Data: `GroupInvitationDto`
- **POST** `/api/v1/group/{group_id}/invitations/search` — Body: `PageRequestDto<GroupInvitationFilterDto>` → Data: `PageResult<GroupInvitationDto>`

---

### 3.8 Ratings
- **POST** `/api/v1/contest/{contest_id}/ratings/search` — Body: `PageRequestDto<UserRatingHistoryFilterDto>` → Data: `PageResult<UserRatingHistoryDto>`

---

### 3.10 Dashboard realtime (per contest, REST-only)

**Redis ZSET :**
```
leaderboard:{contest_id}  // ZSET: member = user_id, score = score * 1e6 - penalty
```
- Xếp hạng theo `ZREVRANK` (điểm cao hơn đứng trước; cùng điểm thì penalty nhỏ hơn vì bị trừ).
- Đọc top/window bằng `ZREVRANGE` theo `offset(limit)`.

**API (permission: `contest:view` cho read; `contest:update_core` cho write)**

_Read:_
- **POST** `/api/v1/contest/{contest_id}/dashboard/page`  
  **Body**: `DashboardPageRequestDto` → Data: `{ "total": number, "items": [ { "user_id", "user_name", "score", "penalty", "rank" } ] }`

- **POST** `/api/v1/contest/{contest_id}/dashboard/friends`  
  **Body**: `DashboardFriendsRequestDto` → Data: như trên nhưng **chỉ lọc theo danh sách bạn** của caller.

- **POST** `/api/v1/contest/{contest_id}/dashboard/group`  
  **Body**: `DashboardGroupRequestDto` → Data: như trên nhưng **chỉ lọc theo group** (nếu không truyền `group_id` sẽ lấy group mặc định/của caller).

_Write:_
- **POST** `/api/v1/contest/{contest_id}/leaderboard/update-score`   
  **Body** `{ "user_id": number, "score": number, "penalty": number }` → Data: `{ "updated": true }`

- **POST** `/api/v1/contest/{contest_id}/leaderboard/batch-update` 
  **Body** `{ "items": [ { "user_id": number, "score": number, "penalty": number }, ... ] }` → Data: `{ "updated": 42 }`

> ***Ghi chú***: FE **polling** định kỳ endpoint `/dashboard/page` với `offset(limit)` để cập nhật UI; 
---

## 4) Admin API

**User Management**
- **POST** `/api/v1/admin/users/{user_id}/delete` — Data: `{ "deleted": true }`
- **POST** `/api/v1/admin/users/{user_id}/adjust-rating` — Body: `AdjustUserRatingRequestDto` → Data: `{ "user_id": 1, "delta": -75, "new_rating": 1525 }`
- **POST** `/api/v1/admin/users/{user_id}/set-rating` — Body: `SetUserRatingRequestDto` → Data: `{ "user_id": 1, "new_rating": 1800 }`
- **POST** `/api/v1/admin/users/{user_id}/grant-role` — Body: `GrantRoleRequestDto` → Data: `{ "user_id": 1, "role": "pro_user" }`
- **POST** `/api/v1/admin/users/{user_id}/revoke-role` — Body: `RevokeRoleRequestDto` → Data: `{ "user_id": 1, "role": "pro_user" }`

**Contest Management**
- **POST** `/api/v1/admin/contests/{contest_id}/set-unrated` — Data: `{ "contest_id": 201, "rated": false }`

**RBAC Directory**
- **POST** `/api/v1/admin/roles/search` — Body: `PageRequestDto<object>` → Data: `PageResult<RoleDto>`
- **POST** `/api/v1/admin/permissions/search` — Body: `PageRequestDto<object>` → Data: `PageResult<PermissionDto>`

---

## 5) Ví dụ

### 5.1 Search Problems (filter theo author + tags, phân trang)
**POST** `/api/v1/problems/search`  
**Body**
```json
{
  "maxResultCount": 10,
  "skipCount": 0,
  "sorting": "title asc",
  "filter": { "author_id": 123, "tags": ["Implementation"] }
}
```
**Response**
```json
{
  "isSuccessful": true,
  "data": {
    "totalCount": 2,
    "data": [
      { "problem_id": "prob-xyz", "author_id": 123, "title": "Two Sum", "score": 100, "rating": 1500, "tags": ["Implementation"] },
      { "problem_id": "prob-abc", "author_id": 123, "title": "Three Sum", "score": 100, "rating": 1600, "tags": ["Implementation"] }
    ]
  },
  "code": "200",
  "message": "Successful"
}
```

### 5.2 Search Submissions (filter result=AC, user_id=123)
**POST** `/api/v1/submissions/search`  
**Body**
```json
{
  "maxResultCount": 20,
  "skipCount": 0,
  "sorting": "created_at desc",
  "filter": { "user_id": 123, "result": ["AC"] }
}
```
**Response**
```json
{
  "isSuccessful": true,
  "data": {
    "totalCount": 37,
    "data": [
      { "submission_id": "sub-1001", "user_id": 123, "contest_id": 201, "result": "AC", "status": "IN_CONTEST", "created_at": "2025-11-10T12:30:00Z" }
    ]
  },
  "code": "200",
  "message": "Successful"
}
```

### 5.3 Get Problem Detail
**GET** `/api/v1/problem/prob-xyz`  
**Response**
```json
{
  "isSuccessful": true,
  "data": {
    "problem_id": "prob-xyz",
    "author_id": 123,
    "title": "Two Sum",
    "description": "...",
    "time_limit": 1000,
    "memory_limit": 256,
    "tags": ["Implementation"],
    "sample": [ { "sample_inp1": "1 2", "sample_out1": "3" } ],
    "system_test": [ { "test_id": "t1", "system_inp": "...", "system_out": "..." } ],
    "score": 100,
    "solution": "<path-or-blob>",
    "tutorial": "write-up text",
    "rating": 1500
  },
  "code": "200",
  "message": "Successful"
}
```
