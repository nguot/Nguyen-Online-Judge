## Kafka Topic
- **contest.draft.proposal** – topic dùng để đẩy proposal contest dạng Draft vào queue xử lý.
---

## **role**
| Trường    | Kiểu      | Mô tả |
|-----------|-----------|-------|
| role_id   | BIGINT PK | ID role |
| role_name | ENUM | {Admin, Normal_User, Pro_User, Author, Tester, Participants, Group_Admin, Group_Member} |

---

## **role_user**
| Trường    | Kiểu | Mô tả |
|-----------|------|-------|
| role_id   | BIGINT FK | Role |
| user_id   | BIGINT FK | User |
| scope_id  | BIGINT/NULL | null hoặc contest_id/problem_id/group_id |
| scope_type | ENUM("System","Contest","Problem","Group") | Phạm vi role |

---

## **role_permission**
| Trường        | Kiểu      | Mô tả |
|----------------|-----------|-------|
| role_id       | BIGINT FK | Role |
| permission_id | BIGINT FK | Quyền |

---

## **permission**
| Trường          | Kiểu      | Mô tả |
|------------------|-----------|-------|
| permission_id    | BIGINT PK | ID permission |
| permission_name  | VARCHAR   | Tên quyền |

### **Danh sách permission**
* contest:schedule
* contest:invite
* contest:submit_review
* contest:create
* contest:set_unrated
* contest:edit
* contest:participate
* contest:testing
* contest:rate
* contest:update_score
* problem:view
* problem:edit
* problem:delete
* problem:create
* group:delete
* group:create_contest
* group:invite
* contest:tester_comment
* contest:participants_comment
* user:delete
* user:set_rating
* user:grant
* user:revoke


---

## **user_details**
| Trường   | Kiểu      | Mô tả |
|----------|-----------|-------|
| user_id  | BIGINT PK | ID user |
| user_name | VARCHAR  | Tài khoản |
| email    | VARCHAR   | Email |
| password | VARCHAR   | Hash mật khẩu |
| info     | JSON/TEXT | Thông tin bổ sung |

---

## **auth_refresh_token**
| Trường        | Kiểu      | Mô tả |
|---------------|-----------|-------|
| token_id      | BIGINT PK | ID token |
| user_id       | BIGINT FK | User |
| refresh_token | VARCHAR   | Refresh token |
| issued_at     | DATETIME  | Thời điểm tạo |
| expired_at    | DATETIME  | Hết hạn |
| revoked       | BOOLEAN   | Thu hồi? |
| ip_addr       | VARCHAR   | IP phát hành |

---

## **contest**
| Trường        | Kiểu      | Mô tả |
|---------------|-----------|-------|
| contest_id    | BIGINT PK | ID contest |
| title         | VARCHAR   | Tên contest |
| description   | TEXT      | Mô tả |
| start_time    | DATETIME  | Bắt đầu |
| duration      | INT       | Phút |
| contest_status | ENUM("Upcoming","Running","Finished") | Trạng thái |
| contest_type  | ENUM("Draft","Gym","Official") | Loại |
| author        | BIGINT FK | Người tạo |
| rated         | BOOLEAN DEFAULT FALSE | Tính rating |
| visibility    | ENUM("public","private") DEFAULT "private" | Hiển thị |
| group_id      | BIGINT FK | Group |

---

## **submission_result**
| Trường       | Kiểu |
|--------------|------|
| user_id      | BIGINT |
| contest_id   | BIGINT |
| result       | ENUM("SKIPPED","PENDING","AC","WA","TLE","MLE","CE") |
| submission_id | STRING (Mongo) |
| status       | ENUM("IN_CONTEST","PRACTICE") |
| created_at   | DATETIME |

---

## **contest_problem**
| Trường      | Kiểu |
|-------------|------|
| contest_id  | BIGINT |
| problem_id  | STRING (Mongo) |

---

## **contest_registration**
| Trường      | Kiểu |
|-------------|------|
| contest_id  | BIGINT |
| user_id     | BIGINT |
| registered_at | DATETIME |

---

## **contest_participants**
| Trường      | Kiểu |
|-------------|------|
| contest_id  | BIGINT |
| user_id     | BIGINT |
| penalty     | INT |
| total_score | INT |
| rank        | INT |

---

## **contest_testers**
| Trường      | Kiểu |
|-------------|------|
| contest_id  | BIGINT |
| user_id     | BIGINT |
| total_score | INT |

---

## **tester_feedback**
| Trường     | Kiểu |
|------------|-------|
| problem_id | STRING |
| contest_id | BIGINT |
| user_id    | BIGINT |
| like       | BOOLEAN |
| comment_id | BIGINT |

---

## **contest_invitation**
| Trường     | Kiểu |
|------------|-------|
| invite_id  | BIGINT PK |
| contest_id | BIGINT |
| inviter_id | BIGINT |
| invitee_id | BIGINT |
| status     | ENUM("ACCEPTED","DECLINED","PENDING","EXPIRED") |

---

## **comment**
| Trường     | Kiểu |
|------------|-------|
| comment_id | BIGINT PK |
| user_id    | BIGINT |
| contents   | TEXT |
| is_deleted | BOOLEAN |
| parent_id  | BIGINT |
| source_id  | BIGINT/STRING |
| type       | ENUM("tester_comment","official_comment") |

---

## **user_rating_history**
| Trường     | Kiểu |
|------------|-------|
| user_id    | BIGINT |
| contest_id | BIGINT |
| rating     | INT |
| delta      | INT |

---

## **user_friendship**
| Trường     | Kiểu |
|------------|-------|
| user_id    | BIGINT |
| friend_id  | BIGINT |
| status     | ENUM("ACCEPTED","BLOCKED") |

---

## **group**
| Trường      | Kiểu      | Mô tả |
|-------------|-----------|-------|
| group_id    | BIGINT PK | ID Group |
| group_name  | VARCHAR   | Tên group |
| description | TEXT      | Mô tả |
| avatar      | VARCHAR   | Ảnh đại diện |
| created_by  | BIGINT FK | Người tạo |
| created_at  | DATETIME  | Thời điểm tạo |

---

## **group_member**
| Trường            | Kiểu      | Mô tả |
|-------------------|-----------|-------|
| group_id          | BIGINT FK | Group |
| user_id           | BIGINT FK | Thành viên |
| invite_by_user_id | BIGINT    | Người mời |
| joined_at         | DATETIME  | Thời gian tham gia |

---

## **group_invitation**
| Trường     | Kiểu      | Mô tả |
|------------|-----------|-------|
| invite_id  | BIGINT PK | ID lời mời |
| group_id   | BIGINT FK | Group |
| inviter_id | BIGINT    | Người mời |
| invitee_id | BIGINT    | Người nhận |
| status     | ENUM("PENDING","ACCEPTED","DECLINED","EXPIRED") | Trạng thái |

## **problem**

```json
{
  "problem_id": "ObjectId",              
  "author_id": "Long",                   
  "title": "String",                     
  "description": "String",               
  "time_limit": "Int32",                 
  "memory_limit": "Int32",               

  "tags": ["String"],                    

  "sample": [                            
    {
      "sample_inp": "String",
      "sample_out": "String"
    },...
  ],

  "system_test": [                       
    {
      "test_id": "String",               
      "system_inp": "String",            
      "system_out": "String"             
    },...
  ],

  "score": "Int32",                      
  "solution": "Binary",                  
  "tutorial": "String",                  
  "rating": "Int32"                      
}
```

## **submission**
```json

{
  "submission_id": "ObjectId",          
  "problem_id": "ObjectId",             
  "user_id": "Long",                   
  "source_code": "String",             
  "lang": "String",                    
  "submit_time": "Date",               

  "result": [
    {
      "test_id": "String",             
      "inp": "String",                 
      "out": "String",                 
      "verdict": "String",             
      "time": "Int32",                 
      "memory": "Int32"         
    },...
  ]
}
```
