// Entity name -> API path (relative to linkApi). Mirrors the admin FE
// lib/router-link.ts apiRoutes so both clients hit identical endpoints.

export const apiRoutes: Record<string, string> = {
  Auth: "/authentication",
  User: "/idm/users",
  Category: "/categories",
  Transaction: "/transactions",
  Budget: "/budgets",
  BudgetAlert: "/budget-alerts",
  Wallet: "/wallets",
  Debt: "/debts",
  SavingsGoal: "/savings-goals",
  Recurring: "/recurring-transactions",
  Statistic: "/statistics",
  Setting: "/settings",
  Notification: "/notifications",
  NotificationToken: "/notification-token",
  ChatBot: "/chatbot",
  Upload: "/upload",
};

export const routerLinks = (name: string): string =>
  apiRoutes[name] ?? `/${name.toLowerCase()}`;
