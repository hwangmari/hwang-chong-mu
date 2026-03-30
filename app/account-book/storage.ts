"use client";

import {
  AccountBookShareLink,
  AccountBookStore,
  AccountBookUser,
  AccountBookWorkspace,
  AccountEntry,
  ResolvedAccountEntry,
} from "./types";

export const ACCOUNT_BOOK_STORE_KEY = "hwang-account-book-store-v1";
export const LEGACY_ACCOUNT_BOOK_KEY = "hwang-account-book-v2";

const DEFAULT_PASSWORD = "6155";
const DEFAULT_VERSION = 1;

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function mapLegacyCategory(category?: string) {
  if (!category) return "기타";
  if (category === "실적 인정") return "결제/플랫폼";
  if (category === "대형결제/할인") return "쇼핑/기타";
  return category;
}

function normalizeLegacyEntry(
  raw: Partial<AccountEntry>,
  fallbackId: string,
  workspaceId: string,
  createdByUserId: string,
): AccountEntry {
  return {
    id: raw.id || fallbackId,
    date: raw.date || "2026-02-01",
    member: raw.member || "사용자1",
    workspaceId,
    createdByUserId,
    type: raw.type === "income" ? "income" : "expense",
    category: mapLegacyCategory(raw.category),
    subCategory: raw.subCategory || "",
    merchant: raw.merchant || "",
    item: raw.item || raw.memo || "항목명 없음",
    amount: Number(raw.amount) || 0,
    cardCompany: raw.cardCompany || "KB국민카드",
    payment:
      raw.payment === "cash"
        ? "cash"
        : raw.payment === "check_card"
          ? "check_card"
          : "card",
    memo: raw.memo || "",
    rawText: raw.rawText || "",
  };
}

export function createInitialStore(): AccountBookStore {
  const user1WorkspaceId = "workspace-user-1";
  const user2WorkspaceId = "workspace-user-2";
  const sharedWorkspaceId = "workspace-shared-main";

  const users: AccountBookUser[] = [
    {
      id: "user-1",
      name: "사용자1",
      password: DEFAULT_PASSWORD,
      personalWorkspaceId: user1WorkspaceId,
    },
    {
      id: "user-2",
      name: "사용자2",
      password: DEFAULT_PASSWORD,
      personalWorkspaceId: user2WorkspaceId,
    },
  ];

  const workspaces: AccountBookWorkspace[] = [
    {
      id: user1WorkspaceId,
      name: "사용자1 개인 가계부",
      type: "personal",
      password: DEFAULT_PASSWORD,
      ownerUserId: "user-1",
      memberIds: ["user-1"],
    },
    {
      id: user2WorkspaceId,
      name: "사용자2 개인 가계부",
      type: "personal",
      password: DEFAULT_PASSWORD,
      ownerUserId: "user-2",
      memberIds: ["user-2"],
    },
    {
      id: sharedWorkspaceId,
      name: "공용 가계부방",
      type: "shared",
      password: DEFAULT_PASSWORD,
      memberIds: ["user-1", "user-2"],
    },
  ];

  return {
    version: DEFAULT_VERSION,
    users,
    workspaces,
    entries: [],
    shareLinks: [],
  };
}

function migrateLegacyStore(): AccountBookStore {
  const base = createInitialStore();

  if (typeof window === "undefined") {
    return base;
  }

  try {
    const raw = window.localStorage.getItem(LEGACY_ACCOUNT_BOOK_KEY);
    if (!raw) {
      return base;
    }

    const parsed = JSON.parse(raw) as Partial<AccountEntry>[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return base;
    }

    const sharedWorkspaceId = base.workspaces.find(
      (workspace) => workspace.type === "shared",
    )!.id;

    base.entries = parsed.map((entry, index) => {
      const createdByUserId =
        entry.member === "남편" || entry.member === "사용자2" ? "user-2" : "user-1";

      return normalizeLegacyEntry(
        entry,
        `legacy-${index}`,
        sharedWorkspaceId,
        createdByUserId,
      );
    });

    return base;
  } catch {
    return base;
  }
}

function normalizeStore(raw: Partial<AccountBookStore>): AccountBookStore {
  const base = createInitialStore();

  const users = Array.isArray(raw.users) && raw.users.length > 0 ? raw.users : base.users;
  const workspaces =
    Array.isArray(raw.workspaces) && raw.workspaces.length > 0
      ? raw.workspaces
      : base.workspaces;
  const entries = Array.isArray(raw.entries) ? raw.entries : [];
  const shareLinks = Array.isArray(raw.shareLinks) ? raw.shareLinks : [];

  return {
    version: DEFAULT_VERSION,
    users: users.map((user, index) => ({
      id: user.id || `user-${index + 1}`,
      name: user.name || `사용자${index + 1}`,
      password: user.password || DEFAULT_PASSWORD,
      personalWorkspaceId:
        user.personalWorkspaceId ||
        workspaces.find((workspace) => workspace.ownerUserId === user.id)?.id ||
        `workspace-user-${index + 1}`,
    })),
    workspaces: workspaces.map((workspace, index) => ({
      id: workspace.id || `workspace-${index + 1}`,
      name: workspace.name || `가계부방 ${index + 1}`,
      type: workspace.type === "shared" ? "shared" : "personal",
      password: workspace.password || DEFAULT_PASSWORD,
      ownerUserId: workspace.ownerUserId,
      memberIds:
        Array.isArray(workspace.memberIds) && workspace.memberIds.length > 0
          ? workspace.memberIds
          : workspace.ownerUserId
            ? [workspace.ownerUserId]
            : [],
    })),
    entries: entries.map((entry, index) => ({
      id: entry.id || `entry-${index + 1}`,
      date: entry.date || "2026-02-01",
      member: entry.member || "사용자1",
      workspaceId: entry.workspaceId || workspaces[0]?.id || base.workspaces[0].id,
      createdByUserId: entry.createdByUserId || users[0]?.id || base.users[0].id,
      type: entry.type === "income" ? "income" : "expense",
      category: mapLegacyCategory(entry.category),
      subCategory: entry.subCategory || "",
      merchant: entry.merchant || "",
      item: entry.item || "항목명 없음",
      amount: Number(entry.amount) || 0,
      cardCompany: entry.cardCompany || "KB국민카드",
      payment:
        entry.payment === "cash"
          ? "cash"
        : entry.payment === "check_card"
            ? "check_card"
            : "card",
      memo: entry.memo || "",
      rawText: entry.rawText || "",
    })),
    shareLinks: shareLinks.map((link, index) => ({
      id: link.id || `share-${index + 1}`,
      sourceEntryId: link.sourceEntryId || "",
      sourceWorkspaceId: link.sourceWorkspaceId || "",
      targetWorkspaceId: link.targetWorkspaceId || "",
      sharedByUserId: link.sharedByUserId || users[0]?.id || base.users[0].id,
      createdAt: link.createdAt || new Date().toISOString(),
    })),
  };
}

export { normalizeStore };

export function getAccountBookStore(): AccountBookStore {
  if (typeof window === "undefined") {
    return createInitialStore();
  }

  try {
    const raw = window.localStorage.getItem(ACCOUNT_BOOK_STORE_KEY);
    if (!raw) {
      const migrated = migrateLegacyStore();
      saveAccountBookStore(migrated);
      return migrated;
    }

    return normalizeStore(JSON.parse(raw) as Partial<AccountBookStore>);
  } catch {
    const fallback = migrateLegacyStore();
    saveAccountBookStore(fallback);
    return fallback;
  }
}

export function saveAccountBookStore(store: AccountBookStore) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(ACCOUNT_BOOK_STORE_KEY, JSON.stringify(store));
}

export function getWorkspaceById(store: AccountBookStore, workspaceId: string) {
  return store.workspaces.find((workspace) => workspace.id === workspaceId) || null;
}

export function getUserById(store: AccountBookStore, userId?: string) {
  if (!userId) return null;
  return store.users.find((user) => user.id === userId) || null;
}

export function getWorkspaceMemberUsers(
  store: AccountBookStore,
  workspace: AccountBookWorkspace,
) {
  return workspace.memberIds
    .map((memberId) => getUserById(store, memberId))
    .filter(Boolean) as AccountBookUser[];
}

export function getPersonalShareTargets(
  store: AccountBookStore,
  workspace: AccountBookWorkspace,
) {
  if (workspace.type !== "personal" || !workspace.ownerUserId) {
    return [] as AccountBookWorkspace[];
  }

  return store.workspaces.filter(
    (target) =>
      target.type === "shared" && target.memberIds.includes(workspace.ownerUserId!),
  );
}

export function isEntrySharedToWorkspace(
  store: AccountBookStore,
  entryId: string,
  targetWorkspaceId: string,
) {
  return store.shareLinks.some(
    (link) =>
      link.sourceEntryId === entryId && link.targetWorkspaceId === targetWorkspaceId,
  );
}

export function resolveWorkspaceEntries(
  store: AccountBookStore,
  workspaceId: string,
): ResolvedAccountEntry[] {
  const workspace = getWorkspaceById(store, workspaceId);
  if (!workspace) return [];

  const directEntries = store.entries
    .filter((entry) => entry.workspaceId === workspace.id)
    .map((entry) => ({
      ...entry,
      resolvedId: entry.id,
      source: "direct" as const,
      readonly: false,
    }));

  if (workspace.type === "shared") {
    const linkedEntries = store.shareLinks
      .filter((link) => link.targetWorkspaceId === workspace.id)
      .map((link) => {
        const sourceEntry = store.entries.find(
          (entry) =>
            entry.id === link.sourceEntryId &&
            entry.workspaceId === link.sourceWorkspaceId,
        );
        if (!sourceEntry) return null;
        const sourceWorkspace = getWorkspaceById(store, link.sourceWorkspaceId);
        return {
          ...sourceEntry,
          resolvedId: `linked-${link.id}`,
          source: "shared_link" as const,
          readonly: true,
          linkedTargetWorkspaceId: workspace.id,
          sourceWorkspaceName: sourceWorkspace?.name || "개인 가계부",
        };
      })
      .filter(Boolean) as ResolvedAccountEntry[];

    return [...directEntries, ...linkedEntries].sort(sortEntries);
  }

  const mirroredSharedEntries = store.entries
    .filter((entry) => entry.workspaceId !== workspace.id)
    .filter((entry) => entry.createdByUserId === workspace.ownerUserId)
    .filter((entry) => {
      const entryWorkspace = getWorkspaceById(store, entry.workspaceId);
      return entryWorkspace?.type === "shared";
    })
    .filter((entry) => {
      const entryWorkspace = getWorkspaceById(store, entry.workspaceId);
      return Boolean(
        entryWorkspace && entryWorkspace.memberIds.includes(workspace.ownerUserId!),
      );
    })
    .map((entry) => ({
      ...entry,
      resolvedId: `mirror-${entry.id}`,
      source: "shared_mirror" as const,
      readonly: true,
      sourceWorkspaceName:
        getWorkspaceById(store, entry.workspaceId)?.name || "공용 가계부방",
    }));

  return [...directEntries, ...mirroredSharedEntries].sort(sortEntries);
}

function sortEntries(a: AccountEntry, b: AccountEntry) {
  return `${b.date}-${String(b.amount).padStart(12, "0")}-${b.id}`.localeCompare(
    `${a.date}-${String(a.amount).padStart(12, "0")}-${a.id}`,
  );
}

export function upsertEntry(
  store: AccountBookStore,
  entry: AccountEntry,
): AccountBookStore {
  const nextEntries = store.entries.some((item) => item.id === entry.id)
    ? store.entries.map((item) => (item.id === entry.id ? entry : item))
    : [entry, ...store.entries];

  return {
    ...store,
    entries: nextEntries,
  };
}

export function deleteEntry(
  store: AccountBookStore,
  entryId: string,
): AccountBookStore {
  return {
    ...store,
    entries: store.entries.filter((entry) => entry.id !== entryId),
    shareLinks: store.shareLinks.filter((link) => link.sourceEntryId !== entryId),
  };
}

export function toggleShareLink(
  store: AccountBookStore,
  sourceEntryId: string,
  sourceWorkspaceId: string,
  targetWorkspaceId: string,
  sharedByUserId: string,
): AccountBookStore {
  const existing = store.shareLinks.find(
    (link) =>
      link.sourceEntryId === sourceEntryId &&
      link.targetWorkspaceId === targetWorkspaceId,
  );

  if (existing) {
    return {
      ...store,
      shareLinks: store.shareLinks.filter((link) => link.id !== existing.id),
    };
  }

  const nextLink: AccountBookShareLink = {
    id: createId("share"),
    sourceEntryId,
    sourceWorkspaceId,
    targetWorkspaceId,
    sharedByUserId,
    createdAt: new Date().toISOString(),
  };

  return {
    ...store,
    shareLinks: [nextLink, ...store.shareLinks],
  };
}

export function updateUser(
  store: AccountBookStore,
  userId: string,
  payload: Pick<AccountBookUser, "name" | "password">,
): AccountBookStore {
  return {
    ...store,
    users: store.users.map((user) =>
      user.id === userId ? { ...user, ...payload } : user,
    ),
    workspaces: store.workspaces.map((workspace) =>
      workspace.ownerUserId === userId && workspace.type === "personal"
        ? {
            ...workspace,
            name: `${payload.name} 개인 가계부`,
            password: payload.password,
          }
        : workspace,
    ),
  };
}

export function addUser(
  store: AccountBookStore,
  payload: Pick<AccountBookUser, "name" | "password">,
): AccountBookStore {
  const userId = createId("user");
  const personalWorkspaceId = createId("workspace");
  const nextUser: AccountBookUser = {
    id: userId,
    name: payload.name,
    password: payload.password,
    personalWorkspaceId,
  };
  const nextWorkspace: AccountBookWorkspace = {
    id: personalWorkspaceId,
    name: `${payload.name} 개인 가계부`,
    type: "personal",
    password: payload.password,
    ownerUserId: userId,
    memberIds: [userId],
  };

  return {
    ...store,
    users: [...store.users, nextUser],
    workspaces: [...store.workspaces, nextWorkspace],
  };
}

export function deleteUser(
  store: AccountBookStore,
  userId: string,
): AccountBookStore {
  if (store.users.length <= 1) {
    return store;
  }

  const removedWorkspaceIds = new Set(
    store.workspaces
      .filter((workspace) => workspace.ownerUserId === userId)
      .map((workspace) => workspace.id),
  );

  const nextWorkspaces = store.workspaces
    .filter((workspace) => !removedWorkspaceIds.has(workspace.id))
    .map((workspace) => ({
      ...workspace,
      memberIds: workspace.memberIds.filter((memberId) => memberId !== userId),
    }))
    .filter((workspace) =>
      workspace.type === "shared" ? workspace.memberIds.length > 0 : true,
    );

  const validWorkspaceIds = new Set(nextWorkspaces.map((workspace) => workspace.id));
  const nextEntries = store.entries.filter(
    (entry) =>
      entry.createdByUserId !== userId && validWorkspaceIds.has(entry.workspaceId),
  );
  const validEntryIds = new Set(nextEntries.map((entry) => entry.id));

  return {
    ...store,
    users: store.users.filter((user) => user.id !== userId),
    workspaces: nextWorkspaces,
    entries: nextEntries,
    shareLinks: store.shareLinks.filter(
      (link) =>
        link.sharedByUserId !== userId &&
        validWorkspaceIds.has(link.sourceWorkspaceId) &&
        validWorkspaceIds.has(link.targetWorkspaceId) &&
        validEntryIds.has(link.sourceEntryId),
    ),
  };
}

export function updateWorkspace(
  store: AccountBookStore,
  workspaceId: string,
  payload: Pick<AccountBookWorkspace, "name" | "password" | "memberIds">,
): AccountBookStore {
  return {
    ...store,
    workspaces: store.workspaces.map((workspace) =>
      workspace.id === workspaceId ? { ...workspace, ...payload } : workspace,
    ),
  };
}

export function addSharedWorkspace(
  store: AccountBookStore,
  payload: Pick<AccountBookWorkspace, "name" | "password" | "memberIds">,
): AccountBookStore {
  const nextWorkspace: AccountBookWorkspace = {
    id: createId("workspace"),
    name: payload.name,
    type: "shared",
    password: payload.password,
    memberIds: payload.memberIds,
  };

  return {
    ...store,
    workspaces: [...store.workspaces, nextWorkspace],
  };
}

export function deleteSharedWorkspace(
  store: AccountBookStore,
  workspaceId: string,
): AccountBookStore {
  const sharedWorkspaces = store.workspaces.filter(
    (workspace) => workspace.type === "shared",
  );
  if (sharedWorkspaces.length <= 1) {
    return store;
  }

  const nextEntries = store.entries.filter((entry) => entry.workspaceId !== workspaceId);
  const validEntryIds = new Set(nextEntries.map((entry) => entry.id));

  return {
    ...store,
    workspaces: store.workspaces.filter((workspace) => workspace.id !== workspaceId),
    entries: nextEntries,
    shareLinks: store.shareLinks.filter(
      (link) =>
        link.sourceWorkspaceId !== workspaceId &&
        link.targetWorkspaceId !== workspaceId &&
        validEntryIds.has(link.sourceEntryId),
    ),
  };
}
