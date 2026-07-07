// Composes all per-screen namespace files into i18next resources.
// Each namespace module default-exports `{ vi: {...}, en: {...} }`.
import common from "./common";
import tabs from "./tabs";
import dashboard from "./dashboard";
import dayTransactions from "./dayTransactions";
import transactions from "./transactions";
import transactionForm from "./transactionForm";
import wallets from "./wallets";
import budgets from "./budgets";
import budgetInvites from "./budgetInvites";
import profile from "./profile";
import settings from "./settings";
import editProfile from "./editProfile";
import changePassword from "./changePassword";
import auth from "./auth";
import categories from "./categories";
import debts from "./debts";
import goals from "./goals";
import recurring from "./recurring";
import notifications from "./notifications";

type Bundle = { vi: Record<string, unknown>; en: Record<string, unknown> };

const namespaces: Record<string, Bundle> = {
  common,
  tabs,
  dashboard,
  dayTransactions,
  transactions,
  transactionForm,
  wallets,
  budgets,
  budgetInvites,
  profile,
  settings,
  editProfile,
  changePassword,
  auth,
  categories,
  debts,
  goals,
  recurring,
  notifications,
};

function build(lang: "vi" | "en") {
  const out: Record<string, unknown> = {};
  for (const [ns, mod] of Object.entries(namespaces)) out[ns] = mod[lang];
  return out;
}

export const resources = {
  vi: { translation: build("vi") },
  en: { translation: build("en") },
};
