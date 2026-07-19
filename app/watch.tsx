import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Video, { ResizeMode, type VideoRef } from "react-native-video";
import { WebView } from "react-native-webview";
import { Image } from "expo-image";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";

import { getMovie, imageUrl, type OphimMovieDetail } from "@/lib/ophim";
import {
  getEntry,
  getHistory,
  saveProgress,
  watchedFraction,
} from "@/lib/watch-history";
import { colors } from "@/theme/colors";

interface Episode {
  name?: string;
  url?: string;
  embed?: string;
}

/** Build the ordered episode playlist for the server that holds the current one. */
function buildPlaylist(
  movie: OphimMovieDetail,
  epName?: string,
  url?: string,
): { items: Episode[]; index: number } | null {
  for (const server of movie.episodes ?? []) {
    const list = server.server_data;
    const i = list.findIndex(
      (e) => (epName && e.name === epName) || (url && e.link_m3u8 === url),
    );
    if (i >= 0) {
      return {
        items: list.map((e) => ({ name: e.name, url: e.link_m3u8, embed: e.link_embed })),
        index: i,
      };
    }
  }
  const first = movie.episodes?.[0]?.server_data;
  if (first?.length) {
    return { items: first.map((e) => ({ name: e.name, url: e.link_m3u8, embed: e.link_embed })), index: 0 };
  }
  return null;
}

/** "Tập 1" vs a named part like "Full" / "Trailer". */
function episodeLabel(name: string | undefined, epWord: string): string {
  if (!name) return epWord;
  return /^\d+$/.test(name) ? `${epWord} ${name}` : name;
}

export default function WatchScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { url, embed, slug, name, poster, epName } = useLocalSearchParams<{
    title?: string;
    url?: string;
    embed?: string;
    slug?: string;
    name?: string;
    poster?: string;
    epName?: string;
  }>();

  const videoRef = useRef<VideoRef>(null);

  // ---- playlist (auto-next / episode panel) ----------------------------
  const [playlist, setPlaylist] = useState<Episode[]>([{ name: epName, url, embed }]);
  const [idx, setIdx] = useState(0);
  const [ended, setEnded] = useState(false);
  const [epThumb, setEpThumb] = useState<string | undefined>(
    poster ? imageUrl(poster) : undefined,
  );
  const [epProgress, setEpProgress] = useState<Record<string, number>>({});
  const epSheetRef = useRef<BottomSheetModal>(null);
  const { height } = useWindowDimensions();
  const current = playlist[idx] ?? { name: epName, url, embed };
  const hasUrl = !!current.url && current.url.length > 0;
  const hasNext = playlist.length > 1 && idx < playlist.length - 1;
  const isSeries = playlist.length > 1;

  useEffect(() => {
    if (!slug) return;
    getMovie(slug).then((m) => {
      if (!m) return;
      const thumb = imageUrl(m.thumb_url || m.poster_url);
      if (thumb) setEpThumb(thumb);
      const pl = buildPlaylist(m, epName || undefined, url || undefined);
      if (pl && pl.items.length > 1) {
        setPlaylist(pl.items);
        setIdx(pl.index);
      }
    });
  }, [slug, epName, url]);

  const openEpPanel = useCallback(() => {
    epSheetRef.current?.present();
    if (!slug) return;
    getHistory().then((h) => {
      const map: Record<string, number> = {};
      h.filter((e) => e.slug === slug).forEach((e) => {
        if (e.epName) map[e.epName] = watchedFraction(e);
      });
      setEpProgress(map);
    });
  }, [slug]);

  const jumpTo = useCallback((i: number) => {
    setIdx(i);
    setEnded(false);
    epSheetRef.current?.dismiss();
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.55} pressBehavior="close" />
    ),
    [],
  );

  // ---- history: resume position + throttled save -----------------------
  const resumePos = useRef(0);
  const didResume = useRef(false);
  const durationRef = useRef(0);
  const lastSaved = useRef(0);

  // Re-evaluate resume position whenever the episode changes.
  useEffect(() => {
    didResume.current = false;
    resumePos.current = 0;
    lastSaved.current = 0;
    setEnded(false);
    if (!hasUrl || !slug) return;
    getEntry(slug, current.name || undefined).then((e) => {
      if (e?.position && e.position > 5) resumePos.current = e.position;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, current.name, hasUrl]);

  const persist = useCallback(
    (now: number) => {
      if (!hasUrl || !slug) return;
      if (now - lastSaved.current < 5 && !(lastSaved.current === 0 && now > 0)) return;
      lastSaved.current = now;
      saveProgress({
        slug,
        name: name ?? "",
        poster: poster || undefined,
        epName: current.name || undefined,
        url: current.url || undefined,
        embed: current.embed || undefined,
        position: now,
        duration: durationRef.current || undefined,
      });
    },
    [hasUrl, slug, name, poster, current.name, current.url, current.embed],
  );

  const goNext = useCallback(() => {
    if (hasNext) {
      setIdx((i) => i + 1);
      setEnded(false);
    }
  }, [hasNext]);

  const replay = useCallback(() => {
    videoRef.current?.seek(0);
    videoRef.current?.resume();
    setEnded(false);
  }, []);

  const onEnd = useCallback(() => {
    if (hasNext) goNext();
    else setEnded(true);
  }, [hasNext, goNext]);

  const renderPlayer = () => {
    if (hasUrl) {
      return (
        <Video
          ref={videoRef}
          source={{ uri: current.url! }}
          style={{ flex: 1 }}
          controls
          resizeMode={ResizeMode.CONTAIN}
          fullscreenAutorotate
          fullscreenOrientation="all"
          controlsStyles={{ seekIncrementMS: 10000 }}
          progressUpdateInterval={1000}
          preventsDisplaySleepDuringVideoPlayback
          enterPictureInPictureOnLeave
          playInBackground
          onLoad={(e) => {
            durationRef.current = e.duration;
            if (!didResume.current && resumePos.current > 5) {
              didResume.current = true;
              videoRef.current?.seek(resumePos.current);
            }
          }}
          onProgress={(e) => persist(e.currentTime)}
          onEnd={onEnd}
        />
      );
    }
    if (current.embed) {
      return (
        <WebView
          source={{ uri: current.embed }}
          style={{ flex: 1, backgroundColor: "#000" }}
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
        />
      );
    }
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-white/70">{t("movies.noSource")}</Text>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#000" }}>
      <BottomSheetModalProvider>
      <View className="flex-1 bg-black">
      <StatusBar style="light" hidden />
      {renderPlayer()}

      {/* Episodes button (series only) */}
      {hasUrl && isSeries ? (
        <Pressable
          onPress={openEpPanel}
          hitSlop={12}
          style={{ position: "absolute", top: insets.top + 4, right: 10 }}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/45"
        >
          <Ionicons name="list" size={22} color="#fff" />
        </Pressable>
      ) : null}

      {/* Next-episode button (skip forward early) */}
      {hasUrl && hasNext && !ended ? (
        <Pressable
          onPress={goNext}
          style={{ position: "absolute", right: 16, bottom: insets.bottom + 64 }}
          className="flex-row items-center gap-1.5 rounded-full bg-black/60 px-3.5 py-2 active:opacity-70"
        >
          <Ionicons name="play-skip-forward" size={16} color="#fff" />
          <Text className="text-xs font-semibold text-white">{t("movies.nextEpisode")}</Text>
        </Pressable>
      ) : null}

      {/* End overlay: replay */}
      {hasUrl && ended ? (
        <View
          pointerEvents="box-none"
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
          className="items-center justify-center"
        >
          <Pressable
            onPress={replay}
            className="flex-row items-center gap-2 rounded-full bg-black/70 px-5 py-3 active:opacity-70"
          >
            <Ionicons name="refresh" size={22} color="#fff" />
            <Text className="text-base font-semibold text-white">{t("movies.replay")}</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Episode list sheet */}
      <BottomSheetModal
        ref={epSheetRef}
        enableDynamicSizing
        maxDynamicContentSize={height * 0.8}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#12172A" }}
        handleIndicatorStyle={{ backgroundColor: "rgba(255,255,255,0.25)" }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
        >
            <Text className="mb-3 px-1 text-base font-bold text-white">
              {t("movies.episodes")} · {playlist.length}
            </Text>
            <View>
              {playlist.map((ep, i) => {
                const active = i === idx;
                const frac = ep.name ? epProgress[ep.name] ?? 0 : 0;
                return (
                  <Pressable
                    key={`${ep.name}-${i}`}
                    onPress={() => jumpTo(i)}
                    className="mb-2 flex-row items-center gap-3 rounded-xl p-2 active:opacity-70"
                    style={{ backgroundColor: active ? "rgba(29,158,117,0.18)" : "transparent" }}
                  >
                    <View style={{ width: 112, height: 63, borderRadius: 8, overflow: "hidden", backgroundColor: "#000" }}>
                      {epThumb ? (
                        <Image source={{ uri: epThumb }} style={{ width: 112, height: 63 }} contentFit="cover" />
                      ) : null}
                      <View
                        pointerEvents="none"
                        style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.25)" }}
                      >
                        <Ionicons
                          name={active ? "play-circle" : "play-circle-outline"}
                          size={26}
                          color={active ? colors.primarySoft : "rgba(255,255,255,0.9)"}
                        />
                      </View>
                      {frac > 0 ? (
                        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, backgroundColor: "rgba(255,255,255,0.25)" }}>
                          <View style={{ height: 3, width: `${Math.round(frac * 100)}%`, backgroundColor: colors.primary }} />
                        </View>
                      ) : null}
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: active ? colors.primarySoft : "#fff" }}
                        numberOfLines={1}
                      >
                        {episodeLabel(ep.name, t("movies.episodeShort"))}
                      </Text>
                      {frac > 0 ? (
                        <Text className="mt-0.5 text-[11px] text-white/50">{Math.round(frac * 100)}%</Text>
                      ) : null}
                    </View>
                    {active ? <Ionicons name="volume-medium" size={18} color={colors.primarySoft} /> : null}
                  </Pressable>
                );
              })}
            </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
      </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
