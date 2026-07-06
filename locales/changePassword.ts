export default {
  vi: {
    title: "Đổi mật khẩu",
    instructionsSent: "Nhập mã xác nhận đã gửi tới {{email}} và mật khẩu mới",
    instructionsInitial: "Chúng tôi sẽ gửi mã xác nhận tới {{email}}",
    emailFallback: "email của bạn",
    sendCode: "Gửi mã xác nhận",
    resendCode: "Gửi lại mã",
    fields: {
      token: "Mã xác nhận",
      newPassword: "Mật khẩu mới",
      confirmPassword: "Xác nhận mật khẩu",
    },
    placeholders: {
      newPassword: "Tối thiểu 6 ký tự",
      confirmPassword: "Nhập lại mật khẩu",
    },
    validation: {
      token: "Nhập mã xác nhận",
      minLength: "Mật khẩu tối thiểu 6 ký tự",
      mismatch: "Mật khẩu không khớp",
    },
    success: "Đổi mật khẩu thành công",
    noEmail: "Tài khoản chưa có email",
  },
  en: {
    title: "Change password",
    instructionsSent: "Enter the code sent to {{email}} and your new password",
    instructionsInitial: "We'll send a verification code to {{email}}",
    emailFallback: "your email",
    sendCode: "Send verification code",
    resendCode: "Resend code",
    fields: {
      token: "Verification code",
      newPassword: "New password",
      confirmPassword: "Confirm password",
    },
    placeholders: {
      newPassword: "At least 6 characters",
      confirmPassword: "Re-enter password",
    },
    validation: {
      token: "Enter the verification code",
      minLength: "Password must be at least 6 characters",
      mismatch: "Passwords don't match",
    },
    success: "Password changed successfully",
    noEmail: "Account has no email",
  },
};
