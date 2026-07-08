import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";

import { Screen } from "@/components/ui/Screen";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { DateField } from "@/components/ui/DateField";
import { DebtFacade } from "@/store/debt";
import {
  DEBT_STATUS_META,
  DEBT_TYPE_META,
  type DebtViewModel,
} from "@/store/debt/model";
import { DebtStatus, DebtType } from "@/models/enums";
import type { QueryParams } from "@/models/api.model";
import { getCategoryIcon } from "@/lib/category-icons";
import { formatCurrency, formatDate } from "@/lib/format";
import { colors } from "@/theme/colors";

// Maps debt enum values to shared enum-label keys (common.enums.*).
const DEBT_TYPE_KEY: Record<DebtType, string> = {
  [DebtType.Borrow]: "borrow",
  [DebtType.Lend]: "lend",
};
const DEBT_STATUS_KEY: Record<DebtStatus, string> = {
  [DebtStatus.Active]: "active",
  [DebtStatus.Paid]: "paid",
  [DebtStatus.Overdue]: "overdue",
};

const FILTERS: { key: string; value?: DebtType }[] = [
  { key: "common.all", value: undefined },
  { key: "common.enums.debtType.borrow", value: DebtType.Borrow },
  { key: "common.enums.debtType.lend", value: DebtType.Lend },
];

const STATUS_FILTERS: { key: string; value?: DebtStatus }[] = [
  { key: "common.all", value: undefined },
  { key: "common.enums.debtStatus.active", value: DebtStatus.Active },
  { key: "common.enums.debtStatus.paid", value: DebtStatus.Paid },
  { key: "common.enums.debtStatus.overdue", value: DebtStatus.Overdue },
];

function DebtCard({ debt, onPress }: { debt: DebtViewModel; onPress: () => void }) {
  const { t } = useTranslation();
  const meta = DEBT_TYPE_META[debt.type];
  const status = DEBT_STATUS_META[debt.status];
  const Icon = getCategoryIcon(meta.icon);
  const paid = Math.max(debt.totalAmount - debt.remainingAmount, 0);
  const percent = debt.totalAmount > 0 ? Math.round((paid / debt.totalAmount) * 100) : 0;

  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      <GlassSurface radius={20} className="p-4" style={{ marginBottom: 12 }}>
        <View className="flex-row items-center gap-3">
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 15,
              backgroundColor: `${meta.color}26`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon color={meta.color} size={24} strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-ink" numberOfLines={1}>
              {debt.personName}
            </Text>
            <Text className="mt-0.5 text-xs text-muted" numberOfLines={1}>
              {t("common.enums.debtType." + DEBT_TYPE_KEY[debt.type])}
              {` · ${formatDate(debt.startDate)}`}
              {debt.dueDate ? ` · ${t("debts.dueShort", { date: formatDate(debt.dueDate) })}` : ""}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-base font-bold" style={{ color: meta.color }}>
              {formatCurrency(debt.remainingAmount)}
            </Text>
            <View
              className="mt-1 rounded-full px-2 py-0.5"
              style={{ backgroundColor: `${status.color}22` }}
            >
              <Text className="text-[11px] font-medium" style={{ color: status.color }}>
                {t("common.enums.debtStatus." + DEBT_STATUS_KEY[debt.status])}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-3 h-2 overflow-hidden rounded-full bg-glass-light">
          <View
            style={{
              width: `${Math.min(percent, 100)}%`,
              height: "100%",
              backgroundColor: meta.color,
            }}
          />
        </View>
        <Text className="mt-1.5 text-xs text-muted">
          {t("debts.paidProgress", {
            paid: formatCurrency(paid),
            total: formatCurrency(debt.totalAmount),
          })}
        </Text>
      </GlassSurface>
    </Pressable>
  );
}

export default function DebtsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const debt = DebtFacade();
  const [filter, setFilter] = useState<DebtType | undefined>(undefined);
  const [status, setStatus] = useState<DebtStatus | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [hasDateFilter, setHasDateFilter] = useState(false);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [toDate, setToDate] = useState(new Date());

  // debounce the search box
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(id);
  }, [search]);

  const load = useCallback(() => {
    // fullTextSearch/date range live inside `filter` — the API deserializes it into DebtQueryModel
    const filterObj: Record<string, unknown> = {};
    if (filter !== undefined) filterObj.type = filter;
    if (status !== undefined) filterObj.status = status;
    if (debounced) filterObj.fullTextSearch = debounced;
    if (hasDateFilter) {
      filterObj.fromDate = dayjs(fromDate).format("YYYY-MM-DD");
      filterObj.toDate = dayjs(toDate).format("YYYY-MM-DD");
    }
    const params: QueryParams = { page: 1, size: 100 };
    if (Object.keys(filterObj).length) params.filter = filterObj;
    debt.get(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, status, debounced, hasDateFilter, fromDate, toDate]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const debts = debt.pagination?.content ?? [];
  const { iOwe, owedToMe } = useMemo(() => {
    const all = debt.pagination?.content ?? [];
    return {
      iOwe: all
        .filter((d) => d.type === DebtType.Borrow)
        .reduce((s, d) => s + d.remainingAmount, 0),
      owedToMe: all
        .filter((d) => d.type === DebtType.Lend)
        .reduce((s, d) => s + d.remainingAmount, 0),
    };
  }, [debt.pagination]);

  return (
    <Screen className="px-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-28">
        <View className="mb-4 mt-1 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="-ml-2 h-10 w-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={26} color={colors.ink} />
          </Pressable>
          <Text className="text-lg font-bold text-ink">{t("debts.title")}</Text>
          <Pressable
            onPress={() => router.push("/debt-form")}
            className="h-10 w-10 items-center justify-center rounded-full bg-primary/20 active:opacity-70"
          >
            <Ionicons name="add" size={22} color={colors.primary} />
          </Pressable>
        </View>

        {/* summary */}
        <GlassSurface radius={22} className="flex-row p-5" style={{ marginBottom: 20 }}>
          <View className="flex-1">
            <Text className="text-xs text-muted">{t("debts.iOwe")}</Text>
            <Text className="mt-1 text-lg font-bold text-expense">
              {formatCurrency(iOwe)}
            </Text>
          </View>
          <View className="flex-1 items-end">
            <Text className="text-xs text-muted">{t("debts.owedToMe")}</Text>
            <Text className="mt-1 text-lg font-bold text-income">
              {formatCurrency(owedToMe)}
            </Text>
          </View>
        </GlassSurface>

        {/* search */}
        <View className="mb-3 flex-row items-center gap-2 rounded-2xl bg-glass-light px-3.5">
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("debts.searchPlaceholder")}
            placeholderTextColor={colors.muted}
            selectionColor={colors.primary}
            className="flex-1 py-3 text-base text-ink"
            autoCorrect={false}
            returnKeyType="search"
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        {/* type filter */}
        <View className="mb-3 flex-row gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.value)}
                className={`rounded-full px-4 py-2 ${active ? "bg-primary" : "bg-glass-light"}`}
              >
                <Text className={`text-sm font-medium ${active ? "text-white" : "text-muted"}`}>
                  {t(f.key)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* status filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 pr-4"
          className="mb-4"
        >
          {STATUS_FILTERS.map((f) => {
            const active = status === f.value;
            return (
              <Pressable
                key={f.key + String(f.value)}
                onPress={() => setStatus(f.value)}
                className={`rounded-full border px-4 py-2 ${active ? "border-primary bg-primary/20" : "border-glass-border"}`}
              >
                <Text className={`text-sm font-medium ${active ? "text-primary" : "text-muted"}`}>
                  {t(f.key)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* date filter */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-muted">{t("debts.dateFilter")}</Text>
            <Switch
              value={hasDateFilter}
              onValueChange={setHasDateFilter}
              trackColor={{ true: colors.primary, false: "rgba(255,255,255,0.15)" }}
              thumbColor="#fff"
            />
          </View>
          {hasDateFilter ? (
            <View className="mt-2 flex-row gap-2">
              <View className="flex-1">
                <Text className="mb-1 ml-1 text-[11px] text-muted">{t("debts.fromDate")}</Text>
                <DateField value={fromDate} onChange={setFromDate} maximumDate={toDate} />
              </View>
              <View className="flex-1">
                <Text className="mb-1 ml-1 text-[11px] text-muted">{t("debts.toDate")}</Text>
                <DateField value={toDate} onChange={setToDate} />
              </View>
            </View>
          ) : null}
        </View>

        {debts.length === 0 && !debt.isLoading ? (
          filter !== undefined || status !== undefined || debounced.length > 0 || hasDateFilter ? (
            <GlassSurface radius={24} className="items-center p-10" style={{ marginTop: 8 }}>
              <Ionicons name="search-outline" size={40} color={colors.muted} />
              <Text className="mt-3 text-muted">{t("debts.emptyFiltered")}</Text>
            </GlassSurface>
          ) : (
            <GlassSurface radius={24} className="items-center p-10" style={{ marginTop: 8 }}>
              <Ionicons name="cash-outline" size={40} color={colors.muted} />
              <Text className="mt-3 text-muted">{t("debts.empty")}</Text>
              <Pressable
                onPress={() => router.push("/debt-form")}
                className="mt-4 rounded-full bg-primary px-5 py-2.5 active:opacity-80"
              >
                <Text className="font-semibold text-white">{t("debts.addDebt")}</Text>
              </Pressable>
            </GlassSurface>
          )
        ) : (
          debts.map((d) => (
            <DebtCard
              key={d.id}
              debt={d}
              onPress={() => router.push({ pathname: "/debt-detail", params: { id: d.id! } })}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
