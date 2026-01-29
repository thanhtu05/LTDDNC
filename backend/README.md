# Backend - LTDD Nâng Cao

Backend API cho ứng dụng React Native (Register, Login, Forgot Password với OTP).

## 🚀 Quick Start

### Option 1: Docker (Khuyến nghị cho team)

```bash
cd backend
docker-compose up -d
```

Xem chi tiết: [DOCKER_README.md](./DOCKER_README.md)

### Option 2: Local Setup

```bash
# Install dependencies
npm install

# Setup PostgreSQL local
# Tạo database: LTDD_nangcao_doan

# Copy .env
cp .env.example .env

# Start server
npm start
```

## 📁 Structure

```
backend/
├── server.js           # Main API server
├── db.js              # Database connection
├── .env               # Environment variables
├── Dockerfile         # Docker image
├── docker-compose.yml # Docker orchestration
├── init.sql          # Database schema
└── package.json       # Dependencies
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Đăng ký (không OTP)
- `POST /api/auth/register-otp` - Đăng ký với OTP (gửi OTP)
- `POST /api/auth/verify-register-otp` - Xác thực OTP đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/forgot-password` - Quên mật khẩu (gửi OTP)
- `POST /api/auth/verify-forgot-otp` - Xác thực OTP quên mật khẩu
- `POST /api/auth/reset-password` - Đặt lại mật khẩu

## 🔐 Environment Variables

```
DB_USER=postgres
DB_PASSWORD=123
DB_HOST=localhost
DB_PORT=5432
DB_NAME=LTDD_nangcao_doan
JWT_SECRET=your_secret_key
```

## 🛠 Tech Stack

- Node.js + Express
- PostgreSQL
- JWT Authentication
- Docker + Docker Compose
