const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'your_super_secret_key';

app.use(cors());
app.use(bodyParser.json());

// In-memory OTP Storage
let otpStorage = {};
let tempUsers = {};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// API Trang chủ dùng chung cho nhóm
app.get('/api/home/data', (req, res) => {
    res.json({
        success: true,
        data: {
            banners: [
                { id: 1, image: 'https://via.placeholder.com/800x400', title: 'Khuyến mãi hè 2024' },
                { id: 2, image: 'https://via.placeholder.com/800x400', title: 'Cập nhật tính năng mới' }
            ],
            services: [
                { id: 1, name: 'Nạp tiền', icon: 'wallet', color: '#4caf50' },
                { id: 2, name: 'Thanh toán', icon: 'credit-card', color: '#2196f3' },
                { id: 3, name: 'Chuyển tiền', icon: 'send', color: '#ff9800' },
                { id: 4, name: 'Lịch sử', icon: 'history', color: '#9c27b0' }
            ],
            news: [
                { id: 1, title: 'Hướng dẫn bảo mật tài khoản', date: '2024-03-20' },
                { id: 2, title: 'Thông báo bảo trì hệ thống', date: '2024-03-18' }
            ]
        }
    });
});

// Routes Authentication
app.post('/api/auth/register', async (req, res) => {
    const { phone, password, name, email } = req.body;
    if (!phone || !password || !name) return res.status(400).json({ success: false, message: 'Thiếu thông tin' });

    try {
        const checkUser = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Số điện thoại đã được đăng ký' });
        }

        await db.query(
            'INSERT INTO users (phone, password, name, email) VALUES (?, ?, ?, ?)',
            [phone, password, name, email]
        );

        const result = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
        const newUser = result.rows[0];

        const token = jwt.sign({ id: newUser.id, phone: newUser.phone }, SECRET_KEY, { expiresIn: '1h' });

        res.json({
            success: true,
            message: 'Đăng ký thành công',
            data: {
                user: { id: newUser.id, phone: newUser.phone, name: newUser.name, email: newUser.email },
                token
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { phone, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE phone = ? AND password = ?', [phone, password]);
        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Sai thông tin đăng nhập' });
        }
        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, phone: user.phone }, SECRET_KEY, { expiresIn: '1h' });
        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                user: { id: user.id, phone: user.phone, name: user.name, email: user.email },
                token
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
