# 🔐 API Security Testing Guide

## Tổng quan

Hướng dẫn test 4 lớp bảo mật API:
1. **Input Validation** - Xác thực dữ liệu đầu vào
2. **Rate Limiting** - Giới hạn tần suất truy cập
3. **Authentication** - Xác thực người dùng
4. **Authorization** - Phân quyền theo role

---

## 🚀 Setup

### 1. Run Database Migration

```bash
# Option 1: Using psql command
psql -U postgres -d LTDD_nangcao_doan -f migration.sql

# Option 2: Trong psql shell
\i migration.sql

# Option 3: Với Docker
docker exec -it ltdd_postgres psql -U postgres -d LTDD_nangcao_doan -f /docker-entrypoint-initdb.d/migration.sql
```

### 2. Verify Migration

```sql
-- Check role column exists
\d users

-- Verify admin user
SELECT phone, name, role FROM users WHERE role = 'admin';
```

### 3. Import Postman Collection

1. Mở Postman
2. **Import** → **Choose Files**
3. Select `API_Security_Tests.postman_collection.json`
4. Collection sẽ xuất hiện trong sidebar

### 4. Configure Base URL

Trong Postman, update biến `base_url`:
- **Local**: `http://localhost:3000/api`
- **Network**: `http://172.16.30.39:3000/api` (thay bằng IP của bạn)

---

## 🧪 Test Cases

### Layer 1: Input Validation

#### Test 1.1: Register without phone
```
POST /api/auth/register
Body: { "name": "Test", "password": "123456" }
Expected: 400 - "Số điện thoại không được để trống"
```

#### Test 1.2: Register with invalid phone
```
POST /api/auth/register
Body: { "phone": "123", "name": "Test", "password": "123456" }
Expected: 400 - "Số điện thoại phải có 10 số"
```

#### Test 1.3: Register with short password
```
POST /api/auth/register
Body: { "phone": "0123456789", "name": "Test", "password": "12" }
Expected: 400 - "Mật khẩu phải có ít nhất 6 ký tự"
```

**✅ Pass Criteria:**
- Tất cả trả về 400 Bad Request
- Error message rõ ràng
- Backend logs `[VALIDATION ERROR]`

---

### Layer 2: Rate Limiting

#### Test 2.1: Brute-force Login
```bash
# Gọi API login 6 lần liên tiếp
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"phone":"0999999999","password":"wrong"}'
  echo "\n--- Request $i ---"
done
```

**Expected:**
- Request 1-5: 400 (Sai thông tin)
- **Request 6: 429 Too Many Requests**

**✅ Pass Criteria:**
- Request thứ 6 bị block
- Message: "Quá nhiều yêu cầu..."
- Backend logs `[RATE LIMIT]`

**Note:** Đợi 15 phút để rate limit reset

---

### Layer 3: Authentication

#### Test 3.1: Access protected route WITHOUT token
```
GET /api/profile
Headers: (no Authorization)
Expected: 401 - "Token không được cung cấp"
```

#### Test 3.2: Access with INVALID token
```
GET /api/profile
Headers: { "Authorization": "Bearer invalid_token" }
Expected: 403 - "Token không hợp lệ hoặc hết hạn"
```

#### Test 3.3: Login và lấy token
```
POST /api/auth/login
Body: { "phone": "0987654321", "password": "123456" }
Expected: 200 + token in response
```

> **Lưu token vào biến `user_token` trong Postman**

#### Test 3.4: Access with VALID token
```
GET /api/profile
Headers: { "Authorization": "Bearer {{user_token}}" }
Expected: 200 + user data
```

**✅ Pass Criteria:**
- Không có token → 401
- Token sai → 403
- Token đúng → 200 với user data
- Backend logs `[AUTH FAILED]` và `[SUCCESS]`

---

### Layer 4: Authorization

#### Setup: Tạo 2 tokens

**User Token:**
```
POST /api/auth/login
Body: { "phone": "0987654321", "password": "123456" }
→ Save token to {{user_token}}
```

**Admin Token:**
```
POST /api/auth/login
Body: { "phone": "0123456789", "password": "123456" }
→ Save token to {{admin_token}}
```

#### Test 4.1: User tries admin action (FAIL)
```
GET /api/users
Headers: { "Authorization": "Bearer {{user_token}}" }
Expected: 403 - "Không có quyền thực hiện hành động này"
```

#### Test 4.2: Admin performs action (SUCCESS)
```
GET /api/users
Headers: { "Authorization": "Bearer {{admin_token}}" }
Expected: 200 + list of all users
```

#### Test 4.3: User tries to delete (FAIL)
```
DELETE /api/users/999
Headers: { "Authorization": "Bearer {{user_token}}" }
Expected: 403
```

#### Test 4.4: Admin deletes user (SUCCESS)
```
DELETE /api/users/999
Headers: { "Authorization": "Bearer {{admin_token}}" }
Expected: 200 or 404 (if user doesn't exist)
```

**✅ Pass Criteria:**
- User role bị chặn → 403
- Admin role thành công → 200
- Backend logs `[AUTHZ DENIED]`

---

## 📊 Test Results Checklist

### Input Validation
- [ ] Register without phone → 400
- [ ] Invalid phone format → 400
- [ ] Short password → 400
- [ ] Error messages clear

### Rate Limiting
- [ ] 6th login attempt → 429
- [ ] Rate limit message shown
- [ ] Limit resets after 15 min

### Authentication
- [ ] No token → 401
- [ ] Invalid token → 403
- [ ] Valid token → 200
- [ ] Token includes user data

### Authorization
- [ ] User can't access admin routes → 403
- [ ] Admin can access admin routes → 200
- [ ] Role properly checked

---

## 🛠 Troubleshooting

### "Role column doesn't exist"
```bash
# Run migration again
psql -U postgres -d LTDD_nangcao_doan -f migration.sql
```

### "Admin user not found"
```sql
-- Create admin manually
INSERT INTO users (phone, password, name, role) 
VALUES ('0123456789', '123456', 'Admin', 'admin');
```

### Rate limit not working
```bash
# Check server logs
# Verify express-rate-limit is installed
npm list express-rate-limit
```

### Token expired
```bash
# Login again to get new token
# Token expires in 1 hour
```

---

## 📝 Manual Testing Steps

1. **Start backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Run migration:**
   ```bash
   psql -U postgres -d LTDD_nangcao_doan -f migration.sql
   ```

3. **Import Postman collection**

4. **Run tests in order:**
   - Input Validation (Folder 1)
   - Rate Limiting (Folder 2) - Wait 15 min after
   - Authentication (Folder 3)
   - Authorization (Folder 4)

5. **Check backend logs** for:
   - `[VALIDATION ERROR]`
   - `[RATE LIMIT]`
   - `[AUTH FAILED]`
   - `[AUTHZ DENIED]`
   - `[SUCCESS]`

---

## 🎯 Expected Backend Logs

```
[VALIDATION ERROR] /api/auth/register: Số điện thoại không được để trống
[RATE LIMIT] IP ::ffff:127.0.0.1 exceeded auth limit
[AUTH FAILED] No token provided from ::ffff:127.0.0.1
[AUTH FAILED] Invalid token from ::ffff:127.0.0.1: jwt malformed
[SUCCESS] User logged in: 0123456789
[AUTHZ DENIED] User 2 (role: user) tried to access /api/users
[SUCCESS] Admin 1 retrieved all users
```

---

## ✅ Success Criteria

Tất cả 4 layers hoạt động khi:
- ✅ Invalid input bị reject
- ✅ Brute-force bị block
- ✅ Protected routes yêu cầu token
- ✅ Admin actions yêu cầu admin role
- ✅ Logs hiện đầy đủ thông tin

---

## 📞 Support

Nếu test fail:
1. Check backend logs
2. Verify migration đã chạy
3. Confirm package đã install (`express-validator`, `express-rate-limit`)
4. Restart server
5. Clear Postman cookies/cache

**Happy Testing! 🎉**
