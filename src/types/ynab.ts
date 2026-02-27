// All monetary values from YNAB are in "milliunits" (1000 = $1.00)
export type Milliunits = number;

export interface User {
  id: string;
}

export interface DateFormat {
  format: string;
}

export interface CurrencyFormat {
  iso_code: string;
  example_format: string;
  decimal_digits: number;
  decimal_separator: string;
  symbol_first: boolean;
  group_separator: string;
  currency_symbol: string;
  display_symbol: boolean;
}

export interface BudgetSummary {
  id: string;
  name: string;
  last_modified_on: string;
  first_month: string;
  last_month: string;
  date_format: DateFormat;
  currency_format: CurrencyFormat;
}

export interface BudgetSettings {
  date_format: DateFormat;
  currency_format: CurrencyFormat;
}

export type AccountType =
  | "checking"
  | "savings"
  | "cash"
  | "creditCard"
  | "lineOfCredit"
  | "otherAsset"
  | "otherLiability"
  | "mortgage"
  | "autoLoan"
  | "studentLoan"
  | "personalLoan"
  | "medicalDebt"
  | "otherDebt";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  on_budget: boolean;
  closed: boolean;
  note: string | null;
  balance: Milliunits;
  cleared_balance: Milliunits;
  uncleared_balance: Milliunits;
  transfer_payee_id: string;
  direct_import_linked: boolean;
  direct_import_in_error: boolean;
  last_reconciled_at: string | null;
  debt_original_balance: Milliunits | null;
  debt_interest_rates: Record<string, number> | null;
  debt_minimum_payments: Record<string, number> | null;
  debt_escrow_amounts: Record<string, number> | null;
  deleted: boolean;
}

export interface Category {
  id: string;
  category_group_id: string;
  category_group_name: string;
  name: string;
  hidden: boolean;
  original_category_group_id: string | null;
  note: string | null;
  budgeted: Milliunits;
  activity: Milliunits;
  balance: Milliunits;
  goal_type: "TB" | "TBD" | "MF" | "NEED" | "DEBT" | null;
  goal_needs_whole_amount: boolean | null;
  goal_day: number | null;
  goal_cadence: number | null;
  goal_cadence_frequency: number | null;
  goal_creation_month: string | null;
  goal_target: Milliunits;
  goal_target_month: string | null;
  goal_target_date: string | null;
  goal_percentage_complete: number | null;
  goal_months_to_budget: number | null;
  goal_under_funded: Milliunits | null;
  goal_overall_funded: Milliunits | null;
  goal_overall_left: Milliunits | null;
  goal_snoozed_at: string | null;
  deleted: boolean;
}

export interface CategoryGroup {
  id: string;
  name: string;
  hidden: boolean;
  deleted: boolean;
  categories: Category[];
}

export interface Payee {
  id: string;
  name: string;
  transfer_account_id: string | null;
  deleted: boolean;
}

export interface PayeeLocation {
  id: string;
  payee_id: string;
  latitude: string;
  longitude: string;
  deleted: boolean;
}

export type ClearedStatus = "cleared" | "uncleared" | "reconciled";
export type FlagColor =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | null;

export interface SubTransaction {
  id: string;
  transaction_id: string;
  amount: Milliunits;
  memo: string | null;
  payee_id: string | null;
  payee_name: string | null;
  category_id: string | null;
  category_name: string | null;
  transfer_account_id: string | null;
  transfer_transaction_id: string | null;
  deleted: boolean;
}

export interface TransactionDetail {
  id: string;
  date: string;
  amount: Milliunits;
  memo: string | null;
  cleared: ClearedStatus;
  approved: boolean;
  flag_color: FlagColor;
  flag_name: string | null;
  account_id: string;
  account_name: string;
  payee_id: string | null;
  payee_name: string | null;
  category_id: string | null;
  category_name: string | null;
  transfer_account_id: string | null;
  transfer_transaction_id: string | null;
  matched_transaction_id: string | null;
  import_id: string | null;
  import_payee_name: string | null;
  import_payee_name_original: string | null;
  debt_transaction_type: "payment" | "refund" | "fee" | "interest" | "escrow" | "balancedAdjustment" | "credit" | "charge" | null;
  subtransactions: SubTransaction[];
  deleted: boolean;
}

export interface HybridTransaction extends TransactionDetail {
  type: "transaction" | "subtransaction";
  parent_transaction_id: string | null;
}

export interface ScheduledSubTransaction {
  id: string;
  scheduled_transaction_id: string;
  amount: Milliunits;
  memo: string | null;
  payee_id: string | null;
  category_id: string | null;
  transfer_account_id: string | null;
  deleted: boolean;
}

export type Frequency =
  | "never"
  | "daily"
  | "weekly"
  | "everyOtherWeek"
  | "twiceAMonth"
  | "every4Weeks"
  | "monthly"
  | "everyOtherMonth"
  | "every3Months"
  | "every4Months"
  | "twiceAYear"
  | "yearly"
  | "everyOtherYear";

export interface ScheduledTransactionDetail {
  id: string;
  date_first: string;
  date_next: string;
  frequency: Frequency;
  amount: Milliunits;
  memo: string | null;
  flag_color: FlagColor;
  flag_name: string | null;
  account_id: string;
  account_name: string;
  payee_id: string | null;
  payee_name: string | null;
  category_id: string | null;
  category_name: string | null;
  transfer_account_id: string | null;
  subtransactions: ScheduledSubTransaction[];
  deleted: boolean;
}

export interface MonthSummary {
  month: string;
  note: string | null;
  income: Milliunits;
  budgeted: Milliunits;
  activity: Milliunits;
  to_be_budgeted: Milliunits;
  age_of_money: number;
  deleted: boolean;
}

export interface MonthDetail extends MonthSummary {
  categories: Category[];
}

// Request types
export interface SaveAccount {
  name: string;
  type: AccountType;
  balance: Milliunits;
}

export interface SaveTransaction {
  account_id: string;
  date: string;
  amount: Milliunits;
  payee_id?: string | null;
  payee_name?: string | null;
  category_id?: string | null;
  memo?: string | null;
  cleared?: ClearedStatus;
  approved?: boolean;
  flag_color?: FlagColor;
  flag_name?: string | null;
  import_id?: string | null;
  subtransactions?: SaveSubTransaction[];
}

export interface UpdateTransaction extends SaveTransaction {
  id?: string;
}

export interface SaveSubTransaction {
  amount: Milliunits;
  payee_id?: string | null;
  payee_name?: string | null;
  category_id?: string | null;
  memo?: string | null;
}

export interface SaveScheduledTransaction {
  account_id: string;
  date: string;
  amount: Milliunits;
  frequency: Frequency;
  payee_id?: string | null;
  payee_name?: string | null;
  category_id?: string | null;
  memo?: string | null;
  flag_color?: FlagColor;
  subtransactions?: SaveSubTransaction[];
}

export interface SaveMonthCategory {
  budgeted: Milliunits;
}

export interface SaveCategory {
  name?: string;
  note?: string | null;
  category_group_id?: string;
}

export interface SaveCategoryGroup {
  name: string;
}

export interface SavePayee {
  name: string;
}

// API Response wrappers
export interface ApiResponse<T> {
  data: T;
}

export interface ErrorResponse {
  error: {
    id: string;
    name: string;
    detail: string;
  };
}

export interface SaveTransactionsResponseData {
  transaction_ids: string[];
  transaction?: TransactionDetail;
  transactions?: TransactionDetail[];
  duplicate_import_ids: string[];
  server_knowledge: number;
}
