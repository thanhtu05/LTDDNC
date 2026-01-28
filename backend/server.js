const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'your_super_secret_key';

app.use(cors());
app.use(bodyParser.json());

// In-memory OTP Storage
let otpStorage = {}; // { phone: { otp, expires, type } }
let tempUsers = {}; // { phone: tempUserData }

// Helper
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ===================================
// LAYER 2: RATE LIMITING
// ===================================

// Auth endpoints: 5 requests per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút' },
    handler: (req, res) => {
        console.log(`[RATE LIMIT] IP ${req.ip} exceeded auth limit`);
        res.status(429).json({ success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút' });
    }
});

// Register endpoint: 3 requests per hour
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: { success: false, message: 'Quá nhiều lần đăng ký, vui lòng thử lại sau 1 giờ' },
    handler: (req, res) => {
        console.log(`[RATE LIMIT] IP ${req.ip} exceeded register limit`);
        res.status(429).json({ success: false, message: 'Quá nhiều lần đăng ký, vui lòng thử lại sau 1 giờ' });
    }
});

// ===================================
// LAYER 1: INPUT VALIDATION
// ===================================

const validateRegister = [
    body('phone')
        .trim()
        .notEmpty().withMessage('Số điện thoại không được để trống')
        .isLength({ min: 10, max: 10 }).withMessage('Số điện thoại phải có 10 số')
        .matches(/^0[0-9]{9}$/).withMessage('Số điện thoại phải bắt đầu bằng số 0'),
    body('password')
        .trim()
        .notEmpty().withMessage('Mật khẩu không được để trống')
        .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('name')
        .trim()
        .notEmpty().withMessage('Tên không được để trống')
        .isLength({ min: 2 }).withMessage('Tên phải có ít nhất 2 ký tự'),
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Email không hợp lệ')
];

const validateLogin = [
    body('phone')
        .trim()
        .notEmpty().withMessage('Số điện thoại không được để trống')
        .matches(/^0[0-9]{9}$/).withMessage('Số điện thoại không hợp lệ'),
    body('password')
        .trim()
        .notEmpty().withMessage('Mật khẩu không được để trống')
];

const validateForgotPassword = [
    body('phone')
        .trim()
        .notEmpty().withMessage('Số điện thoại không được để trống')
        .matches(/^0[0-9]{9}$/).withMessage('Số điện thoại không hợp lệ')
];

const validateResetPassword = [
    body('phone')
        .trim()
        .notEmpty().withMessage('Số điện thoại không được để trống'),
    body('newPassword')
        .trim()
        .notEmpty().withMessage('Mật khẩu mới không được để trống')
        .isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
    body('token')
        .notEmpty().withMessage('Token không được để trống')
];

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        console.log(`[VALIDATION ERROR] ${req.path}: ${firstError.msg}`);
        return res.status(400).json({
            success: false,
            message: firstError.msg,
            errors: errors.array()
        });
    }
    next();
};

// ===================================
// LAYER 3: AUTHENTICATION
// ===================================

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        console.log(`[AUTH FAILED] No token provided from ${req.ip}`);
        return res.status(401).json({ success: false, message: 'Token không được cung cấp' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.log(`[AUTH FAILED] Invalid token from ${req.ip}: ${err.message}`);
            return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc hết hạn' });
        }
        req.user = user;
        next();
    });
};

// ===================================
// LAYER 4: AUTHORIZATION
// ===================================

const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user.role || !roles.includes(req.user.role)) {
            console.log(`[AUTHZ DENIED] User ${req.user.id} (role: ${req.user.role}) tried to access ${req.path}`);
            return res.status(403).json({
                success: false,
                message: 'Không có quyền thực hiện hành động này'
            });
        }
        next();
    };
};

// ===================================
// ROUTES
// ===================================

// 1. Register (No OTP)
app.post('/api/auth/register', registerLimiter, validateRegister, validate, async (req, res) => {
    const { phone, password, name, email } = req.body;

    try {
        // Check if user exists
        const checkUser = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Số điện thoại đã được đăng ký' });
        }

        // Insert new user
        const result = await db.query(
            'INSERT INTO users (phone, password, name, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [phone, password, name, email || null, 'user']
        );
        const newUser = result.rows[0];

        const sessionId = `session_${Date.now()}`;
        const token = jwt.sign(
            { id: newUser.id, phone: newUser.phone, role: newUser.role },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        console.log(`[SUCCESS] User registered: ${phone}`);

        res.json({
            success: true,
            message: 'Đăng ký thành công',
            data: {
                user: { id: newUser.id, phone: newUser.phone, name: newUser.name, email: newUser.email, role: newUser.role },
                sessionId,
                token
            }
        });
    } catch (err) {
        console.error('[ERROR]', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 2. Register With OTP (Step 1: Send OTP)
app.post('/api/auth/register-otp', registerLimiter, validateRegister, validate, async (req, res) => {
    const { phone, password, name, email } = req.body;

    try {
        const checkUser = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Số điện thoại đã được đăng ký' });
        }

        const otp = generateOTP();
        otpStorage[phone] = { otp, expires: Date.now() + 300000, type: 'register' };
        tempUsers[phone] = { phone, password, name, email: email || null };

        console.log(`[OTP] Register for ${phone}: ${otp}`);

        res.json({ success: true, message: `OTP gửi đến ${phone}: ${otp}` });
    } catch (err) {
        console.error('[ERROR]', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 3. Verify Register OTP (Step 2: Verify & Create User)
app.post('/api/auth/verify-register-otp', async (req, res) => {
    const { phone, otp } = req.body;
    const stored = otpStorage[phone];

    if (!stored || stored.type !== 'register') {
        return res.status(400).json({ success: false, message: 'OTP không hợp lệ' });
    }
    if (Date.now() > stored.expires) {
        delete otpStorage[phone];
        return res.status(400).json({ success: false, message: 'OTP hết hạn' });
    }
    if (stored.otp !== otp) {
        return res.status(400).json({ success: false, message: 'OTP sai' });
    }

    const userData = tempUsers[phone];
    if (!userData) {
        return res.status(400).json({ success: false, message: 'Lỗi dữ liệu đăng ký' });
    }

    try {
        const result = await db.query(
            'INSERT INTO users (phone, password, name, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userData.phone, userData.password, userData.name, userData.email, 'user']
        );
        const newUser = result.rows[0];

        delete otpStorage[phone];
        delete tempUsers[phone];

        const sessionId = `session_${Date.now()}`;
        const token = jwt.sign(
            { id: newUser.id, phone: newUser.phone, role: newUser.role },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        console.log(`[SUCCESS] User registered with OTP: ${phone}`);

        res.json({
            success: true,
            message: 'Đăng ký thành công',
            data: {
                user: { id: newUser.id, phone: newUser.phone, name: newUser.name, email: newUser.email, role: newUser.role },
                sessionId,
                token
            }
        });
    } catch (err) {
        console.error('[ERROR]', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 4. Login
app.post('/api/auth/login', authLimiter, validateLogin, validate, async (req, res) => {
    const { phone, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE phone = $1 AND password = $2', [phone, password]);

        if (result.rows.length === 0) {
            console.log(`[AUTH FAILED] Login attempt failed for ${phone}`);
            return res.status(400).json({ success: false, message: 'Sai thông tin đăng nhập' });
        }

        const user = result.rows[0];
        const sessionId = `session_${Date.now()}`;
        const token = jwt.sign(
            { id: user.id, phone: user.phone, role: user.role || 'user' },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        console.log(`[SUCCESS] User logged in: ${phone}`);

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                user: { id: user.id, phone: user.phone, name: user.name, email: user.email, role: user.role || 'user' },
                sessionId,
                token
            }
        });
    } catch (err) {
        console.error('[ERROR]', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 5. Forgot Password (Step 1: Send OTP)
app.post('/api/auth/forgot-password', authLimiter, validateForgotPassword, validate, async (req, res) => {
    const { phone } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Số điện thoại không tồn tại' });
        }

        const otp = generateOTP();
        otpStorage[phone] = { otp, expires: Date.now() + 300000, type: 'forgot' };

        console.log(`[OTP] Forgot Password for ${phone}: ${otp}`);

        res.json({ success: true, message: `OTP gửi đến ${phone}: ${otp}` });
    } catch (err) {
        console.error('[ERROR]', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 6. Verify Forgot OTP (Step 2: Verify and Return Token)
app.post('/api/auth/verify-forgot-otp', (req, res) => {
    const { phone, otp } = req.body;
    const stored = otpStorage[phone];

    if (!stored || stored.type !== 'forgot') {
        return res.status(400).json({ success: false, message: 'OTP không hợp lệ' });
    }
    if (Date.now() > stored.expires) {
        delete otpStorage[phone];
        return res.status(400).json({ success: false, message: 'OTP hết hạn' });
    }
    if (stored.otp !== otp) {
        return res.status(400).json({ success: false, message: 'OTP sai' });
    }

    delete otpStorage[phone];

    const resetToken = jwt.sign({ phone, type: 'reset_password' }, SECRET_KEY, { expiresIn: '15m' });

    res.json({
        success: true,
        message: 'OTP chính xác',
        data: { resetToken }
    });
});

// 7. Reset Password
app.post('/api/auth/reset-password', validateResetPassword, validate, async (req, res) => {
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

        console.log(`[SUCCESS] Password reset for ${phone}`);

        res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });

    } catch (err) {
        console.error('[ERROR]', err);
        return res.status(400).json({ success: false, message: 'Token không hợp lệ hoặc hết hạn' });
    }
});

// ===================================
// PROTECTED ROUTES (Authentication Required)
// ===================================

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT id, phone, name, email, role FROM users WHERE id = $1', [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        res.json({
            success: true,
            data: { user: result.rows[0] }
        });
    } catch (err) {
        console.error('[ERROR]', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// ===================================
// ADMIN-ONLY ROUTES (Authorization Required)
// ===================================

// Get all users (Admin only)
app.get('/api/users', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const result = await db.query('SELECT id, phone, name, email, role, created_at FROM users ORDER BY created_at DESC');

        console.log(`[SUCCESS] Admin ${req.user.id} retrieved all users`);

        res.json({
            success: true,
            data: { users: result.rows }
        });
    } catch (err) {
        console.error('[ERROR]', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Delete user (Admin only)
app.delete('/api/users/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const userId = req.params.id;

    try {
        const result = await db.query('DELETE FROM users WHERE id = $1', [userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        console.log(`[SUCCESS] Admin ${req.user.id} deleted user ${userId}`);

        res.json({ success: true, message: 'Xóa user thành công' });
    } catch (err) {
        console.error('[ERROR]', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// ===================================
// START SERVER
// ===================================

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Also accessible at http://10.0.230.24:${PORT}`);
    console.log('✅ Security layers enabled:');
    console.log('  - Input Validation');
    console.log('  - Rate Limiting');
    console.log('  - Authentication (JWT)');
    console.log('  - Authorization (Role-based)');
});
