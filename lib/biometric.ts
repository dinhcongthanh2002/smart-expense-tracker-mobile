import * as LocalAuthentication from "expo-local-authentication";

/** Device has biometric hardware AND the user has enrolled a face/fingerprint. */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const [hasHardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && enrolled;
  } catch {
    return false;
  }
}

/** Human label for the available biometric method. */
export async function getBiometricLabel(): Promise<string> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return "Face ID";
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return "Vân tay";
    }
  } catch {
    // ignore
  }
  return "Sinh trắc học";
}

export async function authenticateBiometric(
  promptMessage = "Xác thực để tiếp tục",
): Promise<boolean> {
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: "Huỷ",
      // Allow the OS passcode fallback if biometrics can't be used; the app's
      // password form remains available below as well.
      disableDeviceFallback: false,
    });
    return res.success;
  } catch {
    return false;
  }
}
