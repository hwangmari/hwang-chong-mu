"use client";

import { useState } from "react";
import UserSettingsSection from "./UserSettingsSection";
import SharedWorkspaceSection from "./SharedWorkspaceSection";
import {
  StBackdrop,
  StCloseButton,
  StDescription,
  StHeader,
  StModalCard,
  StTitle,
} from "./styles";
import type {
  RoomDraft,
  UserDraft,
  WorkspaceSettingsModalProps,
} from "./types";

const DEFAULT_PASSWORD = "6155";

export default function WorkspaceSettingsModal({
  isOpen,
  users,
  sharedWorkspaces,
  onClose,
  onUpdateUser,
  onDeleteUser,
  onAddUser,
  onUpdateSharedWorkspace,
  onDeleteSharedWorkspace,
  onAddSharedWorkspace,
}: WorkspaceSettingsModalProps) {
  const [userDrafts, setUserDrafts] = useState<Record<string, UserDraft>>(() =>
    Object.fromEntries(
      users.map((user) => [user.id, { name: user.name, password: user.password }]),
    ),
  );
  const [roomDrafts, setRoomDrafts] = useState<Record<string, RoomDraft>>(() =>
    Object.fromEntries(
      sharedWorkspaces.map((workspace) => [
        workspace.id,
        {
          name: workspace.name,
          password: workspace.password,
          memberIds: workspace.memberIds,
        },
      ]),
    ),
  );
  const [newUser, setNewUser] = useState<UserDraft>({
    name: "",
    password: DEFAULT_PASSWORD,
  });
  const [newRoom, setNewRoom] = useState<RoomDraft>({
    name: "",
    password: DEFAULT_PASSWORD,
    memberIds: users.map((user) => user.id),
  });

  if (!isOpen) return null;

  const handleDeleteUser = (userId: string) => {
    const target = users.find((user) => user.id === userId);
    if (users.length <= 1) {
      alert("참가자는 최소 1명은 남아 있어야 합니다.");
      return;
    }
    if (!target) return;
    if (!window.confirm(`${target.name} 참가자를 삭제할까요?`)) return;
    onDeleteUser(userId);
  };

  const handleAddUser = () => {
    if (!newUser.name.trim() || !newUser.password.trim()) return;
    onAddUser(newUser.name.trim(), newUser.password.trim());
    setNewUser({ name: "", password: DEFAULT_PASSWORD });
  };

  const handleToggleRoomMember = (roomId: string, userId: string) => {
    setRoomDrafts((prev) => {
      const current = prev[roomId];
      const hasUser = current.memberIds.includes(userId);
      return {
        ...prev,
        [roomId]: {
          ...current,
          memberIds: hasUser
            ? current.memberIds.filter((id) => id !== userId)
            : [...current.memberIds, userId],
        },
      };
    });
  };

  const handleDeleteSharedWorkspace = (workspaceId: string) => {
    const target = sharedWorkspaces.find((workspace) => workspace.id === workspaceId);
    if (sharedWorkspaces.length <= 1) {
      alert("공용 가계부방은 최소 1개는 남아 있어야 합니다.");
      return;
    }
    if (!target) return;
    if (!window.confirm(`${target.name} 공용방을 삭제할까요?`)) return;
    onDeleteSharedWorkspace(workspaceId);
  };

  const handleToggleNewRoomMember = (userId: string) => {
    setNewRoom((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter((id) => id !== userId)
        : [...prev.memberIds, userId],
    }));
  };

  const handleAddSharedWorkspace = () => {
    if (!newRoom.name.trim() || !newRoom.password.trim()) return;
    onAddSharedWorkspace(
      newRoom.name.trim(),
      newRoom.password.trim(),
      newRoom.memberIds,
    );
    setNewRoom({
      name: "",
      password: DEFAULT_PASSWORD,
      memberIds: users.map((user) => user.id),
    });
  };

  return (
    <StBackdrop onClick={onClose}>
      <StModalCard onClick={(event) => event.stopPropagation()}>
        <StHeader>
          <div>
            <StTitle>사용자 / 공용방 설정</StTitle>
            <StDescription>
              개인 가계부와 공용 가계부방의 이름, 비밀번호, 참여 멤버를 관리합니다.
            </StDescription>
          </div>
          <StCloseButton type="button" onClick={onClose}>
            닫기
          </StCloseButton>
        </StHeader>

        <UserSettingsSection
          users={users}
          userDrafts={userDrafts}
          newUser={newUser}
          onChangeUserDraft={(userId, nextDraft) =>
            setUserDrafts((prev) => ({ ...prev, [userId]: nextDraft }))
          }
          onChangeNewUser={setNewUser}
          onUpdateUser={onUpdateUser}
          onDeleteUser={handleDeleteUser}
          onAddUser={handleAddUser}
        />

        <SharedWorkspaceSection
          users={users}
          sharedWorkspaces={sharedWorkspaces}
          roomDrafts={roomDrafts}
          newRoom={newRoom}
          onChangeRoomDraft={(workspaceId, nextDraft) =>
            setRoomDrafts((prev) => ({ ...prev, [workspaceId]: nextDraft }))
          }
          onChangeNewRoom={setNewRoom}
          onToggleRoomMember={handleToggleRoomMember}
          onToggleNewRoomMember={handleToggleNewRoomMember}
          onUpdateSharedWorkspace={onUpdateSharedWorkspace}
          onDeleteSharedWorkspace={handleDeleteSharedWorkspace}
          onAddSharedWorkspace={handleAddSharedWorkspace}
        />
      </StModalCard>
    </StBackdrop>
  );
}
