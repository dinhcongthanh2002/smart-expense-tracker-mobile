import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import { Ionicons } from "@expo/vector-icons";
import Video, {
  ResizeMode,
  SelectedTrackType,
  SelectedVideoTrackType,
  type AudioTrack,
  type SelectedTrack,
  type SelectedVideoTrack,
  type TextTrack,
  type VideoRef,
  type VideoTrack,
} from "react-native-video";
import { WebView } from "react-native-webview";

import { getEntry, saveProgress } from "@/lib/watch-history";
import { colors } from "@/theme/colors";

/** Human label for a video quality track. */
function qualityLabel(tr: VideoTrack): string {
  if (tr.height) return `${tr.height}p`;
  if (tr.bitrate) return `${Math.round(tr.bitrate / 1000)} kbps`;
  return `#${tr.index}`;
}

function trackLabel(tr: TextTrack | AudioTrack): string {
  return tr.title || tr.language || `#${tr.index}`;
}

export default function WatchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { title, url, embed, slug, name, poster, epName } =
    useLocalSearchParams<{
      title?: string;
      url?: string;
      embed?: string;
      slug?: string;
      name?: string;
      poster?: string;
      epName?: string;
    }>();

  const hasUrl = !!url && url.length > 0;
  const videoRef = useRef<VideoRef>(null);

  // Force landscape while watching; restore portrait lock on exit.
  useEffect(() => {
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE,
    ).catch(() => {});
    return () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      ).catch(() => {});
    };
  }, []);

  // ---- track selection --------------------------------------------------
  const [videoTracks, setVideoTracks] = useState<VideoTrack[]>([]);
  const [textTracks, setTextTracks] = useState<TextTrack[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [selVideo, setSelVideo] = useState<SelectedVideoTrack>({
    type: SelectedVideoTrackType.AUTO,
  });
  const [selText, setSelText] = useState<SelectedTrack>({
    type: SelectedTrackType.DISABLED,
  });
  const [selAudio, setSelAudio] = useState<SelectedTrack | undefined>();
  const [menuOpen, setMenuOpen] = useState(false);
  // The native player controls occupy the same corners as our custom chrome
  // (back / title / settings). Toggle ours off while the native ones show so
  // they never overlap the native close / audio / AirPlay buttons.
  const [nativeControls, setNativeControls] = useState(false);

  const hasConfig =
    videoTracks.length > 1 || textTracks.length > 0 || audioTracks.length > 1;

  // ---- history: resume position + throttled save -----------------------
  const resumePos = useRef(0);
  const didResume = useRef(false);
  const durationRef = useRef(0);
  const lastSaved = useRef(0);

  const loadResume = useCallback(() => {
    if (!hasUrl || !slug) return;
    getEntry(slug, epName || undefined).then((e) => {
      if (e?.position && e.position > 5) resumePos.current = e.position;
    });
  }, [hasUrl, slug, epName]);
  if (!didResume.current && resumePos.current === 0) loadResume();

  const persist = useCallback(
    (now: number) => {
      if (!hasUrl || !slug) return;
      if (now - lastSaved.current < 5 && !(lastSaved.current === 0 && now > 0)) return;
      lastSaved.current = now;
      saveProgress({
        slug,
        name: name ?? "",
        poster: poster || undefined,
        epName: epName || undefined,
        url: url || undefined,
        embed: embed || undefined,
        position: now,
        duration: durationRef.current || undefined,
      });
    },
    [hasUrl, slug, name, poster, epName, url, embed],
  );

  // ---- settings menu rows ----------------------------------------------
  const videoSelected = (index: number | "auto") =>
    index === "auto"
      ? selVideo.type === SelectedVideoTrackType.AUTO
      : selVideo.type === SelectedVideoTrackType.INDEX && selVideo.value === index;
  const textSelected = (index: number | "off") =>
    index === "off"
      ? selText.type === SelectedTrackType.DISABLED
      : selText.type === SelectedTrackType.INDEX && selText.value === index;
  const audioSelected = (index: number) =>
    selAudio?.type === SelectedTrackType.INDEX && selAudio.value === index;

  const renderPlayer = () => {
    if (hasUrl) {
      return (
        <Video
          ref={videoRef}
          source={{ uri: url! }}
          style={{ flex: 1 }}
          controls
          resizeMode={ResizeMode.CONTAIN}
          fullscreenAutorotate
          fullscreenOrientation="all"
          controlsStyles={{ seekIncrementMS: 10000 }}
          progressUpdateInterval={1000}
          onControlsVisibilityChange={(e: { isVisible: boolean }) =>
            setNativeControls(e.isVisible)
          }
          selectedVideoTrack={selVideo}
          selectedTextTrack={selText}
          selectedAudioTrack={selAudio}
          onVideoTracks={(e) => setVideoTracks(e.videoTracks ?? [])}
          onTextTracks={(e) => setTextTracks(e.textTracks ?? [])}
          onAudioTracks={(e) => setAudioTracks(e.audioTracks ?? [])}
          onLoad={(e) => {
            durationRef.current = e.duration;
            if (e.videoTracks?.length) setVideoTracks(e.videoTracks);
            if (e.textTracks?.length) setTextTracks(e.textTracks);
            if (e.audioTracks?.length) setAudioTracks(e.audioTracks);
            if (!didResume.current && resumePos.current > 5) {
              didResume.current = true;
              videoRef.current?.seek(resumePos.current);
            }
          }}
          onProgress={(e) => persist(e.currentTime)}
        />
      );
    }
    if (embed) {
      return (
        <WebView
          source={{ uri: embed }}
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

  // Native controls only exist for the direct-URL player; keep our chrome up
  // for the embed/WebView and whenever the native controls are hidden.
  const showChrome = !hasUrl || !nativeControls;

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" hidden />
      {renderPlayer()}

      {/* Our chrome shares the top corners with the native player controls, so
          only show it while those are hidden (the embed/WebView has no native
          controls, so keep it always visible there). */}
      {showChrome ? (
        <>
          {/* Close the watch screen (native controls have no app-level back). */}
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={{ position: "absolute", top: insets.top + 6, left: 12 }}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/50"
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>

          {title ? (
            <Text
              style={{ position: "absolute", top: insets.top + 12, left: 60, right: 60 }}
              className="text-sm font-semibold text-white/90"
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : null}

          {/* Settings (quality / subtitle / audio) — native controls can't host this. */}
          {hasUrl && hasConfig ? (
            <Pressable
              onPress={() => setMenuOpen(true)}
              hitSlop={12}
              style={{ position: "absolute", top: insets.top + 6, right: 12 }}
              className="h-10 w-10 items-center justify-center rounded-full bg-black/50"
            >
              <Ionicons name="settings-outline" size={20} color="#fff" />
            </Pressable>
          ) : null}
        </>
      ) : null}

      {/* Settings sheet */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
        supportedOrientations={["portrait", "landscape"]}
      >
        <Pressable
          onPress={() => setMenuOpen(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#12172A",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 20,
              paddingTop: 14,
              paddingBottom: insets.bottom + 20,
              maxHeight: "70%",
            }}
          >
            <View className="mb-3 h-1 w-10 self-center rounded-full bg-white/25" />
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Quality */}
              {videoTracks.length > 1 ? (
                <MenuSection title={t("movies.quality")}>
                  <MenuRow
                    label={t("movies.qualityAuto")}
                    selected={videoSelected("auto")}
                    onPress={() => {
                      setSelVideo({ type: SelectedVideoTrackType.AUTO });
                      setMenuOpen(false);
                    }}
                  />
                  {[...videoTracks]
                    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
                    .map((tr) => (
                      <MenuRow
                        key={`v${tr.index}`}
                        label={qualityLabel(tr)}
                        selected={videoSelected(tr.index)}
                        onPress={() => {
                          setSelVideo({ type: SelectedVideoTrackType.INDEX, value: tr.index });
                          setMenuOpen(false);
                        }}
                      />
                    ))}
                </MenuSection>
              ) : null}

              {/* Subtitles */}
              {textTracks.length > 0 ? (
                <MenuSection title={t("movies.subtitle")}>
                  <MenuRow
                    label={t("movies.subtitleOff")}
                    selected={textSelected("off")}
                    onPress={() => {
                      setSelText({ type: SelectedTrackType.DISABLED });
                      setMenuOpen(false);
                    }}
                  />
                  {textTracks.map((tr) => (
                    <MenuRow
                      key={`t${tr.index}`}
                      label={trackLabel(tr)}
                      selected={textSelected(tr.index)}
                      onPress={() => {
                        setSelText({ type: SelectedTrackType.INDEX, value: tr.index });
                        setMenuOpen(false);
                      }}
                    />
                  ))}
                </MenuSection>
              ) : null}

              {/* Audio */}
              {audioTracks.length > 1 ? (
                <MenuSection title={t("movies.audioTrack")}>
                  {audioTracks.map((tr) => (
                    <MenuRow
                      key={`a${tr.index}`}
                      label={trackLabel(tr)}
                      selected={audioSelected(tr.index)}
                      onPress={() => {
                        setSelAudio({ type: SelectedTrackType.INDEX, value: tr.index });
                        setMenuOpen(false);
                      }}
                    />
                  ))}
                </MenuSection>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/50">
        {title}
      </Text>
      {children}
    </View>
  );
}

function MenuRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between py-3 active:opacity-60"
    >
      <Text
        className="text-base"
        style={{ color: selected ? colors.primarySoft : "#fff", fontWeight: selected ? "700" : "400" }}
      >
        {label}
      </Text>
      {selected ? <Ionicons name="checkmark" size={20} color={colors.primarySoft} /> : null}
    </Pressable>
  );
}
