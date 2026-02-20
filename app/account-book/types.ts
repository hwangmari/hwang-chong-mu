export type EntryType = "income" | "expense";
export type PaymentType = "cash" | "card" | "check_card";
export type ViewMode = "calendar" | "stats";
export type StatsScope = "monthly" | "yearly";

export type AccountEntry = {
  id: string;
  date: string;
  member?: string;
  type: EntryType;
  category: string;
  subCategory?: string;
  item: string;
  amount: number;
  cardCompany: string;
  payment: PaymentType;
  memo: string;
};

export type CategoryStat = {
  category: string;
  amount: number;
  ratio: number;
  color: string;
};

export type CategoryOption = {
  label: string;
  color: string;
  icon: string;
  description: string;
};
