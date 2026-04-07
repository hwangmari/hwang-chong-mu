"use client";

import { useState } from "react";
import ModalCloseButton from "../ModalCloseButton";
import SharedWorkspaceSection from "./SharedWorkspaceSection";
import {
  StBackdrop,
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

export default function WorkspaceSettingsModal({
  isOpen,
  activeUser,
  users,
  sharedWorkspaces,
  onClose,
  onCreateSharedWorkspace,
  onUpdateUser,
  onUpdateSharedWorkspace,
  onDeleteSharedWorkspace,
  onAddRoomMember,
  onRemoveRoomMember,
}: WorkspaceSettingsModalProps) {
  const [userDrafts, setUserDrafts] = useState<Record<string, UserDraft>>({});
  const [roomDrafts, setRoomDrafts] = useState<Record<string, RoomDraft>>({});
  const [newSharedRoomDraft, setNewSharedRoomDraft] = useState<RoomDraft>({
    name: "",
    password: "",
  });
  const [newMemberDrafts, setNewMemberDrafts] = useState<Record<string, UserDraft>>(
    {},
  );

  if (!isOpen || !activeUser) return null;

  const handleDeleteSharedWorkspace = (workspaceId: string) => {
    const target = sharedWorkspaces.find((workspace) => workspace.id === workspaceId);
    if (!target) return;
    if (!window.confirm(`${target.name} 공용방을 삭제할까요?`)) return;
    onDeleteSharedWorkspace(workspaceId);
  };

  const handleCreateSharedWorkspace = () => {
    if (!newSharedRoomDraft.name.trim() || !newSharedRoomDraft.password.trim()) {
      return;
    }
    onCreateSharedWorkspace(
      newSharedRoomDraft.name.trim(),
      newSharedRoomDraft.password.trim(),
    );
    setNewSharedRoomDraft({ name: "", password: "" });
  };

  const handleAddRoomMember = (workspaceId: string) => {
    const draft = newMemberDrafts[workspaceId] || {
      name: "",
      password: "",
    };
    if (!draft?.name.trim() || !draft.password.trim()) return;
    onAddRoomMember(workspaceId, draft.name.trim(), draft.password.trim());
    setNewMemberDrafts((prev) => ({
      ...prev,
      [workspaceId]: { name: "", password: "" },
    }));
  };

  const handleRemoveRoomMember = (workspaceId: string, userId: string) => {
    const workspace = sharedWorkspaces.find((item) => item.id === workspaceId);
    const target = users.find((user) => user.id === userId);
    if (!workspace || !target) return;
    if (workspace.memberIds.length <= 1) {
      alert("서버방에는 최소 1명은 남아 있어야 합니다.");
      return;
    }
    if (!window.confirm(`${target.name} 사용자를 이 서버방에서 제외할까요?`)) return;
    onRemoveRoomMember(workspaceId, userId);
  };

  return (
    <StBackdrop>
      <StModalCard onClick={(event) => event.stopPropagation()}>
        <StHeader>
          <div>
            <StTitle>서버방 설정</StTitle>
            <StDescription>
              {activeUser.name} 님이 참여 중인 서버방의 이름, 비밀번호, 참가자를
              관리합니다.
            </StDescription>
          </div>
          <ModalCloseButton onClick={onClose} />
        </StHeader>

        <SharedWorkspaceSection
          activeUser={activeUser}
          users={users}
          sharedWorkspaces={sharedWorkspaces}
          newSharedRoomDraft={newSharedRoomDraft}
          roomDrafts={roomDrafts}
          memberDrafts={Object.fromEntries(
            sharedWorkspaces.map((workspace) => [
              workspace.id,
              Object.fromEntries(
                workspace.memberIds.map((memberId) => {
                  const user = users.find((item) => item.id === memberId);
                  return [
                    memberId,
                    userDrafts[memberId] || {
                      name: user?.name || "",
                      password: "",
                    },
                  ];
                }),
              ),
            ]),
          )}
          newMemberDrafts={newMemberDrafts}
          onChangeRoomDraft={(workspaceId, nextDraft) =>
            setRoomDrafts((prev) => ({ ...prev, [workspaceId]: nextDraft }))
          }
          onChangeNewSharedRoomDraft={setNewSharedRoomDraft}
          onCreateSharedWorkspace={handleCreateSharedWorkspace}
          onChangeMemberDraft={(userId, nextDraft) => {
            setUserDrafts((prev) => ({ ...prev, [userId]: nextDraft }));
          }}
          onChangeNewMemberDraft={(workspaceId, nextDraft) =>
            setNewMemberDrafts((prev) => ({ ...prev, [workspaceId]: nextDraft }))
          }
          onUpdateSharedWorkspace={(workspaceId, name, password) =>
            onUpdateSharedWorkspace(workspaceId, name, password)
          }
          onUpdateUser={onUpdateUser}
          onAddRoomMember={handleAddRoomMember}
          onRemoveRoomMember={handleRemoveRoomMember}
          onDeleteSharedWorkspace={handleDeleteSharedWorkspace}
        />
      </StModalCard>
    </StBackdrop>
  );
}
