# 🐳 Docker Setup - LTDD Backend

## 📋 Mô tả

Setup Docker để chạy backend API + PostgreSQL database. Team members chỉ cần clone repo và chạy `docker-compose up` là có môi trường giống hệt nhau!

## 🚀 Cách sử dụng

### 1. Cài đặt Docker

**Windows:**
- Download [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Install và restart máy
- Verify: `docker --version`

**Mac/Linux:**
```bash
# Mac
brew install docker

# Linux
sudo apt install docker.io docker-compose
```

### 2. Clone Repository

```bash
git clone <repo-url>
cd auth-app-new/backend
```

### 3. Chạy Docker Containers

```bash
# Khởi động tất cả services (backend + postgres)
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng containers
docker-compose down

# Dừng và xóa volumes (database data)
docker-compose down -v
```

### 4. Kiểm tra

- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
  - User: `postgres`
  - Password: `123`
  - Database: `LTDD_nangcao_doan`

### 5. Test API

```bash
# Test với curl
curl http://localhost:3000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"phone":"0123456789","password":"123456"}'
```

## 📁 Files quan trọng

```
backend/
├── Dockerfile              # Build image cho backend
├── docker-compose.yml      # Orchestration cho services
├── init.sql               # Database schema & sample data
├── .dockerignore          # Files to ignore khi build
└── DOCKER_README.md       # File này
```

## 🔧 Cấu hình

### Environment Variables

Trong `docker-compose.yml`:

```yaml
environment:
  - DB_USER=postgres
  - DB_PASSWORD=123
  - DB_HOST=postgres          # Tên service, không phải localhost!
  - DB_PORT=5432
  - DB_NAME=LTDD_nangcao_doan
```

### Ports

- Backend: `3000` → `3000`
- PostgreSQL: `5432` → `5432`

### Volumes

Database data được lưu trong Docker volume `postgres_data`:
- Data persist khi restart container
- Chỉ mất khi chạy `docker-compose down -v`

## 🔍 Troubleshooting

### Container không start

```bash
# Xem logs chi tiết
docker-compose logs backend
docker-compose logs postgres

# Restart containers
docker-compose restart
```

### Database connection error

```bash
# Kiểm tra postgres có chạy không
docker-compose ps

# Access vào postgres container
docker exec -it ltdd_postgres psql -U postgres -d LTDD_nangcao_doan

# Trong psql, check tables
\dt
SELECT * FROM users;
```

### Port đã bị sử dụng

Đổi port trong `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Đổi 3000 → 3001
```

### Reset database hoàn toàn

```bash
# Xóa tất cả (containers + volumes)
docker-compose down -v

# Build lại từ đầu
docker-compose up -d --build
```

## 📝 Workflow cho Team

### Person A (Push code)

```bash
# Làm changes
git add .
git commit -m "Updated API"
git push origin main
```

### Person B (Pull & Run)

```bash
# Pull latest code
git pull origin main

# Rebuild containers nếu có changes trong Dockerfile/package.json
docker-compose up -d --build

# Nếu chỉ code thay đổi, restart là đủ
docker-compose restart backend
```

## 🎯 Lợi ích

✅ **Consistent Environment** - Mọi người dùng chung database config  
✅ **Easy Setup** - Clone → Docker up → Done  
✅ **Database Persistence** - Data không mất khi restart  
✅ **Isolated** - Không conflict với local PostgreSQL  
✅ **Sample Data** - `init.sql` tự động tạo tables + test users

## 🔐 Sample Accounts

Trong `init.sql` có 2 accounts mẫu:

1. **Admin**
   - Phone: `0123456789`
   - Password: `123456`
   - Role: `admin`

2. **User**
   - Phone: `0987654321`
   - Password: `123456`
   - Role: `user`

## 📱 Kết nối từ React Native App

**Nếu test trên thiết bị thật:**

Cần dùng IP máy tính thay vì localhost:

```typescript
// services/api.ts
const BASE_URL = 'http://172.16.30.39:3000/api'; // IP của máy chạy Docker
```

**Nếu test trên emulator:**

- Android Emulator: `http://10.0.2.2:3000/api`
- iOS Simulator: `http://localhost:3000/api`

## 🚀 Production Notes

> [!WARNING]
> Đổi credentials trước khi deploy production:
> - Database password
> - JWT_SECRET
> - Không dùng init.sql sample data

## 📞 Support

Nếu có vấn đề:
1. Check `docker-compose logs`
2. Verify Docker đang chạy
3. Check ports không bị conflict
4. Restart: `docker-compose restart`

---

**Happy Coding! 🎉**
