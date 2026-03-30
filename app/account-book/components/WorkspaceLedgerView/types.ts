import {
  AccountBookUser,
  AccountBookWorkspace,
  AccountEntry,
  EntryType,
  PaymentType,
  ResolvedAccountEntry,
} from "../../types";

export type WorkspaceLedgerViewProps = {
  workspace: AccountBookWorkspace;
  users: AccountBookUser[];
  entries: ResolvedAccountEntry[];
  shareTargets: AccountBookWorkspace[];
  isEntryShared: (entryId: string, targetWorkspaceId: string) => boolean;
  onToggleShare: (entryId: string, targetWorkspaceId: string) => void;
  onSaveEntry: (entry: AccountEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onBack: () => void;
};

export type NaturalParseContext = {
  fallbackDate: string;
  workspaceId: string;
  users: AccountBookUser[];
  memberUsers: AccountBookUser[];
  defaultMember: string;
};

export type ExtractedImageEntryCandidate = {
  id: string;
  date: string;
  merchant: string;
  item: string;
  amount: number;
  payment: PaymentType | "";
  type: EntryType | "";
  category: string;
  subCategory: string;
  memo: string;
  rawText: string;
  confidence: "high" | "medium" | "low";
};
