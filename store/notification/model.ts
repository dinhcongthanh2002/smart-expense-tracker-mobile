import type { CommonEntity } from "@/models/api.model";

export interface NotificationViewModel extends CommonEntity {
  userId?: string;
  title?: string;
  body?: string;
  type?: number | null;
  referenceId?: string;
  isRead: boolean;
}
