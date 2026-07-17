import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import YoutubePlayer from "react-native-youtube-iframe";

import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import {
  availabilityOf,
  getMovie,
  imageUrl,
  typeKeyOf,
  youtubeId,
  type OphimEpisodeServerData,
  type OphimMovieDetail,
} from "@/lib/ophim";
import {
  getLatestForSlug,
  saveProgress,
  type WatchHistoryEntry,
} from "@/lib/watch-history";
import { colors } from "@/theme/colors";

/** A coloured pill used for status / type badges. */
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: color, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

/** Placeholder actor card (OPhim exposes names only, no photos). */
function ActorCard({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <View style={{ width: 84 }} className="items-center">
      <View
        className="items-center justify-center rounded-full"
        style={{ width: 64, height: 64, backgroundColor: colors.glassSurface }}
      >
        <Text className="text-lg font-bold text-primarySoft">{initials}</Text>
      </View>
      <Text className="mt-1.5 text-center text-[11px] text-muted" numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
}

export default function MovieDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const [movie, setMovie] = useState<OphimMovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState<WatchHistoryEntry | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerError, setTrailerError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getMovie(slug).then((m) => {
      if (alive) {
        setMovie(m);
        setLoading(false);
      }
    });
    getLatestForSlug(slug).then((e) => {
      if (alive && e && (e.position ?? 0) > 5) setResume(e);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  const play = (ep: OphimEpisodeServerData, epName?: string) => {
    const poster = movie?.poster_url || movie?.thumb_url;
    // Seed a history entry so the title shows up under "continue watching"
    // even before the player reports a position.
    saveProgress({
      slug,
      name: movie?.name ?? "",
      originName: movie?.origin_name,
      poster,
      epName,
      url: ep.link_m3u8,
      embed: ep.link_embed,
    });
    router.push({
      pathname: "/watch",
      params: {
        title: `${movie?.name ?? ""}${epName ? " - " + epName : ""}`,
        url: ep.link_m3u8 ?? "",
        embed: ep.link_embed ?? "",
        slug,
        name: movie?.name ?? "",
        poster: poster ?? "",
        epName: epName ?? "",
      },
    });
  };

  const resumeEpName = resume?.epName || undefined;
  const firstEp = movie?.episodes?.[0]?.server_data?.[0];

  if (loading) {
    return (
      <Screen className="items-center justify-center" orbs={false}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }
  if (!movie) {
    return (
      <Screen className="items-center justify-center px-5" orbs={false}>
        <Pressable onPress={() => router.back()} className="absolute left-4 top-2">
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
        <Text className="text-muted">{t("movies.noResults")}</Text>
      </Screen>
    );
  }

  const availability = availabilityOf(movie);
  const typeKey = typeKeyOf(movie.type);
  const hasSource = !!(firstEp?.link_m3u8 || firstEp?.link_embed);
  const trailerId = youtubeId(movie.trailer_url);
  const hasTrailer = !!trailerId;
  const openTrailerExternal = () => {
    if (trailerId) Linking.openURL(`https://www.youtube.com/watch?v=${trailerId}`);
  };

  const meta = [
    movie.year,
    movie.quality,
    movie.time,
    movie.lang,
    movie.imdb?.vote_average ? `IMDb ${movie.imdb.vote_average}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  const actors = movie.actor?.filter(Boolean) ?? [];

  return (
    <Screen orbs={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Backdrop — plays the trailer inline when tapped */}
        <View style={{ height: 220, backgroundColor: "#000" }}>
          {showTrailer && trailerId ? (
            <>
              {trailerError ? (
                // Video owner disabled embedding — offer to open YouTube.
                <View className="flex-1 items-center justify-center gap-3 px-6">
                  <Text className="text-center text-sm text-white/80">
                    {t("movies.trailerBlocked")}
                  </Text>
                  <Pressable
                    onPress={openTrailerExternal}
                    className="flex-row items-center gap-2 rounded-full bg-white/15 px-4 py-2.5 active:opacity-70"
                  >
                    <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                    <Text className="text-sm font-semibold text-white">
                      {t("movies.openYoutube")}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <YoutubePlayer
                  height={220}
                  width={width}
                  play
                  videoId={trailerId}
                  onError={() => setTrailerError(true)}
                  initialPlayerParams={{ modestbranding: true, rel: false }}
                  webViewProps={{ allowsInlineMediaPlayback: true }}
                />
              )}
              <Pressable
                onPress={() => {
                  setShowTrailer(false);
                  setTrailerError(false);
                }}
                hitSlop={10}
                className="absolute right-4 top-3 h-10 w-10 items-center justify-center rounded-full bg-black/50"
              >
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
            </>
          ) : (
            <>
              <Image
                source={{ uri: imageUrl(movie.thumb_url || movie.poster_url) }}
                style={{ width: "100%", height: 220 }}
                contentFit="cover"
              />
              <LinearGradient
                colors={["transparent", colors.background]}
                style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 120 }}
              />
              {hasTrailer ? (
                <Pressable
                  onPress={() => setShowTrailer(true)}
                  className="absolute inset-0 items-center justify-center active:opacity-80"
                >
                  <View className="flex-row items-center gap-2 rounded-full bg-black/55 px-4 py-2.5">
                    <Ionicons name="play-circle" size={26} color="#fff" />
                    <Text className="text-sm font-semibold text-white">
                      {t("movies.watchTrailer")}
                    </Text>
                  </View>
                </Pressable>
              ) : null}
            </>
          )}
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="absolute left-4 top-3 h-10 w-10 items-center justify-center rounded-full bg-black/40"
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
        </View>

        <View className="px-5">
          <View className="-mt-12 flex-row gap-3">
            <Image
              source={{ uri: imageUrl(movie.poster_url || movie.thumb_url) }}
              style={{ width: 92, height: 138, borderRadius: 10, backgroundColor: colors.glassSurface }}
              contentFit="cover"
            />
            <View className="flex-1 justify-end pb-1">
              <Text className="text-xl font-bold text-ink" numberOfLines={3}>
                {movie.name}
              </Text>
              {movie.origin_name ? (
                <Text className="text-xs text-muted" numberOfLines={1}>
                  {movie.origin_name}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Status / type badges */}
          <View className="mt-3 flex-row flex-wrap items-center gap-2">
            {availability === "cinema" ? (
              <Badge label={t("movies.badgeCinema")} color={colors.primary} />
            ) : null}
            {availability === "trailer" ? (
              <Badge label={t("movies.badgeTrailer")} color={colors.warning} />
            ) : movie.status === "ongoing" ? (
              <Badge label={t("movies.badgeOngoing")} color={colors.transfer} />
            ) : movie.status === "completed" ? (
              <Badge label={t("movies.badgeCompleted")} color={colors.income} />
            ) : null}
            {typeKey ? <Badge label={t(`movies.type.${typeKey}`)} color={colors.glassSurface} /> : null}
            {movie.episode_current && availability !== "trailer" ? (
              <Badge label={movie.episode_current} color={colors.glassSurface} />
            ) : null}
          </View>

          {meta ? <Text className="mt-3 text-xs text-muted">{meta}</Text> : null}

          {/* Categories */}
          {movie.category?.length ? (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {movie.category.map((c) => (
                <View key={c.slug} className="rounded-full bg-glass-light px-3 py-1">
                  <Text className="text-[11px] text-muted">{c.name}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Watch button (trailer is played inline from the backdrop) */}
          <View className="mt-5">
            {hasSource ? (
              <Button
                title={resume ? t("movies.resume") : t("movies.watch")}
                onPress={() => {
                  // Resume the exact episode when we have one, else first.
                  if (resume && resumeEpName) {
                    const ep = findEpisode(movie, resumeEpName);
                    if (ep) return play(ep, resumeEpName);
                  }
                  if (firstEp) play(firstEp, movie.episodes?.[0]?.server_data?.length && movie.episodes[0].server_data.length > 1 ? firstEp.name : undefined);
                }}
                leftIcon={<Ionicons name="play" size={18} color="#fff" />}
              />
            ) : (
              <Text className="text-sm text-muted">{t("movies.onlyTrailer")}</Text>
            )}
          </View>

          {/* Content */}
          {movie.content ? (
            <>
              <Text className="mb-1 mt-6 text-base font-bold text-ink">{t("movies.content")}</Text>
              <Text className="text-sm leading-6 text-muted">
                {movie.content.replace(/<[^>]+>/g, "")}
              </Text>
            </>
          ) : null}

          {/* Cast (names only — OPhim has no actor photos) */}
          {actors.length ? (
            <>
              <Text className="mb-2 mt-6 text-base font-bold text-ink">{t("movies.cast")}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 14, paddingRight: 8 }}
              >
                {actors.slice(0, 20).map((a, i) => (
                  <ActorCard key={a + i} name={a} />
                ))}
              </ScrollView>
            </>
          ) : null}

          {movie.director?.filter(Boolean).length ? (
            <Text className="mt-4 text-sm text-muted">
              <Text className="font-semibold text-ink">{t("movies.director")}: </Text>
              {movie.director.filter(Boolean).join(", ")}
            </Text>
          ) : null}

          {/* Episodes (series) */}
          {movie.episodes?.map((server) =>
            server.server_data.length > 1 ? (
              <View key={server.server_name} className="mt-6">
                <Text className="mb-2 text-base font-bold text-ink">
                  {t("movies.episodes")} · {server.server_name}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {server.server_data.map((ep) => {
                    const active = resumeEpName === ep.name;
                    return (
                      <Pressable
                        key={ep.slug + ep.name}
                        onPress={() => play(ep, ep.name)}
                        className="rounded-lg px-3.5 py-2 active:opacity-70"
                        style={{
                          backgroundColor: active ? colors.primary : colors.glassSurface,
                        }}
                      >
                        <Text
                          className="text-sm font-medium"
                          style={{ color: active ? "#fff" : colors.ink }}
                        >
                          {ep.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null,
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

/** Find an episode by its display name across all servers. */
function findEpisode(
  movie: OphimMovieDetail,
  epName: string,
): OphimEpisodeServerData | undefined {
  for (const server of movie.episodes ?? []) {
    const ep = server.server_data.find((e) => e.name === epName);
    if (ep) return ep;
  }
  return undefined;
}
