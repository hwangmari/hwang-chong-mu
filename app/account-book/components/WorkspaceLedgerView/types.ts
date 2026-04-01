import {
  AccountBookUser,
  AccountBookWorkspace,
  AccountEntry,
  EntryType,
  PaymentType,
  ResolvedAccountEntry,
  ViewMode,
} from "../../types";

export type WorkspaceLedgerViewProps = {
  workspace: AccountBookWorkspace;
  users: AccountBookUser[];
  currentUserId: string;
  entries: ResolvedAccountEntry[];
  shareTargets: AccountBookWorkspace[];
  isEntryShared: (entryId: string, targetWorkspaceId: string) => boolean;
  onToggleShare: (entryId: string, targetWorkspaceId: string) => void;
  onSaveEntry: (entry: AccountEntry) => boolean | Promise<boolean>;
  onDeleteEntry: (entryId: string) => void | Promise<void>;
  onChangeAnnualSavingGoal: (value: number) => boolean | Promise<boolean>;
  onBack: () => void;
  initialViewMode?: ViewMode;
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
