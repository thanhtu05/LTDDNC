import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OTPVerificationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OTPVerification'>;
type OTPVerificationScreenRouteProp = RouteProp<RootStackParamList, 'OTPVerification'>;

interface Props {
  navigation: OTPVerificationScreenNavigationProp;
  route: OTPVerificationScreenRouteProp;
}

const OTPVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phone, type } = route.params;
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerifyOTP = async (): Promise<void> => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã OTP 6 số');
      return;
    }

    setLoading(true);
    try {
      if (type === 'register') {
        const response = await authAPI.verifyRegisterOTP(phone, otp);

        if (response.success && response.data) {
          // Lưu thông tin user sau khi xác thực thành công
          await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
          if (response.data.sessionId) {
            await AsyncStorage.setItem('sessionId', response.data.sessionId);
          }
          if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
          }

          Alert.alert('Thành công', 'Đăng ký tài khoản thành công!', [
            { text: 'OK', onPress: () => navigation.navigate('Home') }
          ]);
        } else {
          Alert.alert('Lỗi', response.message || 'Xác thực OTP thất bại');
        }
      } else if (type === 'forgot') {
        const response = await authAPI.verifyForgotPasswordOTP(phone, otp);

        if (response.success && response.data) {
          // Chuyển đến màn hình đặt lại mật khẩu với token
          navigation.navigate('ResetPassword', {
            phone,
            resetToken: response.data.resetToken
          });
        } else {
          Alert.alert('Lỗi', response.message || 'Xác thực OTP thất bại');
        }
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Xác thực OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async (): Promise<void> => {
    if (!canResend) return;

    setLoading(true);
    try {
      if (type === 'register') {
        // Gửi lại OTP cho đăng ký
        Alert.alert('Thông báo', 'Chức năng gửi lại OTP đăng ký chưa được triển khai');
      } else if (type === 'forgot') {
        const response = await authAPI.forgotPassword(phone);

        if (response.success) {
          Alert.alert('Thành công', 'Mã OTP mới đã được gửi');
          setCountdown(60);
          setCanResend(false);

          // Restart countdown
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                setCanResend(true);
                clearInterval(timer);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          Alert.alert('Lỗi', response.message || 'Gửi lại OTP thất bại');
        }
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Gửi lại OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Xác thực OTP</Text>
        <Text style={styles.subtitle}>
          Mã xác thực đã được gửi đến số {phone}
        </Text>

        <TextInput
          style={styles.otpInput}
          placeholder="Nhập mã OTP 6 số"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.disabledButton]}
          onPress={handleVerifyOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Xác thực</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          {canResend ? (
            <TouchableOpacity onPress={handleResendOTP}>
              <Text style={styles.resendText}>Gửi lại mã OTP</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.countdownText}>
              Gửi lại sau {countdown}s
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#7f8c8d',
    lineHeight: 24,
  },
  otpInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 30,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  verifyButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 18,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  verifyButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resendText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '500',
  },
  countdownText: {
    color: '#7f8c8d',
    fontSize: 16,
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#95a5a6',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default OTPVerificationScreen;