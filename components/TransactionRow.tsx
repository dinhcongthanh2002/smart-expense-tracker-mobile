import { Text, View } from "react-native";

import { CategoryBadge } from "./CategoryBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { transactionTypeMeta } from "@/lib/ui-helpers";
import { colors } from "@/theme/colors";
import type { TransactionViewModel } from "@/store/transaction/model";

export function TransactionRow({ tx }: { tx: TransactionViewModel }) {
  const meta = transactionTypeMeta(tx.type);
  const title =
    tx.category?.name || tx.note || meta.label;
  const subtitle = tx.note && tx.category?.name ? tx.note : formatDate(tx.transactionDate);

  return (
    <View className="flex-row items-center gap-3 py-3">
      <CategoryBadge
        icon={tx.category?.icon}
        color={tx.category?.color || meta.color}
      />
      <View className="flex-1">
        <Text className="text-base font-semibold text-ink" numberOfLines={1}>
          {title}
        </Text>
        <Text className="mt-0.5 text-sm text-muted" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Text
        className="text-base font-bold"
        style={{ color: meta.color }}
      >
        {meta.sign}
        {formatCurrency(tx.amount)}
      </Text>
    </View>
  );
}

export function RowDivider() {
  return (
    <View
      style={{ height: 1, backgroundColor: colors.glassBorder, opacity: 0.5 }}
    />
  );
}
