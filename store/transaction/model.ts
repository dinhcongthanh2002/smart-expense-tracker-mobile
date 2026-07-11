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

/** Body for POST /transactions/parse — `text` is the speech-to-text result. */
export interface TransactionParseRequest {
  text: string;
  walletId?: string;
}

/** Draft transaction the backend extracts from a spoken/typed phrase (not yet saved). */
export interface TransactionDraftModel {
  type: TransactionType;
  amount: number;
  categoryId?: string;
  /** Matched category name (for display); undefined when the backend couldn't match. */
  categoryName?: string;
  walletId?: string;
  note?: string;
  transactionDate: string;
}

export interface TransactionParseResult {
  draft: TransactionDraftModel;
  /** 0..1 — how confident the parse is; low values mean the user should review. */
  confidence: number;
  /** Fields the backend couldn't resolve: "amount" | "category" | "wallet". */
  unresolved: string[];
  /** Original speech-to-text text. */
  rawText: string;
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
