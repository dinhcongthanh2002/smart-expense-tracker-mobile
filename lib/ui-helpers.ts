import { TransactionType } from "@/models/enums";
import { colors } from "@/theme/colors";

export interface TypeMeta {
  label: string;
  color: string;
  sign: "+" | "-" | "";
}

export function transactionTypeMeta(type: TransactionType): TypeMeta {
  switch (type) {
    case TransactionType.Income:
      return { label: "Thu nhập", color: colors.income, sign: "+" };
    case TransactionType.Transfer:
      return { label: "Chuyển khoản", color: colors.transfer, sign: "" };
    case TransactionType.Expense:
    default:
      return { label: "Chi tiêu", color: colors.expense, sign: "-" };
  }
}

/** Fallback palette for category chips when the backend color is missing. */
export const CATEGORY_FALLBACK_COLORS = [
  "#6C7CFF",
  "#34D399",
  "#FB7185",
  "#38BDF8",
  "#FBBF24",
  "#A78BFA",
  "#F472B6",
  "#2DD4BF",
];

export function colorForIndex(index: number): string {
  return CATEGORY_FALLBACK_COLORS[index % CATEGORY_FALLBACK_COLORS.length];
}
