import type { CommonEntity } from "@/models/api.model";
import type { TransactionType } from "@/models/enums";
import type { CategoryViewModel } from "@/store/category/model";
import type { AttachmentViewModel, UserViewModel } from "@/store/user/model";

export interface TransactionViewModel extends CommonEntity {
  userId?: string;
  user?: UserViewModel;
  categoryId?: string;
  category?: CategoryViewModel;
  amount: number;
  type: TransactionType;
  transactionDate: string;
  note?: string;
  debtId?: string;
  walletId?: string;
  toWalletId?: string;
  receipt?: AttachmentViewModel;
}

/** Body for POST/PUT /transactions. */
export interface TransactionUpsertModel {
  id?: string;
  categoryId?: string;
  amount: number;
  type: TransactionType;
  note?: string;
  transactionDate: string;
  debtId?: string;
  walletId?: string;
  toWalletId?: string;
  receipt?: AttachmentViewModel;
}
