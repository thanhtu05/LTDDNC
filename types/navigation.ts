export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  OTPVerification: { phone: string; type: 'register' | 'forgot' };
  ForgotPassword: undefined;
  ResetPassword: { phone: string; resetToken: string };
  Home: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}