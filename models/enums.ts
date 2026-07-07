// Enum values match the .NET backend (serialized as integers).

export enum TransactionType {
  Expense = 0,
  Income = 1,
  Transfer = 2,
}

export enum WalletType {
  Cash = 0,
  Bank = 1,
  EWallet = 2,
  Other = 3,
}

export enum DebtType {
  Borrow = 0,
  Lend = 1,
}

export enum DebtStatus {
  Active = 0,
  Paid = 1,
  Overdue = 2,
}

export enum RecurringFrequency {
  Daily = 0,
  Weekly = 1,
  Monthly = 2,
  Yearly = 3,
}

export enum Gender {
  Male = 0,
  Female = 1,
  Unknown = 2,
}

export enum DeviceType {
  Web = 0,
  Android = 1,
  iOS = 2,
}

// Mirrors set_Notification.Type on the backend.
export enum NotificationType {
  BudgetAlert = 0,
  RecurringTransaction = 1,
  Other = 2,
  BudgetShareInvite = 3,
}

export enum BudgetInviteStatus {
  Pending = 0,
  Accepted = 1,
  Declined = 2,
}
