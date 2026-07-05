import type { CommonEntity } from "@/models/api.model";
import { DebtStatus, DebtType } from "@/models/enums";
import type { TransactionViewModel } from "@/store/transaction/model";
import { colors } from "@/theme/colors";

export interface DebtTransactionViewModel {
  id?: string;
  debtId?: string;
  amount: number;
  paymentDate: string;
  note?: string;
  beforeAmount: number;
  afterAmount: number;
}

export interface DebtViewModel extends CommonEntity {
  personName?: string;
  type: DebtType;
  typeName?: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate?: number | null;
  startDate: string;
  dueDate?: string | null;
  status: DebtStatus;
  statusName?: string;
  note?: string;
  userId?: string;
  debtTransactions?: DebtTransactionViewModel[];
  transactions?: TransactionViewModel[];
}

export interface DebtCreateModel {
  personName: string;
  type: DebtType;
  totalAmount: number;
  interestRate?: number | null;
  startDate: string;
  dueDate?: string | null;
  note?: string;
}

export interface DebtPayModel {
  amount: number;
  paymentDate: string;
  note?: string;
}

export const DEBT_TYPE_META: Record<
  DebtType,
  { label: string; icon: string; color: string }
> = {
  // Borrow = I borrowed money (I owe)
  [DebtType.Borrow]: { label: "Đi vay", icon: "hand-coins", color: colors.expense },
  // Lend = I lent money (they owe me)
  [DebtType.Lend]: { label: "Cho vay", icon: "banknote", color: colors.income },
};

export const DEBT_STATUS_META: Record<DebtStatus, { label: string; color: string }> = {
  [DebtStatus.Active]: { label: "Đang nợ", color: colors.warning },
  [DebtStatus.Paid]: { label: "Đã tất toán", color: colors.income },
  [DebtStatus.Overdue]: { label: "Quá hạn", color: colors.expense },
};
