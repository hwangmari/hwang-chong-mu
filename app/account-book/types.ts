export type EntryType = "income" | "expense";
export type PaymentType = "cash" | "card" | "check_card";
export type ViewMode = "ledger" | "calendar" | "board";
export type StatsScope = "monthly" | "yearly";
export type WorkspaceType = "personal" | "shared";
export type ResolvedEntrySource = "direct" | "shared_link" | "shared_mirror";
export type AccountBookAssetGoalMap = Record<
  string,
  Record<string, Record<string, number>>
>;

export type AccountEntry = {
  id: string;
  date: string;
  member?: string;
  workspaceId: string;
  createdByUserId: string;
  type: EntryType;
  category: string;
  subCategory?: string;
  merchant?: string;
  item: string;
  amount: number;
  cardCompany: string;
  payment: PaymentType;
  memo: string;
  rawText?: string;
};

export type ResolvedAccountEntry = AccountEntry & {
  resolvedId: string;
  source: ResolvedEntrySource;
  readonly: boolean;
  linkedTargetWorkspaceId?: string;
  sourceWorkspaceName?: string;
};

export type AccountBookUser = {
  id: string;
  name: string;
  password: string;
  personalWorkspaceId: string;
};

export type AccountBookWorkspace = {
  id: string;
  name: string;
  type: WorkspaceType;
  password: string;
  annualSavingGoal?: number;
  assetGoalMap?: AccountBookAssetGoalMap;
  ownerUserId?: string;
  memberIds: string[];
  inviteCode?: string;
};

export type AccountBookShareLink = {
  id: string;
  sourceEntryId: string;
  sourceWorkspaceId: string;
  targetWorkspaceId: string;
  sharedByUserId: string;
  createdAt: string;
};

export type AccountBookStore = {
  version: number;
  users: AccountBookUser[];
  workspaces: AccountBookWorkspace[];
  entries: AccountEntry[];
  shareLinks: AccountBookShareLink[];
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
