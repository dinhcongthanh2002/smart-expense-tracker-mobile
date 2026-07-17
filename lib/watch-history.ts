// Local watch history + resume positions for the movie section.
// Backed by AsyncStorage; no backend involved.
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "movie_watch_history_v1";
const MAX_ENTRIES = 60;

export interface WatchHistoryEntry {
  slug: string;
  name: string;
  poster?: string;
  originName?: string;
  /** Episode name when it is a series (undefined for single movies). */
  epName?: string;
  /** Direct HLS url of the episode last watched. */
  url?: string;
  /** Embed url fallback. */
  embed?: string;
  /** Last playback position in seconds. */
  position?: number;
  /** Total duration in seconds when known. */
  duration?: number;
  /** Epoch millis of the last update. */
  updatedAt: number;
}

/** Unique key for an entry: a movie may have several episodes in progress. */
function entryKey(slug: string, epName?: string): string {
  return epName ? `${slug}::${epName}` : slug;
}

export async function getHistory(): Promise<WatchHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as WatchHistoryEntry[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Upsert an entry (matched by slug+episode), moving it to the front. */
export async function saveProgress(
  entry: Omit<WatchHistoryEntry, "updatedAt">,
): Promise<void> {
  try {
    const list = await getHistory();
    const key = entryKey(entry.slug, entry.epName);
    const next: WatchHistoryEntry = {
      ...list.find((e) => entryKey(e.slug, e.epName) === key),
      ...entry,
      updatedAt: Date.now(),
    };
    const rest = list.filter((e) => entryKey(e.slug, e.epName) !== key);
    const merged = [next, ...rest].slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    // best-effort; ignore storage failures
  }
}

/** Latest saved entry for a slug (any episode), used to show "continue". */
export async function getLatestForSlug(
  slug: string,
): Promise<WatchHistoryEntry | undefined> {
  const list = await getHistory();
  return list.find((e) => e.slug === slug);
}

/** Saved entry for a specific episode, used to resume playback position. */
export async function getEntry(
  slug: string,
  epName?: string,
): Promise<WatchHistoryEntry | undefined> {
  const list = await getHistory();
  const key = entryKey(slug, epName);
  return list.find((e) => entryKey(e.slug, e.epName) === key);
}

export async function removeFromHistory(
  slug: string,
  epName?: string,
): Promise<void> {
  try {
    const list = await getHistory();
    const key = entryKey(slug, epName);
    const merged = list.filter((e) => entryKey(e.slug, e.epName) !== key);
    await AsyncStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Fraction watched (0..1) for a progress bar, or 0 when unknown. */
export function watchedFraction(entry: WatchHistoryEntry): number {
  if (!entry.position || !entry.duration) return 0;
  return Math.min(1, Math.max(0, entry.position / entry.duration));
}
