import type { CommonEntity } from "@/models/api.model";

export interface SavingsGoalViewModel extends CommonEntity {
  userId?: string;
  name?: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | null;
  icon?: string;
  color?: string;
  note?: string;
  progressPercent: number;
  isCompleted: boolean;
}

export interface SavingsGoalUpsertModel {
  id?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | null;
  icon?: string;
  color?: string;
  note?: string;
}
