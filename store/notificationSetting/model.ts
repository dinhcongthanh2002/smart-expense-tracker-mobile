import type { CommonEntity } from "@/models/api.model";

export interface NotificationSettingModel extends CommonEntity {
  userId?: string;
  isMonthlySummaryEnabled: boolean;
  isBudgetAlertEnabled: boolean;
  isDebtReminderEnabled: boolean;
  isSavingsGoalAlertEnabled: boolean;
  isRecurringNotifyEnabled: boolean;
  email?: string | null;
}

// Fields the server accepts on create/update (no id / audit).
export interface NotificationSettingUpsert {
  isMonthlySummaryEnabled: boolean;
  isBudgetAlertEnabled: boolean;
  isDebtReminderEnabled: boolean;
  isSavingsGoalAlertEnabled: boolean;
  isRecurringNotifyEnabled: boolean;
  email?: string | null;
}
