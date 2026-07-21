import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";

import { Screen } from "@/components/ui/Screen";
import { MoviePoster } from "@/components/MoviePoster";
import { useThemePalette } from "@/lib/theme";
import {
  getCountries,
  getGenreMovies,
  getGenres,
  getMovieList,
  sortByNewest,
  type ListFilters,
  type MovieSort,
  type OphimCategory,
  type OphimMovieListItem,
} from "@/lib/ophim";
import { colors } from "@/theme/colors";

const COLS = 3;
const GAP = 12;
const YEARS = Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - i);

export default function MoviesListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { scheme } = useThemePalette();
  const sheetRef = useRef<BottomSheetModal>(null);
  const { source, slug, title, sort, year: yearParam } = useLocalSearchParams<{
    source?: string; // "list" | "genre"
    slug?: string;
    title?: string;
    sort?: string; // "hot" | "newest"
    year?: string; // pre-selected year filter
  }>();
  const isGenreSource = source === "genre";

  // ---- active filters ---------------------------------------------------
  const [sortBy, setSortBy] = useState<MovieSort>(sort === "hot" ? "hot" : "newest");
  const [category, setCategory] = useState(""); // genre slug (list source only)
  const [country, setCountry] = useState("");
  const [year, setYear] = useState(yearParam ? Number(yearParam) : 0);
  const filters: ListFilters = useMemo(
    () => ({
      sort: sortBy,
      category: category || undefined,
      country: country || undefined,
      year: year || undefined,
    }),
    [sortBy, category, country, year],
  );
  const activeCount =
    (sortBy !== "newest" ? 1 : 0) + (category ? 1 : 0) + (country ? 1 : 0) + (year ? 1 : 0);

  // ---- filter option lists ---------------------------------------------
  const [genres, setGenres] = useState<OphimCategory[]>([]);
  const [countries, setCountries] = useState<OphimCategory[]>([]);
  useEffect(() => {
    if (!isGenreSource) getGenres().then(setGenres);
    getCountries().then(setCountries);
  }, [isGenreSource]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.6} pressBehavior="close" />
    ),
    [],
  );

  // ---- data -------------------------------------------------------------
  const [items, setItems] = useState<OphimMovieListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const page = useRef(1);
  const hasMore = useRef(false);
  const skipClientSort = sortBy !== "newest";

  const posterW = (width - 40 - GAP * (COLS - 1)) / COLS;
  const posterH = posterW * 1.5;

  const openMovie = useCallback(
    (s: string) => router.push({ pathname: "/movie/[slug]", params: { slug: s } }),
    [router],
  );
  const trailerLabel = t("movies.badgeTrailer");
  const cinemaLabel = t("movies.badgeCinema");

  const fetchPage = useCallback(
    (p: number) =>
      isGenreSource
        ? getGenreMovies(slug || "", p, filters)
        : getMovieList(slug || "", p, filters),
    [isGenreSource, slug, filters],
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    page.current = 1;
    fetchPage(1).then((res) => {
      if (!alive) return;
      setItems(skipClientSort ? res.items : sortByNewest(res.items));
      hasMore.current = res.hasMore;
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [fetchPage, skipClientSort]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore.current) return;
    setLoadingMore(true);
    const next = page.current + 1;
    const res = await fetchPage(next);
    page.current = next;
    hasMore.current = res.hasMore;
    setItems((prev) => {
      const seen = new Set(prev.map((m) => m.slug));
      const merged = [...prev, ...res.items.filter((m) => !seen.has(m.slug))];
      return skipClientSort ? merged : sortByNewest(merged);
    });
    setLoadingMore(false);
  }, [loading, loadingMore, fetchPage, skipClientSort]);

  const resetFilters = () => {
    setSortBy("newest");
    setCategory("");
    setCountry("");
    setYear(0);
  };

  const renderItem = useCallback(
    ({ item }: { item: OphimMovieListItem }) => (
      <View style={{ marginBottom: 16 }}>
        <MoviePoster
          item={item}
          w={posterW}
          h={posterH}
          onPress={openMovie}
          trailerLabel={trailerLabel}
          cinemaLabel={cinemaLabel}
        />
      </View>
    ),
    [posterW, posterH, openMovie, trailerLabel, cinemaLabel],
  );

  return (
    <Screen className="px-5" orbs={false}>
      <View className="mb-3 mt-2 flex-row items-center gap-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-glass-light active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Text className="flex-1 text-2xl font-bold text-ink" numberOfLines={1}>
          {title || t("movies.title")}
        </Text>
        <Pressable
          onPress={() => sheetRef.current?.present()}
          hitSlop={8}
          className="h-9 flex-row items-center gap-1.5 rounded-full bg-glass-light px-3 active:opacity-70"
        >
          <Ionicons name="options-outline" size={18} color={activeCount ? colors.primary : colors.ink} />
          <Text className="text-sm font-medium" style={{ color: activeCount ? colors.primary : colors.ink }}>
            {t("movies.filter.title")}{activeCount ? ` (${activeCount})` : ""}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator className="mt-10" color={colors.primary} />
      ) : items.length === 0 ? (
        <View className="mt-16 items-center">
          <Ionicons name="film-outline" size={44} color={colors.muted} />
          <Text className="mt-3 text-center text-muted">{t("movies.noResults")}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m, i) => m.slug + i}
          renderItem={renderItem}
          numColumns={COLS}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          removeClippedSubviews
          initialNumToRender={9}
          maxToRenderPerBatch={9}
          windowSize={7}
          ListFooterComponent={loadingMore ? <ActivityIndicator className="my-4" color={colors.primary} /> : null}
        />
      )}

      {/* Filter sheet */}
      <BottomSheetModal
        key={scheme}
        ref={sheetRef}
        enableDynamicSizing
        maxDynamicContentSize={height * 0.85}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.glassBorder }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-2 flex-row items-center justify-between pt-1">
            <Text className="text-lg font-bold text-ink">{t("movies.filter.title")}</Text>
            <Pressable onPress={resetFilters} hitSlop={8}>
              <Text className="text-sm font-medium text-primarySoft">{t("movies.filter.reset")}</Text>
            </Pressable>
          </View>

          {/* Sort */}
          <FilterGroup title={t("movies.filter.sort")}>
            <Chip label={t("movies.filter.sortNewest")} active={sortBy === "newest"} onPress={() => setSortBy("newest")} />
            <Chip label={t("movies.filter.sortHot")} active={sortBy === "hot"} onPress={() => setSortBy("hot")} />
            <Chip label={t("movies.filter.sortYear")} active={sortBy === "year"} onPress={() => setSortBy("year")} />
          </FilterGroup>

          {/* Genre (list source only) */}
          {!isGenreSource && genres.length > 0 ? (
            <FilterGroup title={t("movies.filter.genre")}>
              <Chip label={t("movies.filter.all")} active={!category} onPress={() => setCategory("")} />
              {genres.map((g) => (
                <Chip key={g.slug} label={g.name} active={category === g.slug} onPress={() => setCategory(g.slug)} />
              ))}
            </FilterGroup>
          ) : null}

          {/* Country */}
          {countries.length > 0 ? (
            <FilterGroup title={t("movies.filter.country")}>
              <Chip label={t("movies.filter.all")} active={!country} onPress={() => setCountry("")} />
              {countries.map((c) => (
                <Chip key={c.slug} label={c.name} active={country === c.slug} onPress={() => setCountry(c.slug)} />
              ))}
            </FilterGroup>
          ) : null}

          {/* Year */}
          <FilterGroup title={t("movies.filter.year")}>
            <Chip label={t("movies.filter.all")} active={!year} onPress={() => setYear(0)} />
            {YEARS.map((y) => (
              <Chip key={y} label={String(y)} active={year === y} onPress={() => setYear(y)} />
            ))}
          </FilterGroup>

          <Pressable
            onPress={() => sheetRef.current?.dismiss()}
            className="mt-2 items-center rounded-2xl bg-primary py-3.5 active:opacity-80"
          >
            <Text className="text-base font-bold text-white">{t("movies.filter.apply")}</Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </Screen>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-muted">{title}</Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full px-3.5 py-2 active:opacity-70"
      style={{ backgroundColor: active ? colors.primary : colors.glassSurface }}
    >
      <Text className="text-[13px] font-medium" style={{ color: active ? "#fff" : colors.ink }}>
        {label}
      </Text>
    </Pressable>
  );
}
