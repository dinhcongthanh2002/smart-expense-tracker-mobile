import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  getGenres,
  getMovieList,
  imageUrl,
  searchMovies,
  sortByNewest,
  type OphimCategory,
  type OphimMovieListItem,
} from "@/lib/ophim";
import {
  clearHistory,
  getHistory,
  removeFromHistory,
  watchedFraction,
  type WatchHistoryEntry,
} from "@/lib/watch-history";
import { colors } from "@/theme/colors";

const COLS = 3;
const GAP = 12;
const CARD_W = 116;
const CARD_H = 174;

// Discover rows. `hot` rows are sorted by view count (most-watched first);
// the rest use the default newest-first order. `key` is unique because a slug
// can appear twice (e.g. phim-moi-cap-nhat as both "trending" and "new").
const SECTIONS: { key: string; slug: string; titleKey: string; hot?: boolean }[] = [
  { key: "trending", slug: "phim-moi-cap-nhat", titleKey: "movies.discover.trending", hot: true },
  { key: "blockbuster", slug: "phim-le", titleKey: "movies.discover.blockbuster", hot: true },
  { key: "new", slug: "phim-moi-cap-nhat", titleKey: "movies.discover.new" },
  { key: "cinema", slug: "phim-chieu-rap", titleKey: "movies.discover.cinema" },
  { key: "single", slug: "phim-le", titleKey: "movies.discover.single" },
  { key: "series", slug: "phim-bo", titleKey: "movies.discover.series" },
  { key: "anime", slug: "hoat-hinh", titleKey: "movies.discover.anime" },
  { key: "tv-shows", slug: "tv-shows", titleKey: "movies.discover.tvshows" },
];

/** Small pill badge on a poster. */
function PosterBadge({
  label,
  color,
  position,
  textColor = "#fff",
}: {
  label: string;
  color: string;
  position: "left" | "right";
  textColor?: string;
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
      <Text style={{ color: textColor, fontSize: 10, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

export default function SearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [sections, setSections] = useState<Record<string, OphimMovieListItem[]>>({});
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [genres, setGenres] = useState<OphimCategory[]>([]);
  const [results, setResults] = useState<OphimMovieListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false); // true = showing search results
  const [history, setHistory] = useState<WatchHistoryEntry[]>([]);

  const resultsPage = useRef(1);
  const resultsHasMore = useRef(false);
  const reqId = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const posterW = (width - 40 - GAP * (COLS - 1)) / COLS;
  const posterH = posterW * 1.5;

  // Load all discover rows (page 1 each) in parallel.
  useEffect(() => {
    let alive = true;
    setSectionsLoading(true);
    Promise.all(
      SECTIONS.map((s) => getMovieList(s.slug, 1, s.hot ? { sort: "hot" } : undefined)),
    ).then((res) => {
      if (!alive) return;
      const map: Record<string, OphimMovieListItem[]> = {};
      SECTIONS.forEach((s, i) => {
        map[s.key] = res[i].items;
      });
      setSections(map);
      setSectionsLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Genre chips.
  useEffect(() => {
    let alive = true;
    getGenres().then((g) => {
      if (alive) setGenres(g);
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
      setResults(sortByNewest(res.items));
      resultsHasMore.current = res.hasMore;
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!searching || loading || loadingMore || !resultsHasMore.current) return;
    setLoadingMore(true);
    const next = resultsPage.current + 1;
    const res = await searchMovies(query.trim(), next);
    resultsPage.current = next;
    resultsHasMore.current = res.hasMore;
    setResults((prev) => sortByNewest(dedupe(prev, res.items)));
    setLoadingMore(false);
  }, [searching, loading, loadingMore, query]);

  // Debounced live search — no need to press Enter.
  const onChange = (v: string) => {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = v.trim();
    if (trimmed.length === 0) {
      setSearching(false);
      return;
    }
    if (trimmed.length < 2) return;
    debounceRef.current = setTimeout(() => doSearch(v), 400);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const openMovie = (slug: string) =>
    router.push({ pathname: "/movie/[slug]", params: { slug } });
  const openList = (slug: string, title: string, hot?: boolean) =>
    router.push({
      pathname: "/movies-list",
      params: { source: "list", slug, title, sort: hot ? "hot" : "newest" },
    });
  const openGenre = (g: OphimCategory) =>
    router.push({ pathname: "/movies-list", params: { source: "genre", slug: g.slug, title: g.name } });

  const removeContinue = (e: WatchHistoryEntry) => {
    removeFromHistory(e.slug, e.epName || undefined);
    setHistory((prev) =>
      prev.filter((x) => !(x.slug === e.slug && (x.epName || "") === (e.epName || ""))),
    );
  };
  const clearContinue = () => {
    Alert.alert(t("movies.continueWatching"), t("movies.clearWatchingConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("movies.clearWatching"),
        style: "destructive",
        onPress: () => {
          clearHistory();
          setHistory([]);
        },
      },
    ]);
  };

  // Poster used both in the search grid (dynamic width) and rows (fixed width).
  const Poster = ({ item, w, h }: { item: OphimMovieListItem; w: number; h: number }) => {
    const avail = availabilityOf(item);
    return (
      <Pressable onPress={() => openMovie(item.slug)} style={{ width: w }} className="active:opacity-70">
        <View>
          <Image
            source={{ uri: imageUrl(item.poster_url || item.thumb_url) }}
            style={{ width: w, height: h, borderRadius: 12, backgroundColor: colors.glassSurface }}
            contentFit="cover"
            transition={200}
          />
          {item.quality ? (
            <PosterBadge label={item.quality} color="rgba(0,0,0,0.7)" position="left" />
          ) : null}
          {avail === "trailer" ? (
            <PosterBadge label={t("movies.badgeTrailer")} color={colors.warning} position="right" textColor="#1A1A1A" />
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

  const renderGridItem = ({ item }: { item: OphimMovieListItem }) => (
    <View style={{ marginBottom: 16 }}>
      <Poster item={item} w={posterW} h={posterH} />
    </View>
  );

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
          <Pressable onPress={() => { setQuery(""); setSearching(false); }} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {searching ? (
        loading ? (
          <ActivityIndicator className="mt-10" color={colors.primary} />
        ) : results.length === 0 ? (
          <View className="mt-16 items-center">
            <Ionicons name="film-outline" size={44} color={colors.muted} />
            <Text className="mt-3 text-center text-muted">{t("movies.noResults")}</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(m, i) => m.slug + i}
            renderItem={renderGridItem}
            numColumns={COLS}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loadingMore ? <ActivityIndicator className="my-4" color={colors.primary} /> : null}
          />
        )
      ) : (
        // Discover view
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {history.length > 0 ? (
            <View className="mb-5">
              <View className="mb-2 ml-1 flex-row items-center justify-between pr-1">
                <Text className="text-base font-bold text-ink">
                  {t("movies.continueWatching")}
                </Text>
                <Pressable onPress={clearContinue} hitSlop={8} className="active:opacity-60">
                  <Text className="text-xs font-medium text-muted">{t("movies.clearWatching")}</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {history.map((e) => {
                  const frac = watchedFraction(e);
                  return (
                    <Pressable
                      key={e.slug + (e.epName || "")}
                      onPress={() => openMovie(e.slug)}
                      style={{ width: CARD_W }}
                      className="active:opacity-70"
                    >
                      <View>
                        <Image
                          source={{ uri: imageUrl(e.poster) }}
                          style={{ width: CARD_W, height: CARD_H, borderRadius: 10, backgroundColor: colors.glassSurface }}
                          contentFit="cover"
                        />
                        <Pressable
                          onPress={() => removeContinue(e)}
                          hitSlop={8}
                          style={{ position: "absolute", top: 4, right: 4 }}
                          className="h-6 w-6 items-center justify-center rounded-full bg-black/60 active:opacity-70"
                        >
                          <Ionicons name="close" size={14} color="#fff" />
                        </Pressable>
                      </View>
                      <View style={{ height: 3, borderRadius: 2, marginTop: 4, backgroundColor: colors.glassSurface, overflow: "hidden" }}>
                        <View style={{ height: 3, width: `${Math.round(frac * 100)}%`, backgroundColor: colors.primary }} />
                      </View>
                      <Text className="mt-1 text-[12px] font-medium text-ink" numberOfLines={1}>
                        {e.name}
                      </Text>
                      {e.epName ? (
                        <Text className="text-[10px] text-muted" numberOfLines={1}>{e.epName}</Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* Genre chips */}
          {genres.length > 0 ? (
            <View className="mb-6">
              <Text className="mb-2 ml-1 text-base font-bold text-ink">{t("movies.genresTitle")}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {genres.map((g) => (
                  <Pressable
                    key={g.slug}
                    onPress={() => openGenre(g)}
                    className="rounded-full bg-glass-light px-4 py-2 active:opacity-70"
                  >
                    <Text className="text-[13px] font-medium text-ink">{g.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {sectionsLoading ? (
            <ActivityIndicator className="mt-10" color={colors.primary} />
          ) : (
            SECTIONS.map((s) => {
              const items = sections[s.key] ?? [];
              if (items.length === 0) return null;
              return (
                <View key={s.key} className="mb-6">
                  <Pressable
                    onPress={() => openList(s.slug, t(s.titleKey), s.hot)}
                    className="mb-2 ml-1 flex-row items-center justify-between pr-1 active:opacity-70"
                  >
                    <Text className="text-base font-bold text-ink">{t(s.titleKey)}</Text>
                    <View className="flex-row items-center gap-0.5">
                      <Text className="text-xs font-medium text-primarySoft">{t("movies.seeAll")}</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.primarySoft} />
                    </View>
                  </Pressable>
                  <FlatList
                    data={items}
                    keyExtractor={(m, i) => m.slug + i}
                    renderItem={({ item }) => <Poster item={item} w={CARD_W} h={CARD_H} />}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                  />
                </View>
              );
            })
          )}
        </ScrollView>
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
