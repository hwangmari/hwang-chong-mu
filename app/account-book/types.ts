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
  // 현금영수증 발급 여부 (현금 결제에만 의미, 미지정=미발급)
  cashReceipt?: boolean;
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

export type AccountBookMonthlyMemo = {
  id: string;
  workspaceId: string;
  monthKey: string;
  memo: string;
  updatedByUserId: string;
  updatedAt: string;
};

export type AssetAccountKind =
  | "예금"
  | "적금"
  | "투자"
  | "연금"
  | "현금"
  | "기타";

export type AssetChangeType =
  | "initial" // 초기 잔액
  | "deposit" // 입금(적립)
  | "withdraw" // 출금
  | "transfer_in" // 이체 받음
  | "transfer_out" // 이체 보냄
  | "ledger" // 가계부 저축 연동
  | "adjust"; // 잔액 조정

export type AssetAccount = {
  id: string;
  workspaceId: string;
  name: string;
  kind: string;
  goalAmount: number;
  createdByUserId?: string;
  archived: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AssetChange = {
  id: string;
  workspaceId: string;
  accountId: string;
  date: string;
  amount: number; // 원 단위(+/-)
  changeType: AssetChangeType;
  counterpartAccountId?: string;
  transferGroupId?: string;
  linkedEntryId?: string;
  memo?: string;
  createdByUserId?: string;
  createdAt?: string;
};

export type AssetData = {
  accounts: AssetAccount[];
  changes: AssetChange[];
};

export type AccountBookStore = {
  version: number;
  users: AccountBookUser[];
  workspaces: AccountBookWorkspace[];
  entries: AccountEntry[];
  shareLinks: AccountBookShareLink[];
  monthlyMemos: AccountBookMonthlyMemo[];
  assetAccounts: AssetAccount[];
  assetChanges: AssetChange[];
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
