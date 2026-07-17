import type { CommonEntity } from "@/models/api.model";

export interface BillSplitParticipantViewModel {
  id?: string;
  billSplitId?: string;
  name: string;
  shareAmount: number;
  isSettled: boolean;
  isOwner: boolean;
}

export interface BillSplitViewModel extends CommonEntity {
  userId?: string;
  title: string;
  totalAmount: number;
  date: string;
  note?: string;
  participants: BillSplitParticipantViewModel[];
  /** Total others still owe you (unsettled shares, excluding yourself). */
  owedToYou: number;
  settledAmount: number;
}

export interface BillSplitParticipantUpsert {
  name: string;
  shareAmount: number;
  isOwner: boolean;
  isSettled?: boolean;
}

export interface BillSplitUpsertModel {
  id?: string;
  title: string;
  totalAmount: number;
  date: string;
  note?: string;
  participants: BillSplitParticipantUpsert[];
}
