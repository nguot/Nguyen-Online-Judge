\# \*\*Database Schema – SQL + MongoDB – Nguyên Online Judge\*\*



\## Kafka Topic

\- \*\*contest.draft.proposal\*\* – topic dùng để đẩy proposal contest dạng Draft vào queue xử lý.

---



\## \*\*role\*\*

| Trường    | Kiểu      | Mô tả |

|-----------|-----------|-------|

| role\_id   | BIGINT PK | ID role |

| role\_name | ENUM | {Admin, Normal\_User, Pro\_User, Author, Tester, Participants, Group\_Admin, Group\_Member} |



---



\## \*\*role\_user\*\*

| Trường    | Kiểu | Mô tả |

|-----------|------|-------|

| role\_id   | BIGINT FK | Role |

| user\_id   | BIGINT FK | User |

| scope\_id  | BIGINT/NULL | null hoặc contest\_id/problem\_id/group\_id |

| scope\_type | ENUM("System","Contest","Problem","Group") | Phạm vi role |



---



\## \*\*role\_permission\*\*

| Trường        | Kiểu      | Mô tả |

|----------------|-----------|-------|

| role\_id       | BIGINT FK | Role |

| permission\_id | BIGINT FK | Quyền |



---



\## \*\*permission\*\*

| Trường          | Kiểu      | Mô tả |

|------------------|-----------|-------|

| permission\_id    | BIGINT PK | ID permission |

| permission\_name  | VARCHAR   | Tên quyền |



\### \*\*Danh sách permission\*\*

\* contest:schedule

\* contest:invite

\* contest:submit\_review

\* contest:create

\* contest:set\_unrated

\* contest:edit

\* contest:participate

\* contest:testing

\* contest:rate

\* contest:update\_score

\* problem:view

\* problem:edit

\* problem:delete

\* problem:create

\* group:delete

\* group:create\_contest

\* group:invite

\* contest:tester\_comment

\* contest:participants\_comment

\* user:delete

\* user:set\_rating

\* user:grant

\* user:revoke





---



\## \*\*user\_details\*\*

| Trường   | Kiểu      | Mô tả |

|----------|-----------|-------|

| user\_id  | BIGINT PK | ID user |

| user\_name | VARCHAR  | Tài khoản |

| email    | VARCHAR   | Email |

| password | VARCHAR   | Hash mật khẩu |

| info     | JSON/TEXT | Thông tin bổ sung |



---



\## \*\*auth\_refresh\_token\*\*

| Trường        | Kiểu      | Mô tả |

|---------------|-----------|-------|

| token\_id      | BIGINT PK | ID token |

| user\_id       | BIGINT FK | User |

| refresh\_token | VARCHAR   | Refresh token |

| issued\_at     | DATETIME  | Thời điểm tạo |

| expired\_at    | DATETIME  | Hết hạn |

| revoked       | BOOLEAN   | Thu hồi? |

| ip\_addr       | VARCHAR   | IP phát hành |



---



\## \*\*contest\*\*

| Trường        | Kiểu      | Mô tả |

|---------------|-----------|-------|

| contest\_id    | BIGINT PK | ID contest |

| title         | VARCHAR   | Tên contest |

| description   | TEXT      | Mô tả |

| start\_time    | DATETIME  | Bắt đầu |

| duration      | INT       | Phút |

| contest\_status | ENUM("Upcoming","Running","Finished") | Trạng thái |

| contest\_type  | ENUM("Draft","Gym","Official") | Loại |

| author        | BIGINT FK | Người tạo |

| rated         | BOOLEAN DEFAULT FALSE | Tính rating |

| visibility    | ENUM("public","private") DEFAULT "private" | Hiển thị |

| group\_id      | BIGINT FK | Group |



---



\## \*\*submission\_result\*\*

| Trường       | Kiểu |

|--------------|------|

| user\_id      | BIGINT |

| contest\_id   | BIGINT |

| result       | ENUM("SKIPPED","PENDING","AC","WA","TLE","MLE","CE") |

| submission\_id | STRING (Mongo) |

| status       | ENUM("IN\_CONTEST","PRACTICE") |

| created\_at   | DATETIME |



---



\## \*\*contest\_problem\*\*

| Trường      | Kiểu |

|-------------|------|

| contest\_id  | BIGINT |

| problem\_id  | STRING (Mongo) |



---



\## \*\*contest\_registration\*\*

| Trường      | Kiểu |

|-------------|------|

| contest\_id  | BIGINT |

| user\_id     | BIGINT |

| registered\_at | DATETIME |



---



\## \*\*contest\_participants\*\*

| Trường      | Kiểu |

|-------------|------|

| contest\_id  | BIGINT |

| user\_id     | BIGINT |

| penalty     | INT |

| total\_score | INT |

| rank        | INT |



---



\## \*\*contest\_testers\*\*

| Trường      | Kiểu |

|-------------|------|

| contest\_id  | BIGINT |

| user\_id     | BIGINT |

| total\_score | INT |



---



\## \*\*tester\_feedback\*\*

| Trường     | Kiểu |

|------------|-------|

| problem\_id | STRING |

| contest\_id | BIGINT |

| user\_id    | BIGINT |

| like       | BOOLEAN |

| comment\_id | BIGINT |



---



\## \*\*contest\_invitation\*\*

| Trường     | Kiểu |

|------------|-------|

| invite\_id  | BIGINT PK |

| contest\_id | BIGINT |

| inviter\_id | BIGINT |

| invitee\_id | BIGINT |

| status     | ENUM("ACCEPTED","DECLINED","PENDING","EXPIRED") |



---



\## \*\*comment\*\*

| Trường     | Kiểu |

|------------|-------|

| comment\_id | BIGINT PK |

| user\_id    | BIGINT |

| contents   | TEXT |

| is\_deleted | BOOLEAN |

| parent\_id  | BIGINT |

| source\_id  | BIGINT/STRING |

| type       | ENUM("tester\_comment","official\_comment") |



---



\## \*\*user\_rating\_history\*\*

| Trường     | Kiểu |

|------------|-------|

| user\_id    | BIGINT |

| contest\_id | BIGINT |

| rating     | INT |

| delta      | INT |



---



\## \*\*user\_friendship\*\*

| Trường     | Kiểu |

|------------|-------|

| user\_id    | BIGINT |

| friend\_id  | BIGINT |

| status     | ENUM("ACCEPTED","BLOCKED") |



---



\## \*\*group\*\*

| Trường      | Kiểu      | Mô tả |

|-------------|-----------|-------|

| group\_id    | BIGINT PK | ID Group |

| group\_name  | VARCHAR   | Tên group |

| description | TEXT      | Mô tả |

| avatar      | VARCHAR   | Ảnh đại diện |

| created\_by  | BIGINT FK | Người tạo |

| created\_at  | DATETIME  | Thời điểm tạo |



---



\## \*\*group\_member\*\*

| Trường            | Kiểu      | Mô tả |

|-------------------|-----------|-------|

| group\_id          | BIGINT FK | Group |

| user\_id           | BIGINT FK | Thành viên |

| invite\_by\_user\_id | BIGINT    | Người mời |

| joined\_at         | DATETIME  | Thời gian tham gia |



---



\## \*\*group\_invitation\*\*

| Trường     | Kiểu      | Mô tả |

|------------|-----------|-------|

| invite\_id  | BIGINT PK | ID lời mời |

| group\_id   | BIGINT FK | Group |

| inviter\_id | BIGINT    | Người mời |

| invitee\_id | BIGINT    | Người nhận |

| status     | ENUM("PENDING","ACCEPTED","DECLINED","EXPIRED") | Trạng thái |



\## \*\*problem\*\*



```json

{

&nbsp; "problem\_id": "ObjectId",              

&nbsp; "author\_id": "Long",                   

&nbsp; "title": "String",                     

&nbsp; "description": "String",               

&nbsp; "time\_limit": "Int32",                 

&nbsp; "memory\_limit": "Int32",               



&nbsp; "tags": \["String"],                    



&nbsp; "sample": \[                            

&nbsp;   {

&nbsp;     "sample\_inp": "String",

&nbsp;     "sample\_out": "String"

&nbsp;   },...

&nbsp; ],



&nbsp; "system\_test": \[                       

&nbsp;   {

&nbsp;     "test\_id": "String",               

&nbsp;     "system\_inp": "String",            

&nbsp;     "system\_out": "String"             

&nbsp;   },...

&nbsp; ],



&nbsp; "score": "Int32",                      

&nbsp; "solution": "Binary",                  

&nbsp; "tutorial": "String",                  

&nbsp; "rating": "Int32"                      

}

```



\## \*\*submission\*\*

```json



{

&nbsp; "submission\_id": "ObjectId",          

&nbsp; "problem\_id": "ObjectId",             

&nbsp; "user\_id": "Long",                   

&nbsp; "source\_code": "String",             

&nbsp; "lang": "String",                    

&nbsp; "submit\_time": "Date",               



&nbsp; "result": \[

&nbsp;   {

&nbsp;     "test\_id": "String",             

&nbsp;     "inp": "String",                 

&nbsp;     "out": "String",                 

&nbsp;     "verdict": "String",             

&nbsp;     "time": "Int32",                 

&nbsp;     "memory": "Int32"         

&nbsp;   },...

&nbsp; ]

}

```



