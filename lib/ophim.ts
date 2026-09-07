// OPhim-compatible public movie API client (no auth). KKPhim/phimapi.com serves
// the exact same JSON shape as OPhim; the old ophim1.com API was retired (404).
const BASE = "https://phimapi.com";
// Relative image paths from the API get this CDN prefix (phimapi hosts on phimimg).
const CDN_IMAGE = "https://phimimg.com";

export interface OphimMovieListItem {
  _id?: string;
  name: string;
  slug: string;
  origin_name?: string;
  thumb_url?: string;
  poster_url?: string;
  year?: number;
  type?: string;
  quality?: string;
  lang?: string;
  time?: string;
  episode_current?: string;
  chieurap?: boolean;
  sub_docquyen?: boolean;
  modified?: { time?: string };
}

/** Sort a list newest-first by `modified.time` (falls back to year). */
export function sortByNewest(items: OphimMovieListItem[]): OphimMovieListItem[] {
  const ts = (m: OphimMovieListItem) =>
    (m.modified?.time ? Date.parse(m.modified.time) : 0) || (m.year ?? 0);
  return [...items].sort((a, b) => ts(b) - ts(a));
}

export interface OphimPagination {
  totalItems: number;
  totalItemsPerPage: number;
  currentPage: number;
  pageRanges?: number;
}

export interface OphimPagedResult {
  items: OphimMovieListItem[];
  pagination?: OphimPagination;
  /** True when there is at least one more page after the requested one. */
  hasMore: boolean;
}

/** Compute whether more pages exist from a pagination block. */
function computeHasMore(p?: OphimPagination): boolean {
  if (!p || !p.totalItems || !p.totalItemsPerPage) return false;
  const totalPages = Math.ceil(p.totalItems / p.totalItemsPerPage);
  return p.currentPage < totalPages;
}

export interface OphimEpisodeServerData {
  name: string;
  slug: string;
  filename?: string;
  link_embed?: string;
  link_m3u8?: string;
}

export interface OphimEpisodeServer {
  server_name: string;
  server_data: OphimEpisodeServerData[];
}

export interface OphimCategory {
  name: string;
  slug: string;
}

export interface OphimMovieDetail {
  _id?: string;
  name: string;
  slug: string;
  origin_name?: string;
  content?: string;
  type?: string; // "single" | "series" | "hoathinh" | "tvshows"
  status?: string; // "completed" | "ongoing" | "trailer"
  thumb_url?: string;
  poster_url?: string;
  trailer_url?: string;
  time?: string;
  episode_current?: string;
  episode_total?: string;
  quality?: string;
  lang?: string;
  year?: number;
  view?: number;
  chieurap?: boolean;
  sub_docquyen?: boolean;
  actor?: string[];
  director?: string[];
  category?: OphimCategory[];
  country?: OphimCategory[];
  episodes?: OphimEpisodeServer[];
  imdb?: { vote_average?: number };
  tmdb?: { vote_average?: number };
}

/**
 * Turn an OPhim image path into an absolute CDN url. The API returns either a
 * full URL, a path (uploads/movies/...), or just a filename — filenames live
 * under /uploads/movies/.
 */
export function imageUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  const clean = path.replace(/^\/+/, "");
  const withDir = clean.includes("/") ? clean : `uploads/movies/${clean}`;
  return `${CDN_IMAGE}/${withDir}`;
}

const EMPTY_PAGE: OphimPagedResult = { items: [], hasMore: false };

async function fetchList(url: string): Promise<OphimPagedResult> {
  try {
    const res = await fetch(url);
    if (!res.ok) return EMPTY_PAGE;
    const json = await res.json();
    const items = (json?.data?.items as OphimMovieListItem[]) ?? [];
    const pagination = json?.data?.params?.pagination as OphimPagination | undefined;
    return { items, pagination, hasMore: computeHasMore(pagination) };
  } catch {
    return EMPTY_PAGE;
  }
}

// OPhim sort/filter params (honoured by list endpoints; `tim-kiem` ignores
// sort so callers also sortByNewest client-side). "view" desc == hot.
export type MovieSort = "newest" | "hot" | "year";
const SORT_MAP: Record<MovieSort, string> = {
  newest: "sort_field=modified.time&sort_type=desc",
  hot: "sort_field=view&sort_type=desc",
  year: "sort_field=year&sort_type=desc",
};

export interface ListFilters {
  sort?: MovieSort; // default "newest"
  category?: string; // the-loai slug (danh-sach lists only)
  country?: string; // quoc-gia slug
  year?: number;
}

function filterQuery(f?: ListFilters): string {
  const parts = [SORT_MAP[f?.sort ?? "newest"]];
  if (f?.category) parts.push(`category=${encodeURIComponent(f.category)}`);
  if (f?.country) parts.push(`country=${encodeURIComponent(f.country)}`);
  if (f?.year) parts.push(`year=${f.year}`);
  return parts.join("&");
}

export function searchMovies(keyword: string, page = 1): Promise<OphimPagedResult> {
  return fetchList(
    `${BASE}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}&${SORT_MAP.newest}`,
  );
}

/** Latest cinema movies (phim chiếu rạp). */
export function getCinemaMovies(page = 1): Promise<OphimPagedResult> {
  return fetchList(`${BASE}/v1/api/danh-sach/phim-chieu-rap?page=${page}&${SORT_MAP.newest}`);
}

/**
 * Generic OPhim list by slug: phim-moi-cap-nhat, phim-le, phim-bo, hoat-hinh,
 * tv-shows, phim-chieu-rap. Supports sort + category/country/year filters.
 */
export function getMovieList(
  listSlug: string,
  page = 1,
  filters?: ListFilters,
): Promise<OphimPagedResult> {
  return fetchList(`${BASE}/v1/api/danh-sach/${listSlug}?page=${page}&${filterQuery(filters)}`);
}

/** Movies of a genre (the-loai/{slug}), paged; supports country/year/sort. */
export function getGenreMovies(
  genreSlug: string,
  page = 1,
  filters?: ListFilters,
): Promise<OphimPagedResult> {
  return fetchList(`${BASE}/v1/api/the-loai/${genreSlug}?page=${page}&${filterQuery(filters)}`);
}

async function fetchTaxonomy(path: string): Promise<OphimCategory[]> {
  try {
    const res = await fetch(`${BASE}/v1/api/${path}`);
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data?.items as OphimCategory[]) ?? [];
  } catch {
    return [];
  }
}

/** The full genre list (name + slug). */
export function getGenres(): Promise<OphimCategory[]> {
  return fetchTaxonomy("the-loai");
}

/** The full country list (name + slug). */
export function getCountries(): Promise<OphimCategory[]> {
  return fetchTaxonomy("quoc-gia");
}

/** Extract the 11-char video id from a YouTube watch/short/embed URL. */
export function youtubeId(url?: string): string | undefined {
  if (!url) return undefined;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m?.[1];
}

/** Convert a YouTube watch/short/embed URL into an autoplay embed URL. */
export function youtubeEmbedUrl(url?: string): string | undefined {
  const id = youtubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0` : url;
}

/**
 * Full HTML page embedding the trailer via an iframe. Loading this with a
 * `baseUrl` of youtube.com gives the iframe a valid referer/origin, which
 * avoids YouTube "Error 153 / playback configuration" in a WebView.
 */
export function youtubeEmbedHtml(url?: string): string | undefined {
  const id = youtubeId(url);
  if (!id) return undefined;
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"><style>*{margin:0;padding:0}html,body{height:100%;background:#000;overflow:hidden}iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0}</style></head><body><iframe src="https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1&fs=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></body></html>`;
}

export type MovieAvailability = "trailer" | "cinema" | "available";

/**
 * Whether a title is only a trailer, is a current cinema release, or is fully
 * watchable. Trailer-only takes priority (status "trailer" or episode "Trailer").
 */
export function availabilityOf(m: {
  chieurap?: boolean;
  status?: string;
  episode_current?: string;
}): MovieAvailability {
  const ep = (m.episode_current || "").toLowerCase();
  if (m.status === "trailer" || ep === "trailer") return "trailer";
  if (m.chieurap) return "cinema";
  return "available";
}

const KNOWN_TYPES = ["single", "series", "hoathinh", "tvshows"] as const;
export type MovieTypeKey = (typeof KNOWN_TYPES)[number];

/** Normalise the raw `type` into a known key for i18n, or undefined. */
export function typeKeyOf(type?: string): MovieTypeKey | undefined {
  return type && (KNOWN_TYPES as readonly string[]).includes(type)
    ? (type as MovieTypeKey)
    : undefined;
}

export async function getMovie(slug: string): Promise<OphimMovieDetail | null> {
  const url = `${BASE}/v1/api/phim/${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data?.item as OphimMovieDetail) ?? null;
  } catch {
    return null;
  }
}
