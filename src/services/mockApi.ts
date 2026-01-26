import { LoginRequest, RegisterRequest, ApiResponse, AuthResponse } from '../types';

// Mock data storage
let users: any[] = [];
let otpStorage: { [phone: string]: { otp: string, expires: number, type: string } } = {};

// Mock delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate random OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Mock API Services
export const mockAuthAPI = {
  // Đăng ký tài khoản (không dùng OTP)
  register: async (userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    await delay(1000); // Simulate network delay

    // Check if user already exists
    const existingUser = users.find(u => u.phone === userData.phone);
    if (existingUser) {
      throw { message: 'Số điện thoại đã được đăng ký' };
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      phone: userData.phone,
      name: userData.name,
      email: userData.email,
      password: userData.password, // In real app, this should be hashed
    };

    users.push(newUser);

    return {
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user: {
          id: newUser.id,
          phone: newUser.phone,
          name: newUser.name,
          email: newUser.email,
        },
        sessionId: `session_${Date.now()}`,
      }
    };
  },

  // Đăng ký với OTP
  registerWithOTP: async (userData: RegisterRequest): Promise<ApiResponse> => {
    await delay(1000);

    // Check if user already exists
    const existingUser = users.find(u => u.phone === userData.phone);
    if (existingUser) {
      throw { message: 'Số điện thoại đã được đăng ký' };
    }

    // Generate and store OTP
    const otp = generateOTP();
    otpStorage[userData.phone] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      type: 'register',
    };

    // Store user data temporarily (in real app, store in database)
    const tempUser = {
      ...userData,
      id: Date.now().toString(),
      verified: false,
    };

    // Store temp user (in real app, this would be in database)
    (global as any).tempUsers = (global as any).tempUsers || {};
    (global as any).tempUsers[userData.phone] = tempUser;

    console.log(`Mock OTP for ${userData.phone}: ${otp}`); // For demo purposes

    return {
      success: true,
      message: `Mã OTP đã được gửi đến ${userData.phone}. Demo OTP: ${otp}`,
    };
  },

  // Xác thực OTP cho đăng ký
  verifyRegisterOTP: async (phone: string, otp: string): Promise<ApiResponse<AuthResponse>> => {
    await delay(1000);

    const storedOTP = otpStorage[phone];
    if (!storedOTP || storedOTP.type !== 'register') {
      throw { message: 'Không tìm thấy mã OTP' };
    }

    if (Date.now() > storedOTP.expires) {
      delete otpStorage[phone];
      throw { message: 'Mã OTP đã hết hạn' };
    }

    if (storedOTP.otp !== otp) {
      throw { message: 'Mã OTP không đúng' };
    }

    // Get temp user data
    const tempUser = (global as any).tempUsers?.[phone];
    if (!tempUser) {
      throw { message: 'Không tìm thấy thông tin đăng ký' };
    }

    // Create verified user
    const newUser = {
      ...tempUser,
      verified: true,
    };

    users.push(newUser);

    // Clean up
    delete otpStorage[phone];
    delete (global as any).tempUsers[phone];

    return {
      success: true,
      message: 'Xác thực thành công',
      data: {
        user: {
          id: newUser.id,
          phone: newUser.phone,
          name: newUser.name,
          email: newUser.email,
        },
        sessionId: `session_${Date.now()}`,
        token: `mock_jwt_token_${Date.now()}_${newUser.id}`, // Fake JWT
      }
    };
  },

  // Đăng nhập
  login: async (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    await delay(1000);

    const user = users.find(u => u.phone === credentials.phone && u.password === credentials.password);
    if (!user) {
      throw { message: 'Số điện thoại hoặc mật khẩu không đúng' };
    }

    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
        },
        sessionId: `session_${Date.now()}`,
        token: `mock_jwt_token_${Date.now()}_${user.id}`, // Fake JWT
      }
    };
  },

  // Quên mật khẩu - gửi OTP
  forgotPassword: async (phone: string): Promise<ApiResponse> => {
    await delay(1000);

    const user = users.find(u => u.phone === phone);
    if (!user) {
      throw { message: 'Số điện thoại không tồn tại' };
    }

    // Generate and store OTP
    const otp = generateOTP();
    otpStorage[phone] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      type: 'forgot',
    };

    console.log(`Mock OTP for forgot password ${phone}: ${otp}`); // For demo purposes

    return {
      success: true,
      message: `Mã OTP đã được gửi đến ${phone}. Demo OTP: ${otp}`,
    };
  },

  // Xác thực OTP cho quên mật khẩu
  verifyForgotPasswordOTP: async (phone: string, otp: string): Promise<ApiResponse<{ resetToken: string }>> => {
    await delay(1000);

    const storedOTP = otpStorage[phone];
    if (!storedOTP || storedOTP.type !== 'forgot') {
      throw { message: 'Không tìm thấy mã OTP' };
    }

    if (Date.now() > storedOTP.expires) {
      delete otpStorage[phone];
      throw { message: 'Mã OTP đã hết hạn' };
    }

    if (storedOTP.otp !== otp) {
      throw { message: 'Mã OTP không đúng' };
    }

    // Generate reset token
    const resetToken = `reset_${Date.now()}_${phone}`;

    // Clean up OTP
    delete otpStorage[phone];

    return {
      success: true,
      message: 'Xác thực thành công',
      data: { resetToken }
    };
  },

  // Đặt lại mật khẩu
  resetPassword: async (phone: string, newPassword: string, token: string): Promise<ApiResponse> => {
    await delay(1000);

    // Validate reset token (simple validation for demo)
    if (!token.includes(phone)) {
      throw { message: 'Token không hợp lệ' };
    }

    const userIndex = users.findIndex(u => u.phone === phone);
    if (userIndex === -1) {
      throw { message: 'Không tìm thấy người dùng' };
    }

    // Update password
    users[userIndex].password = newPassword;

    return {
      success: true,
      message: 'Đặt lại mật khẩu thành công',
    };
  }
};