// Feedback cue fired the moment voice capture starts, so the user knows the app
// is now listening: a light haptic plus a short rising "earcon" beep. Always on —
// there is no in-app toggle. The beep intentionally respects the device's silent
// switch (iOS ring/silent), so when the phone is set to vibrate the user still
// gets the haptic but no sound.
//
// The beep is played BEFORE speech recognition starts — `playListeningCue()`
// resolves only after the beep has finished so the caller can `start()` without
// the tone leaking into the mic and polluting the transcript (notably on Android).

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";

// The beep asset is ~230ms; wait a touch longer before returning so the tone has
// fully decayed before the recognizer opens the mic.
const BEEP_MS = 270;

// One reusable player instance; created lazily on first playback.
let player: AudioPlayer | null = null;
let audioModeSet = false;

/**
 * Fire the "now listening" cue: a light haptic + a short beep. Resolves after the
 * beep finishes so callers can start speech recognition without the tone bleeding
 * into the recording. The beep obeys the device silent switch (haptic always fires).
 */
export async function playListeningCue(): Promise<void> {
  // Haptic is silent and non-intrusive — always fire it. On a phone switched to
  // vibrate, this is the only feedback (the beep is muted by the OS).
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

  try {
    if (!audioModeSet) {
      // Respect the ring/silent switch: on silent the beep is muted by the OS,
      // leaving just the haptic. (This is the default, set explicitly for clarity.)
      await setAudioModeAsync({ playsInSilentMode: false });
      audioModeSet = true;
    }
    if (!player) {
      player = createAudioPlayer(require("../assets/listen-start.wav"));
    }
    player.seekTo(0);
    player.play();
    // Let the tone fully decay before we return (and the caller opens the mic).
    await new Promise<void>((resolve) => setTimeout(resolve, BEEP_MS));
  } catch {
    // Cue is best-effort; never block starting the mic on it.
  }
}
