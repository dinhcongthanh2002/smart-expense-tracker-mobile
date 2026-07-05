import type { CommonEntity } from "@/models/api.model";
import type { CategoryViewModel } from "@/store/category/model";

export interface BudgetViewModel extends CommonEntity {
  userId?: string;
  categoryId?: string;
  category?: CategoryViewModel;
  limitAmount: number;
  month: number;
  year: number;
  sharedWithUserIds?: string[];
}

export interface BudgetUpsertModel {
  id?: string;
  categoryId: string;
  limitAmount: number;
  month: number;
  year: number;
}

export interface BudgetProgressViewModel {
  categoryId?: string;
  category?: CategoryViewModel;
  budgetAmount: number;
  currentSpent: number;
  remainingAmount: number;
  progressPercent: number;
  isAlerted: boolean;
  alertSentDate?: string;
}
