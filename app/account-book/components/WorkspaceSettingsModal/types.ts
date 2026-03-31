import { AccountBookUser, AccountBookWorkspace } from "../../types";

export type UserDraft = {
  name: string;
  password: string;
};

export type RoomDraft = {
  name: string;
  password: string;
};

export type WorkspaceSettingsModalProps = {
  isOpen: boolean;
  activeUser: AccountBookUser | null;
  users: AccountBookUser[];
  sharedWorkspaces: AccountBookWorkspace[];
  onClose: () => void;
  onCreateSharedWorkspace: (name: string, password: string) => void;
  onUpdateUser: (userId: string, name: string, password: string) => void;
  onUpdateSharedWorkspace: (
    workspaceId: string,
    name: string,
    password: string,
  ) => void;
  onDeleteSharedWorkspace: (workspaceId: string) => void;
  onAddRoomMember: (
    workspaceId: string,
    name: string,
    password: string,
  ) => void;
  onRemoveRoomMember: (workspaceId: string, userId: string) => void;
};
