export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  name: string;
  email?: string;
}

export interface OTPRequest {
  phone: string;
  otp: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface AuthResponse {
  user: User;
  sessionId?: string; // Không dùng JWT, dùng sessionId
  token?: string;     // JWT (cho requirement về nhà)
}