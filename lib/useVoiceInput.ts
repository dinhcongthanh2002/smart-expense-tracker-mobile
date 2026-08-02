import { useCallback, useEffect, useRef, useState } from "react";
import {
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

// expo-speech-recognition calls requireNativeModule() at import time, which THROWS
// when the native module isn't in the binary (Expo Go, or a dev-client built before
// the module was added). Lazy-require behind try/catch so the app degrades to
// "voice unsupported" instead of crashing the whole screen.
let SpeechModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SpeechModule = require("expo-speech-recognition").ExpoSpeechRecognitionModule;
} catch {
  SpeechModule = null;
}

/** True when the native speech module is present (i.e. a dev-client build, not Expo Go). */
export const isVoiceSupported = !!SpeechModule;

export interface UseVoiceInputOptions {
  /** BCP-47 recognition language. Defaults to Vietnamese. */
  lang?: string;
  /** Called with the final transcript once the user stops speaking. */
  onFinalResult?: (text: string) => void;
}

export interface VoiceInput {
  /** Whether on-device speech recognition is available in this build. */
  supported: boolean;
  recording: boolean;
  /** Live (interim) transcript, updated while the user is speaking. */
  transcript: string;
  /** Error code/message from the last attempt, if any. */
  error?: string;
  /** Live mic input level, 0..1 (driven by the native `volumechange` event).
   *  A Reanimated shared value so UI can animate it at 60fps without re-rendering. */
  level: SharedValue<number>;
  /** Request permission (if needed) and begin listening. Returns false if it couldn't start. */
  start: () => Promise<boolean>;
  /** Stop listening — the final result still fires via onFinalResult. */
  stop: () => void;
  /** Cancel listening and discard any result. */
  abort: () => void;
}

/**
 * Thin wrapper around expo-speech-recognition for one-shot voice capture.
 * On-device speech-to-text (iOS + Android). When the native module is missing
 * (`supported === false`) every method is a safe no-op — callers should fall
 * back to manual text entry.
 */
export function useVoiceInput({
  lang = "vi-VN",
  onFinalResult,
}: UseVoiceInputOptions = {}): VoiceInput {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | undefined>();
  // Mic input level (0..1) for the "listening" animation.
  const level = useSharedValue(0);
  // Latest transcript seen (interim or final) — emitted when the session ends.
  const latestRef = useRef("");
  // Keep the callback in a ref so the native listeners subscribe only once.
  const onFinalResultRef = useRef(onFinalResult);
  onFinalResultRef.current = onFinalResult;

  useEffect(() => {
    if (!SpeechModule) return;
    const subs = [
      SpeechModule.addListener("start", () => setRecording(true)),
      SpeechModule.addListener("end", () => {
        setRecording(false);
        level.value = withTiming(0, { duration: 200 });
        const text = latestRef.current.trim();
        if (text) onFinalResultRef.current?.(text);
      }),
      // Native mic level (-2..10; <0 is inaudible). Normalise to 0..1 and smooth.
      SpeechModule.addListener("volumechange", (event: any) => {
        const v = typeof event?.value === "number" ? event.value : 0;
        const n = Math.min(1, Math.max(0, v) / 6);
        level.value = withTiming(n, { duration: 90 });
      }),
      SpeechModule.addListener("result", (event: any) => {
        const text = event?.results?.[0]?.transcript ?? "";
        if (text) {
          setTranscript(text);
          latestRef.current = text;
        }
      }),
      SpeechModule.addListener("error", (event: any) => {
        setError(event?.error ?? "unknown");
        setRecording(false);
        level.value = withTiming(0, { duration: 200 });
      }),
    ];
    return () => subs.forEach((s) => s?.remove?.());
  }, []);

  const start = useCallback(async () => {
    if (!SpeechModule) {
      setError("unavailable");
      return false;
    }
    setError(undefined);
    setTranscript("");
    latestRef.current = "";
    try {
      const perm = await SpeechModule.requestPermissionsAsync();
      if (!perm?.granted) {
        setError("not-allowed");
        return false;
      }
      SpeechModule.start({
        lang,
        interimResults: true,
        continuous: false,
        // Allow the cloud recognizer as a fallback when on-device VI isn't installed.
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
        // Emit mic-level events (~10/sec) to drive the "listening" animation.
        volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
      });
      return true;
    } catch (err) {
      setError((err as Error)?.message ?? "unavailable");
      setRecording(false);
      return false;
    }
  }, [lang]);

  const stop = useCallback(() => {
    try {
      SpeechModule?.stop();
    } catch {
      // ignore — session may already be closed
    }
  }, []);

  const abort = useCallback(() => {
    try {
      SpeechModule?.abort();
    } catch {
      // ignore
    }
    setRecording(false);
    level.value = withTiming(0, { duration: 200 });
  }, [level]);

  return { supported: isVoiceSupported, recording, transcript, error, level, start, stop, abort };
}
