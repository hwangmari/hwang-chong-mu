import { EntryType, ResolvedAccountEntry } from "../../types";

export function getListMemoStorageKey(workspaceId: string, monthKey: string) {
  return `hwang-account-book-list-memo-${workspaceId}-${monthKey}`;
}

export function resolveEntryItemLabel(params: {
  type: EntryType;
  category: string;
  subCategory: string;
  merchant: string;
  item: string;
  memo: string;
}) {
  return (
    params.item.trim() ||
    params.merchant.trim() ||
    params.memo.trim() ||
    params.subCategory.trim() ||
    params.category.trim() ||
    (params.type === "income" ? "수입" : "지출")
  );
}

export function compareResolvedEntriesDesc(
  a: ResolvedAccountEntry,
  b: ResolvedAccountEntry,
) {
  return `${b.date}-${String(b.amount).padStart(12, "0")}-${b.id}`.localeCompare(
    `${a.date}-${String(a.amount).padStart(12, "0")}-${a.id}`,
  );
}
