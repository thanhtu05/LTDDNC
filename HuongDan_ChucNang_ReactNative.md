# HƯỚNG DẪN THỰC HIỆN CÁC CHỨC NĂNG REACT NATIVE
## Đồ án Lập Trình Di Động Nâng Cao - UTE

---

**Sinh viên thực hiện:** [Tên sinh viên]  
**Mã số sinh viên:** [MSSV]  
**Lớp:** [Lớp]  
**Ngày thực hiện:** 22/01/2026  
**GitHub Repository:** https://github.com/PhucQuan/doanLTDDnangcao_UTE.git

---

## MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Cài đặt môi trường](#2-cài-đặt-môi-trường)
3. [Cấu trúc dự án](#3-cấu-trúc-dự-án)
4. [Hướng dẫn thực hiện từng chức năng](#4-hướng-dẫn-thực-hiện-từng-chức-năng)
5. [API và Backend](#5-api-và-backend)
6. [Testing và Demo](#6-testing-và-demo)
7. [Kết luận](#7-kết-luận)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Yêu cầu đề bài
- **Register dùng OTP**: Đăng ký tài khoản với xác thực OTP qua SMS
- **Login không dùng JWT**: Đăng nhập sử dụng sessionId thay vì JWT token
- **Forget Password có dùng OTP**: Khôi phục mật khẩu thông qua OTP
- **Register không dùng OTP**: Đăng ký trực tiếp không cần xác thực (cho cá nhân)
- **Giao diện tùy chỉnh**: UI/UX theo sở thích sinh viên

### 1.2 Công nghệ sử dụng
- **Frontend**: React Native + TypeScript
- **Navigation**: React Navigation v6
- **HTTP Client**: Axios
- **Storage**: AsyncStorage
- **State Management**: React Hooks
- **Development**: Expo CLI

### 1.3 Tính năng đã thực hiện
✅ Đăng ký có/không OTP (toggle)  
✅ Đăng nhập không JWT (sessionId)  
✅ Quên mật khẩu với OTP  
✅ Đặt lại mật khẩu  
✅ Giao diện responsive  
✅ Validation đầy đủ  
✅ Error handling  
✅ Mock API cho demo  

---

## 2. CÀI ĐẶT MÔI TRƯỜNG

### 2.1 Yêu cầu hệ thống
- **Node.js**: v16 trở lên
- **npm**: v8 trở lên
- **Expo CLI**: Latest version
- **Android Studio** (cho Android)
- **Xcode** (cho iOS - chỉ trên macOS)

### 2.2 Cài đặt dependencies

```bash
# Cài đặt Expo CLI
npm install -g @expo/cli

# Clone repository
git clone https://github.com/PhucQuan/doanLTDDnangcao_UTE.git
cd doanLTDDnangcao_UTE

# Cài đặt dependencies
npm install

# Chạy ứng dụng
npx expo start
```

### 2.3 Cấu hình IDE
- **VS Code**: Cài extension React Native Tools, TypeScript
- **Android Studio**: Cấu hình AVD (Android Virtual Device)
- **Expo Go**: Cài app trên điện thoại để test

---

## 3. CẤU TRÚC DỰ ÁN

### 3.1 Thư mục gốc
```
doanLTDDnangcao_UTE/
├── src/
│   ├── screens/          # Các màn hình
│   ├── services/         # API services
│   ├── types/           # TypeScript interfaces
│   └── components/      # Shared components
├── assets/              # Hình ảnh, fonts
├── App.tsx             # Entry point
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
└── app.json           # Expo config
```

### 3.2 Screens (Màn hình)
```
src/screens/
├── LoginScreen.tsx          # Đăng nhập
├── RegisterScreen.tsx       # Đăng ký (có toggle OTP)
├── OTPVerificationScreen.tsx # Xác thực OTP
├── ForgotPasswordScreen.tsx # Quên mật khẩu
├── ResetPasswordScreen.tsx  # Đặt lại mật khẩu
└── HomeScreen.tsx          # Trang chủ
```

### 3.3 Services (Dịch vụ)
```
src/services/
├── api.ts              # API thật
└── mockApi.ts          # Mock API cho demo
```

### 3.4 Types (Kiểu dữ liệu)
```
src/types/
├── index.ts            # Interfaces chung
└── navigation.ts       # Navigation types
```

---

## 4. HƯỚNG DẪN THỰC HIỆN TỪNG CHỨC NĂNG

### 4.1 ĐĂNG KÝ KHÔNG OTP (Yêu cầu cá nhân)

#### 4.1.1 Giao diện RegisterScreen
```typescript
// src/screens/RegisterScreen.tsx
const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [useOTP, setUseOTP] = useState<boolean>(false); // Tắt OTP
  
  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
```

#### 4.1.2 Toggle OTP
```typescript
{/* Toggle OTP */}
<View style={styles.otpToggleContainer}>
  <Text style={styles.otpToggleLabel}>Sử dụng xác thực OTP:</Text>
  <TouchableOpacity
    style={[styles.toggleButton, useOTP && styles.toggleButtonActive]}
    onPress={() => setUseOTP(!useOTP)}
  >
    <Text style={styles.toggleButtonText}>
      {useOTP ? 'BẬT' : 'TẮT'}
    </Text>
  </TouchableOpacity>
</View>
```

#### 4.1.3 Xử lý đăng ký
```typescript
const handleRegister = async (): Promise<void> => {
  if (!validateForm()) return;

  const registerData = {
    name: formData.name.trim(),
    phone: formData.phone,
    password: formData.password,
    email: formData.email.trim() || undefined,
  };

  if (useOTP) {
    // Đăng ký với OTP
    const response = await authAPI.registerWithOTP(registerData);
    // Chuyển đến màn hình OTP
  } else {
    // Đăng ký không OTP (yêu cầu cá nhân)
    const response = await authAPI.register(registerData);
    // Đăng ký thành công → Chuyển đến Login
  }
};
```

#### 4.1.4 Validation form
```typescript
const validateForm = (): boolean => {
  const { name, phone, password, confirmPassword } = formData;

  if (!name.trim()) {
    Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
    return false;
  }

  if (!phone || phone.length !== 10 || !phone.startsWith('0')) {
    Alert.alert('Lỗi', 'Số điện thoại không hợp lệ');
    return false;
  }

  if (password.length < 6) {
    Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
    return false;
  }

  if (password !== confirmPassword) {
    Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
    return false;
  }

  return true;
};
```

### 4.2 ĐĂNG NHẬP KHÔNG JWT (Yêu cầu cá nhân)

#### 4.2.1 Giao diện LoginScreen
```typescript
// src/screens/LoginScreen.tsx
const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
```

#### 4.2.2 Xử lý đăng nhập
```typescript
const handleLogin = async (): Promise<void> => {
  if (!phone || !password) {
    Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
    return;
  }

  setLoading(true);
  try {
    const response = await authAPI.login({ phone, password });
    
    if (response.success && response.data) {
      // Lưu thông tin user (KHÔNG dùng JWT)
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Lưu sessionId thay vì JWT
      if (response.data.sessionId) {
        await AsyncStorage.setItem('sessionId', response.data.sessionId);
      }
      
      navigation.navigate('Home');
    }
  } catch (error: any) {
    Alert.alert('Lỗi', error.message || 'Đăng nhập thất bại');
  } finally {
    setLoading(false);
  }
};
```

#### 4.2.3 Lưu trữ không JWT
```typescript
// Thay vì JWT token, sử dụng sessionId
const sessionData = {
  user: response.data.user,
  sessionId: response.data.sessionId, // Không phải JWT
  loginTime: new Date().toISOString()
};

await AsyncStorage.setItem('session', JSON.stringify(sessionData));
```

### 4.3 ĐĂNG KÝ VỚI OTP

#### 4.3.1 Gửi OTP
```typescript
// Khi bật toggle OTP
if (useOTP) {
  const response = await authAPI.registerWithOTP(userData);
  
  if (response.success) {
    Alert.alert('Thành công', 'Mã OTP đã được gửi đến số điện thoại của bạn', [
      { 
        text: 'OK', 
        onPress: () => navigation.navigate('OTPVerification', { 
          phone: formData.phone, 
          type: 'register' 
        })
      }
    ]);
  }
}
```

#### 4.3.2 Xác thực OTP
```typescript
// src/screens/OTPVerificationScreen.tsx
const handleVerifyOTP = async (): Promise<void> => {
  if (!otp || otp.length !== 6) {
    Alert.alert('Lỗi', 'Vui lòng nhập mã OTP 6 số');
    return;
  }

  if (type === 'register') {
    const response = await authAPI.verifyRegisterOTP(phone, otp);
    
    if (response.success && response.data) {
      // Lưu thông tin user sau khi xác thực thành công
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      if (response.data.sessionId) {
        await AsyncStorage.setItem('sessionId', response.data.sessionId);
      }
      
      navigation.navigate('Home');
    }
  }
};
```

### 4.4 QUÊN MẬT KHẨU VỚI OTP

#### 4.4.1 Gửi OTP quên mật khẩu
```typescript
// src/screens/ForgotPasswordScreen.tsx
const handleSendOTP = async (): Promise<void> => {
  if (!phone || phone.length !== 10 || !phone.startsWith('0')) {
    Alert.alert('Lỗi', 'Số điện thoại không hợp lệ');
    return;
  }

  const response = await authAPI.forgotPassword(phone);
  
  if (response.success) {
    navigation.navigate('OTPVerification', { 
      phone, 
      type: 'forgot' 
    });
  }
};
```

#### 4.4.2 Xác thực OTP và reset password
```typescript
// Trong OTPVerificationScreen
if (type === 'forgot') {
  const response = await authAPI.verifyForgotPasswordOTP(phone, otp);
  
  if (response.success && response.data) {
    // Chuyển đến màn hình đặt lại mật khẩu với token
    navigation.navigate('ResetPassword', { 
      phone, 
      resetToken: response.data.resetToken 
    });
  }
}
```

#### 4.4.3 Đặt lại mật khẩu
```typescript
// src/screens/ResetPasswordScreen.tsx
const handleResetPassword = async (): Promise<void> => {
  if (newPassword !== confirmPassword) {
    Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
    return;
  }

  const response = await authAPI.resetPassword(phone, newPassword, resetToken);
  
  if (response.success) {
    Alert.alert('Thành công', 'Đặt lại mật khẩu thành công!', [
      { 
        text: 'OK', 
        onPress: () => navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      }
    ]);
  }
};
```

### 4.5 GIAO DIỆN TỰ CHỈNH

#### 4.5.1 Color Scheme
```typescript
const colors = {
  primary: '#3498db',    // Blue
  success: '#27ae60',    // Green  
  danger: '#e74c3c',     // Red
  warning: '#f39c12',    // Orange
  background: '#f8f9fa', // Light gray
  text: '#2c3e50',       // Dark gray
  border: '#e1e8ed',     // Light border
};
```

#### 4.5.2 Responsive Styles
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
```

---

## 5. API VÀ BACKEND

### 5.1 Cấu trúc API

#### 5.1.1 Base Configuration
```typescript
// src/services/api.ts
const BASE_URL = 'http://localhost:3000/api';
const USE_MOCK_API = true; // Toggle mock/real API

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

#### 5.1.2 API Endpoints
```typescript
export const authAPI = {
  // Đăng ký không OTP
  register: async (userData: RegisterRequest): Promise<ApiResponse<AuthResponse>>,
  
  // Đăng ký với OTP  
  registerWithOTP: async (userData: RegisterRequest): Promise<ApiResponse>,
  
  // Xác thực OTP đăng ký
  verifyRegisterOTP: async (phone: string, otp: string): Promise<ApiResponse<AuthResponse>>,
  
  // Đăng nhập (không JWT)
  login: async (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>>,
  
  // Quên mật khẩu
  forgotPassword: async (phone: string): Promise<ApiResponse>,
  
  // Xác thực OTP quên mật khẩu
  verifyForgotPasswordOTP: async (phone: string, otp: string): Promise<ApiResponse<{ resetToken: string }>>,
  
  // Đặt lại mật khẩu
  resetPassword: async (phone: string, newPassword: string, token: string): Promise<ApiResponse>,
};
```

### 5.2 Mock API cho Demo

#### 5.2.1 In-memory Storage
```typescript
// src/services/mockApi.ts
let users: any[] = [];
let otpStorage: { [phone: string]: { otp: string, expires: number, type: string } } = {};

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
```

#### 5.2.2 Mock Functions
```typescript
export const mockAuthAPI = {
  register: async (userData: RegisterRequest) => {
    // Simulate API call
    await delay(1000);
    
    // Check existing user
    const existingUser = users.find(u => u.phone === userData.phone);
    if (existingUser) {
      throw { message: 'Số điện thoại đã được đăng ký' };
    }

    // Create new user
    const newUser = { ...userData, id: Date.now().toString() };
    users.push(newUser);

    return {
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user: newUser,
        sessionId: `session_${Date.now()}`,
      }
    };
  },
  
  // ... other mock functions
};
```

### 5.3 TypeScript Interfaces

#### 5.3.1 Request Types
```typescript
// src/types/index.ts
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
```

#### 5.3.2 Response Types
```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface AuthResponse {
  user: User;
  sessionId?: string; // Không dùng JWT
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
}
```

---

## 6. TESTING VÀ DEMO

### 6.1 Cách chạy ứng dụng

#### 6.1.1 Development
```bash
# Chạy Metro bundler
npx expo start

# Chạy trên Android
npx expo start --android

# Chạy trên iOS
npx expo start --ios

# Chạy trên web
npx expo start --web
```

#### 6.1.2 Testing trên thiết bị
1. **Android**: Cài Expo Go từ Google Play Store
2. **iOS**: Cài Expo Go từ App Store  
3. **Scan QR code** từ terminal
4. **Hoặc nhập URL** thủ công

### 6.2 Test Cases

#### 6.2.1 Đăng ký không OTP
```
Test Case 1: Đăng ký thành công
- Input: Name, Phone (10 số), Password (>6 ký tự), Email
- Toggle OTP: TẮT
- Expected: Đăng ký thành công → Chuyển Login

Test Case 2: Validation lỗi
- Input: Phone sai format, Password ngắn
- Expected: Hiển thị alert lỗi tương ứng

Test Case 3: Phone đã tồn tại
- Input: Phone đã đăng ký trước đó
- Expected: "Số điện thoại đã được đăng ký"
```

#### 6.2.2 Đăng nhập không JWT
```
Test Case 1: Đăng nhập thành công
- Input: Phone + Password đúng
- Expected: Lưu sessionId → Chuyển Home

Test Case 2: Sai thông tin
- Input: Phone/Password sai
- Expected: "Số điện thoại hoặc mật khẩu không đúng"

Test Case 3: Session persistence
- Đăng nhập → Tắt app → Mở lại
- Expected: Tự động đăng nhập (nếu session còn hạn)
```

#### 6.2.3 OTP Flow
```
Test Case 1: Đăng ký với OTP
- Toggle OTP: BẬT → Nhập thông tin → Nhận OTP
- Expected: Chuyển màn hình OTP, hiển thị OTP trong console

Test Case 2: Xác thực OTP đúng
- Input: OTP 6 số đúng
- Expected: Đăng ký thành công → Chuyển Home

Test Case 3: OTP sai/hết hạn
- Input: OTP sai hoặc quá 5 phút
- Expected: Hiển thị lỗi tương ứng
```

### 6.3 Demo Screenshots

#### 6.3.1 Màn hình chính
- Login Screen: Form đăng nhập với validation
- Register Screen: Form đăng ký với toggle OTP
- Home Screen: Thông tin user và logout

#### 6.3.2 OTP Flow
- Forgot Password: Nhập phone → Gửi OTP
- OTP Verification: Nhập 6 số OTP với countdown
- Reset Password: Đặt mật khẩu mới

### 6.4 Performance

#### 6.4.1 Loading States
- Hiển thị ActivityIndicator khi call API
- Disable button khi đang loading
- Timeout 10 giây cho mỗi request

#### 6.4.2 Error Handling
- Try-catch cho tất cả API calls
- Alert hiển thị lỗi user-friendly
- Network error handling

---

## 7. KẾT LUẬN

### 7.1 Đánh giá kết quả

#### 7.1.1 Hoàn thành yêu cầu đề bài
✅ **Register dùng OTP**: Có toggle bật/tắt, xác thực OTP 6 số  
✅ **Login không dùng JWT**: Sử dụng sessionId, lưu AsyncStorage  
✅ **Forget Password có OTP**: Flow hoàn chỉnh từ gửi OTP đến reset  
✅ **Register không dùng OTP**: Đăng ký trực tiếp khi tắt toggle  
✅ **Giao diện tùy chỉnh**: UI hiện đại, responsive, màu sắc hài hòa  

#### 7.1.2 Tính năng mở rộng
✅ TypeScript cho type safety  
✅ Navigation stack hoàn chỉnh  
✅ Validation form đầy đủ  
✅ Error handling tốt  
✅ Mock API cho demo  
✅ Responsive design  

### 7.2 Kỹ năng đạt được

#### 7.2.1 Technical Skills
- React Native development với TypeScript
- Navigation và routing
- API integration và error handling  
- State management với React Hooks
- AsyncStorage cho data persistence
- Form validation và UX design

#### 7.2.2 Soft Skills  
- Đọc hiểu yêu cầu đề bài
- Thiết kế UI/UX user-friendly
- Code organization và best practices
- Testing và debugging
- Documentation và báo cáo

### 7.3 Hướng phát triển

#### 7.3.1 Kết nối Backend thật
```typescript
// Chuyển từ mock sang real API
const USE_MOCK_API = false;
const BASE_URL = 'https://your-api-domain.com/api';
```

#### 7.3.2 Tính năng bổ sung
- Push notifications cho OTP
- Biometric authentication (FaceID, TouchID)
- Social login (Google, Facebook)
- Profile management
- Settings và preferences
- Offline support

#### 7.3.3 Optimization
- Code splitting và lazy loading
- Image optimization
- Bundle size reduction
- Performance monitoring
- Crash analytics và error tracking

### 7.4 Tài liệu tham khảo

#### 7.4.1 Documentation
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

#### 7.4.2 Libraries Used
- @react-navigation/native: ^6.1.18
- @react-navigation/stack: ^6.4.1
- @react-native-async-storage/async-storage: 1.18.2
- axios: ^1.5.0
- expo: ~49.0.0
- react: 18.2.0
- react-native: 0.72.10

---

**Kết thúc báo cáo**

**GitHub Repository:** https://github.com/PhucQuan/doanLTDDnangcao_UTE.git  
**Demo Video:** [Link video demo nếu có]  
**APK File:** [Link file APK nếu có]

---

*Báo cáo này được tạo để nộp lên UTExLMS làm minh chứng cho đồ án Lập Trình Di Động Nâng Cao.*    