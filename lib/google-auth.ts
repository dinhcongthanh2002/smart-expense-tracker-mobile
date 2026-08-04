// Thin wrapper around @react-native-google-signin for one-shot Google sign-in.
// We only need the Google ID token — the backend (/authentication/google-login)
// verifies it and returns our own JWT session.
//
// The package calls TurboModuleRegistry.getEnforcing('RNGoogleSignin') at import
// time, which THROWS when the native module isn't in the binary (Expo Go, or a
// dev-client built before it was added). Lazy-require behind try/catch so the app
// degrades to "Google unavailable" (button hidden) instead of crashing on launch.
let GoogleSignin: any = null;
let isSuccessResponse: (r: any) => boolean = () => false;
let isErrorWithCode: (e: any) => boolean = () => false;
let statusCodes: any = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("@react-native-google-signin/google-signin");
  GoogleSignin = mod.GoogleSignin;
  isSuccessResponse = mod.isSuccessResponse;
  isErrorWithCode = mod.isErrorWithCode;
  statusCodes = mod.statusCodes ?? {};
} catch {
  GoogleSignin = null;
}

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

/** True when the native module is present AND the OAuth web client id is set. */
export const isGoogleConfigured = !!GoogleSignin && !!webClientId;

let configured = false;
function ensureConfigured() {
  if (configured || !webClientId) return;
  GoogleSignin.configure({
    // webClientId is what mints the idToken audience the backend verifies.
    webClientId,
    // iosClientId is optional; picked up from the plist/plugin, but set when provided.
    ...(iosClientId ? { iosClientId } : {}),
    offlineAccess: false,
  });
  configured = true;
}

/** Raised when the user dismisses the Google account picker — callers stay silent. */
export class GoogleCancelledError extends Error {
  constructor() {
    super("cancelled");
    this.name = "GoogleCancelledError";
  }
}

/**
 * Open the Google account picker and return the ID token to POST to the backend.
 * Throws {@link GoogleCancelledError} if the user cancels, or a generic Error
 * (with a message safe to surface) on any other failure.
 */
export async function signInWithGoogle(): Promise<string> {
  if (!webClientId) {
    throw new Error("Google Sign-In is not configured");
  }
  ensureConfigured();
  try {
    // Play Services check is a no-op on iOS; guards missing/old services on Android.
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      // type === "cancelled"
      throw new GoogleCancelledError();
    }
    const idToken = response.data.idToken;
    if (!idToken) throw new Error("No ID token returned by Google");
    return idToken;
  } catch (e) {
    if (e instanceof GoogleCancelledError) throw e;
    if (isErrorWithCode(e) && (e as any).code === statusCodes.SIGN_IN_CANCELLED) {
      throw new GoogleCancelledError();
    }
    throw e instanceof Error ? e : new Error("Google Sign-In failed");
  }
}

/** Sign out of the Google session (so the next sign-in re-shows the picker). */
export async function signOutGoogle(): Promise<void> {
  if (!configured) return;
  try {
    await GoogleSignin.signOut();
  } catch {
    // best-effort
  }
}
