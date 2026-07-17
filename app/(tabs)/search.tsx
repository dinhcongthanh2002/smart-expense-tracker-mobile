import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { Screen } from "@/components/ui/Screen";
import {
  availabilityOf,
  getCinemaMovies,
  imageUrl,
  searchMovies,
  type OphimMovieListItem,
} from "@/lib/ophim";
import {
  getHistory,
  watchedFraction,
  type WatchHistoryEntry,
} from "@/lib/watch-history";
import { colors } from "@/theme/colors";

const COLS = 3;
const GAP = 12;

/** Small pill badge shown on top of a poster. */
function PosterBadge({
  label,
  color,
  position,
}: {
  label: string;
  color: string;
  position: "left" | "right";
}) {
  return (
    <View
      style={{
        position: "absolute",
        top: 6,
        [position]: 6,
        backgroundColor: color,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
      }}
    >
      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

export default function SearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [cinema, setCinema] = useState<OphimMovieListItem[]>([]);
  const [results, setResults] = useState<OphimMovieListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false); // true = showing search results
  const [history, setHistory] = useState<WatchHistoryEntry[]>([]);

  // Pagination bookkeeping for each mode.
  const cinemaPage = useRef(1);
  const cinemaHasMore = useRef(false);
  const resultsPage = useRef(1);
  const resultsHasMore = useRef(false);
  const reqId = useRef(0);

  const posterW = (width - 40 - GAP * (COLS - 1)) / COLS;
  const posterH = posterW * 1.5;

  // Default: latest cinema movies (page 1).
  useEffect(() => {
    let alive = true;
    setLoading(true);
    cinemaPage.current = 1;
    getCinemaMovies(1).then((res) => {
      if (!alive) return;
      setCinema(res.items);
      cinemaHasMore.current = res.hasMore;
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Refresh "continue watching" whenever the tab regains focus.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getHistory().then((h) => {
        if (alive) setHistory(h.filter((e) => watchedFraction(e) > 0.02));
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const doSearch = useCallback(async (kw: string) => {
    const trimmed = kw.trim();
    if (trimmed.length < 2) {
      setSearching(false);
      return;
    }
    const id = ++reqId.current;
    setSearching(true);
    setLoading(true);
    resultsPage.current = 1;
    const res = await searchMovies(trimmed, 1);
    if (id === reqId.current) {
      setResults(res.items);
      resultsHasMore.current = res.hasMore;
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore) return;
    if (searching) {
      if (!resultsHasMore.current) return;
      setLoadingMore(true);
      const next = resultsPage.current + 1;
      const res = await searchMovies(query.trim(), next);
      resultsPage.current = next;
      resultsHasMore.current = res.hasMore;
      setResults((prev) => dedupe(prev, res.items));
      setLoadingMore(false);
    } else {
      if (!cinemaHasMore.current) return;
      setLoadingMore(true);
      const next = cinemaPage.current + 1;
      const res = await getCinemaMovies(next);
      cinemaPage.current = next;
      cinemaHasMore.current = res.hasMore;
      setCinema((prev) => dedupe(prev, res.items));
      setLoadingMore(false);
    }
  }, [loading, loadingMore, searching, query]);

  const onChange = (v: string) => {
    setQuery(v);
    if (v.trim().length === 0) setSearching(false);
  };

  const list = searching ? results : cinema;

  const openMovie = (slug: string) =>
    router.push({ pathname: "/movie/[slug]", params: { slug } });

  const renderItem = ({ item }: { item: OphimMovieListItem }) => {
    const avail = availabilityOf(item);
    return (
      <Pressable
        onPress={() => openMovie(item.slug)}
        style={{ width: posterW, marginBottom: 16 }}
        className="active:opacity-70"
      >
        <View>
          <Image
            source={{ uri: imageUrl(item.poster_url || item.thumb_url) }}
            style={{
              width: posterW,
              height: posterH,
              borderRadius: 12,
              backgroundColor: colors.glassSurface,
            }}
            contentFit="cover"
            transition={200}
          />
          {item.quality ? (
            <PosterBadge label={item.quality} color="rgba(0,0,0,0.7)" position="left" />
          ) : null}
          {avail === "trailer" ? (
            <PosterBadge label={t("movies.badgeTrailer")} color={colors.warning} position="right" />
          ) : avail === "cinema" ? (
            <PosterBadge label={t("movies.badgeCinema")} color={colors.primary} position="right" />
          ) : null}
        </View>
        <Text className="mt-1.5 text-[13px] font-semibold text-ink" numberOfLines={2}>
          {item.name}
        </Text>
        <Text className="text-[11px] text-muted" numberOfLines={1}>
          {item.origin_name || (item.year ? String(item.year) : "")}
        </Text>
      </Pressable>
    );
  };

  const ListHeader = () => {
    if (searching) return null;
    return (
      <View>
        {history.length > 0 ? (
          <View className="mb-5">
            <Text className="mb-2 ml-1 text-base font-bold text-ink">
              {t("movies.continueWatching")}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {history.map((e) => {
                const frac = watchedFraction(e);
                return (
                  <Pressable
                    key={e.slug + (e.epName || "")}
                    onPress={() => openMovie(e.slug)}
                    style={{ width: 116 }}
                    className="active:opacity-70"
                  >
                    <Image
                      source={{ uri: imageUrl(e.poster) }}
                      style={{ width: 116, height: 174, borderRadius: 10, backgroundColor: colors.glassSurface }}
                      contentFit="cover"
                    />
                    <View
                      style={{
                        height: 3,
                        borderRadius: 2,
                        marginTop: 4,
                        backgroundColor: colors.glassSurface,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: 3,
                          width: `${Math.round(frac * 100)}%`,
                          backgroundColor: colors.primary,
                        }}
                      />
                    </View>
                    <Text className="mt-1 text-[12px] font-medium text-ink" numberOfLines={1}>
                      {e.name}
                    </Text>
                    {e.epName ? (
                      <Text className="text-[10px] text-muted" numberOfLines={1}>
                        {e.epName}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
        <Text className="mb-2 ml-1 text-base font-bold text-ink">
          {t("movies.cinemaLatest")}
        </Text>
      </View>
    );
  };

  return (
    <Screen className="px-5" orbs={false}>
      <Text className="mb-3 mt-2 text-2xl font-bold text-ink">{t("movies.title")}</Text>

      <View className="mb-4 flex-row items-center gap-2 rounded-2xl bg-glass-light px-3.5">
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={onChange}
          onSubmitEditing={() => doSearch(query)}
          placeholder={t("movies.searchPlaceholder")}
          placeholderTextColor={colors.muted}
          className="flex-1 py-3 text-base text-ink"
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 ? (
          <Pressable
            onPress={() => {
              setQuery("");
              setSearching(false);
            }}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator className="mt-10" color={colors.primary} />
      ) : list.length === 0 ? (
        <View className="mt-16 items-center">
          <Ionicons name="film-outline" size={44} color={colors.muted} />
          <Text className="mt-3 text-center text-muted">{t("movies.noResults")}</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(m, i) => m.slug + i}
          renderItem={renderItem}
          numColumns={COLS}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          ListHeaderComponent={ListHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator className="my-4" color={colors.primary} />
            ) : null
          }
        />
      )}
    </Screen>
  );
}

/** Append new items, skipping slugs already present. */
function dedupe(
  prev: OphimMovieListItem[],
  next: OphimMovieListItem[],
): OphimMovieListItem[] {
  const seen = new Set(prev.map((m) => m.slug));
  return [...prev, ...next.filter((m) => !seen.has(m.slug))];
}
