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
  "#1D9E75",
  "#3FBF94",
  "#15795A",
  "#10B981",
  "#059669",
  "#0284C7",
  "#E11D48",
  "#D97706",
];

export function colorForIndex(index: number): string {
  return CATEGORY_FALLBACK_COLORS[index % CATEGORY_FALLBACK_COLORS.length];
}
