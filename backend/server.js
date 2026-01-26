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

// In-memory OTP Storage (OTP is temporary, so keeping it in memory is fine for now, or could use Redis/DB)
let otpStorage = {}; // { phone: { otp, expires, type } }
let tempUsers = {}; // { phone: tempUserData }

// Helper
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Middleware to verify token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Routes

// 1. Register (No OTP)
app.post('/api/auth/register', async (req, res) => {
    const { phone, password, name, email } = req.body;
    if (!phone || !password || !name) return res.status(400).json({ success: false, message: 'Thiếu thông tin' });

    try {
        // Check if user exists
        const checkUser = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Số điện thoại đã được đăng ký' });
        }

        // Insert new user
        const result = await db.query(
            'INSERT INTO users (phone, password, name, email) VALUES ($1, $2, $3, $4) RETURNING *',
            [phone, password, name, email]
        );
        const newUser = result.rows[0];

        const sessionId = `session_${Date.now()}`;
        const token = jwt.sign({ id: newUser.id, phone: newUser.phone }, SECRET_KEY, { expiresIn: '1h' });

        res.json({
            success: true,
            message: 'Đăng ký thành công',
            data: {
                user: { id: newUser.id, phone: newUser.phone, name: newUser.name, email: newUser.email },
                sessionId,
                token
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 2. Register With OTP (Step 1: Send OTP)
app.post('/api/auth/register-otp', async (req, res) => {
    const { phone, password, name, email } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Thiếu số điện thoại' });

    try {
        const checkUser = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Số điện thoại đã được đăng ký' });
        }

        const otp = generateOTP();
        otpStorage[phone] = { otp, expires: Date.now() + 300000, type: 'register' };
        tempUsers[phone] = { phone, password, name, email };

        console.log(`[OTP] Register for ${phone}: ${otp}`);

        res.json({ success: true, message: `OTP gửi đến ${phone}: ${otp}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 3. Verify Register OTP (Step 2: Verify & Create User)
app.post('/api/auth/verify-register-otp', async (req, res) => {
    const { phone, otp } = req.body;
    const stored = otpStorage[phone];

    if (!stored || stored.type !== 'register') return res.status(400).json({ success: false, message: 'OTP không hợp lệ' });
    if (Date.now() > stored.expires) {
        delete otpStorage[phone];
        return res.status(400).json({ success: false, message: 'OTP hết hạn' });
    }
    if (stored.otp !== otp) return res.status(400).json({ success: false, message: 'OTP sai' });

    const userData = tempUsers[phone];
    if (!userData) return res.status(400).json({ success: false, message: 'Lỗi dữ liệu đăng ký' });

    try {
        const result = await db.query(
            'INSERT INTO users (phone, password, name, email) VALUES ($1, $2, $3, $4) RETURNING *',
            [userData.phone, userData.password, userData.name, userData.email]
        );
        const newUser = result.rows[0];

        delete otpStorage[phone];
        delete tempUsers[phone];

        const sessionId = `session_${Date.now()}`;
        const token = jwt.sign({ id: newUser.id, phone: newUser.phone }, SECRET_KEY, { expiresIn: '1h' });

        res.json({
            success: true,
            message: 'Đăng ký thành công',
            data: {
                user: { id: newUser.id, phone: newUser.phone, name: newUser.name, email: newUser.email },
                sessionId,
                token
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 4. Login
app.post('/api/auth/login', async (req, res) => {
    const { phone, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE phone = $1 AND password = $2', [phone, password]);

        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Sai thông tin đăng nhập' });
        }

        const user = result.rows[0];
        const sessionId = `session_${Date.now()}`;
        const token = jwt.sign({ id: user.id, phone: user.phone }, SECRET_KEY, { expiresIn: '1h' });

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                user: { id: user.id, phone: user.phone, name: user.name, email: user.email },
                sessionId,
                token
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 5. Forgot Password (Step 1: Send OTP)
app.post('/api/auth/forgot-password', async (req, res) => {
    const { phone } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Số điện thoại không tồn tại' });
        }

        const otp = generateOTP();
        otpStorage[phone] = { otp, expires: Date.now() + 300000, type: 'forgot' };

        console.log(`[OTP] Forgot Pwd for ${phone}: ${otp}`);

        res.json({ success: true, message: `OTP gửi đến ${phone}: ${otp}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 6. Verify Forgot OTP (Step 2: Verify and Return Token)
app.post('/api/auth/verify-forgot-otp', (req, res) => {
    const { phone, otp } = req.body;
    const stored = otpStorage[phone];

    if (!stored || stored.type !== 'forgot') return res.status(400).json({ success: false, message: 'OTP không hợp lệ' });
    if (Date.now() > stored.expires) {
        delete otpStorage[phone];
        return res.status(400).json({ success: false, message: 'OTP hết hạn' });
    }
    if (stored.otp !== otp) return res.status(400).json({ success: false, message: 'OTP sai' });

    delete otpStorage[phone];

    const resetToken = jwt.sign({ phone, type: 'reset_password' }, SECRET_KEY, { expiresIn: '15m' });

    res.json({
        success: true,
        message: 'OTP chính xác',
        data: { resetToken }
    });
});

// 7. Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
    const { phone, newPassword, token } = req.body;

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.phone !== phone || decoded.type !== 'reset_password') {
            return res.status(400).json({ success: false, message: 'Token không hợp lệ' });
        }

        const result = await db.query('UPDATE users SET password = $1 WHERE phone = $2', [newPassword, phone]);

        if (result.rowCount === 0) {
            return res.status(400).json({ success: false, message: 'User không tồn tại' });
        }

        res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });

    } catch (err) {
        console.error(err);
        return res.status(400).json({ success: false, message: 'Token không hợp lệ hoặc hết hạn' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Also accessible at http://10.0.230.24:${PORT}`);
});
