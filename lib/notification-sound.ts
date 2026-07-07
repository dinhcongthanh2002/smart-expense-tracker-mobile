// Plays the in-app notification chime (+ a light haptic). Used by the global
// NotificationWatcher when a new notification arrives while the app is open.
// This is deliberately in-app only — the app does not post OS notifications.

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "./constants";

// Cache the toggle in memory so playback doesn't await storage each time.
// Defaults to on; `setNotificationSoundEnabled` keeps it in sync.
let soundEnabled = true;

AsyncStorage.getItem(STORAGE_KEYS.notificationSound).then((v) => {
  soundEnabled = v !== "0";
});

export function setNotificationSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  AsyncStorage.setItem(STORAGE_KEYS.notificationSound, enabled ? "1" : "0");
}

export async function getNotificationSoundEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(STORAGE_KEYS.notificationSound);
  soundEnabled = v !== "0";
  return soundEnabled;
}

// One reusable player instance; created lazily on first playback.
let player: AudioPlayer | null = null;
let audioModeSet = false;

/** Play the notification chime + a light haptic, respecting the user setting. */
export async function playNotificationAlert() {
  if (!soundEnabled) return;
  try {
    if (!audioModeSet) {
      // Play even when the ringer switch is on silent (iOS).
      await setAudioModeAsync({ playsInSilentMode: true });
      audioModeSet = true;
    }
    if (!player) {
      player = createAudioPlayer(require("../assets/notification.wav"));
    }
    player.seekTo(0);
    player.play();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } catch {
    // Sound is best-effort; never block the UI on it.
  }
}
