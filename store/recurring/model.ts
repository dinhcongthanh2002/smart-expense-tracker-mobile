import type { CommonEntity } from "@/models/api.model";
import { RecurringFrequency, TransactionType } from "@/models/enums";
import type { CategoryViewModel } from "@/store/category/model";

export interface RecurringViewModel extends CommonEntity {
  userId?: string;
  categoryId?: string;
  category?: CategoryViewModel;
  walletId?: string | null;
  amount: number;
  type: TransactionType;
  note?: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string | null;
  nextRunDate?: string;
  lastRunDate?: string | null;
  isActive: boolean;
}

export interface RecurringUpsertModel {
  id?: string;
  categoryId: string;
  walletId?: string | null;
  amount: number;
  type: TransactionType;
  note?: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
}

export const FREQUENCY_META: Record<
  RecurringFrequency,
  { label: string; short: string }
> = {
  [RecurringFrequency.Daily]: { label: "Hàng ngày", short: "ngày" },
  [RecurringFrequency.Weekly]: { label: "Hàng tuần", short: "tuần" },
  [RecurringFrequency.Monthly]: { label: "Hàng tháng", short: "tháng" },
  [RecurringFrequency.Yearly]: { label: "Hàng năm", short: "năm" },
};

export const FREQUENCIES = [
  RecurringFrequency.Daily,
  RecurringFrequency.Weekly,
  RecurringFrequency.Monthly,
  RecurringFrequency.Yearly,
];
