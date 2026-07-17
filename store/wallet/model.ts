import type { CommonEntity } from "@/models/api.model";
import { WalletType } from "@/models/enums";

export interface WalletViewModel extends CommonEntity {
  userId?: string;
  name?: string;
  type: WalletType;
  currency: string;
  initialBalance: number;
  icon?: string;
  color?: string;
  note?: string;
  /** Default wallet — pre-selected when creating a transaction. */
  isDefault?: boolean;
  /** Display priority (lower = higher). Set by drag-to-reorder. */
  sortOrder?: number;
  currentBalance: number;
  currentBalanceInBase: number;
  baseCurrency: string;
}

export interface WalletUpsertModel {
  id?: string;
  name: string;
  type: WalletType;
  currency: string;
  initialBalance: number;
  icon?: string;
  color?: string;
  note?: string;
}

export const CURRENCIES = [
  "VND", "USD", "EUR", "JPY", "GBP", "AUD", "SGD", "THB", "KRW", "CNY",
];

export const WALLET_TYPE_META: Record<
  WalletType,
  { label: string; icon: string }
> = {
  [WalletType.Cash]: { label: "Tiền mặt", icon: "banknote" },
  [WalletType.Bank]: { label: "Ngân hàng", icon: "landmark" },
  [WalletType.EWallet]: { label: "Ví điện tử", icon: "smartphone" },
  [WalletType.Other]: { label: "Khác", icon: "wallet" },
};
