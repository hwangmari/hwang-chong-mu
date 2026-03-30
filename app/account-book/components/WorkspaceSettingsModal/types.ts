import { AccountBookUser, AccountBookWorkspace } from "../../types";

export type UserDraft = {
  name: string;
  password: string;
};

export type RoomDraft = {
  name: string;
  password: string;
  memberIds: string[];
};

export type WorkspaceSettingsModalProps = {
  isOpen: boolean;
  users: AccountBookUser[];
  sharedWorkspaces: AccountBookWorkspace[];
  onClose: () => void;
  onUpdateUser: (userId: string, name: string, password: string) => void;
  onDeleteUser: (userId: string) => void;
  onAddUser: (name: string, password: string) => void;
  onUpdateSharedWorkspace: (
    workspaceId: string,
    name: string,
    password: string,
    memberIds: string[],
  ) => void;
  onDeleteSharedWorkspace: (workspaceId: string) => void;
  onAddSharedWorkspace: (
    name: string,
    password: string,
    memberIds: string[],
  ) => void;
};
