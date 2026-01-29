-- Tạo bảng users nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(10) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo index cho phone để tăng tốc độ truy vấn
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Insert dữ liệu mẫu (optional)
INSERT INTO users (phone, password, name, email, role) 
VALUES 
    ('0123456789', '123456', 'Admin User', 'admin@example.com', 'admin'),
    ('0987654321', '123456', 'Test User', 'user@example.com', 'user')
ON CONFLICT (phone) DO NOTHING;
