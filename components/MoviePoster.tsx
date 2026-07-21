import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";

import { availabilityOf, imageUrl, type OphimMovieListItem } from "@/lib/ophim";
import { colors } from "@/theme/colors";

/** Small pill badge overlaid on a poster corner. */
export function PosterBadge({
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

/**
 * Memoised poster card shared by the discover/search grid and the movies-list
 * screen. Keeping it at module scope + memo avoids remounting every poster on
 * each parent re-render (keystrokes, scroll) — the previous inline versions
 * caused heavy lag / device heat. Pass stable `onPress` + label props.
 */
export const MoviePoster = memo(function MoviePoster({
  item,
  w,
  h,
  onPress,
  trailerLabel,
  cinemaLabel,
}: {
  item: OphimMovieListItem;
  w: number;
  h: number;
  onPress: (slug: string) => void;
  trailerLabel: string;
  cinemaLabel: string;
}) {
  const avail = availabilityOf(item);
  return (
    <Pressable onPress={() => onPress(item.slug)} style={{ width: w }} className="active:opacity-70">
      <View>
        <Image
          source={{ uri: imageUrl(item.poster_url || item.thumb_url) }}
          style={{ width: w, height: h, borderRadius: 12, backgroundColor: colors.glassSurface }}
          contentFit="cover"
          transition={150}
          recyclingKey={item.slug}
        />
        {item.quality ? (
          <PosterBadge label={item.quality} color="rgba(0,0,0,0.7)" position="left" />
        ) : null}
        {avail === "trailer" ? (
          <PosterBadge label={trailerLabel} color={colors.warning} position="right" textColor="#1A1A1A" />
        ) : avail === "cinema" ? (
          <PosterBadge label={cinemaLabel} color={colors.primary} position="right" />
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
});
