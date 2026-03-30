"use client";

import { AccountBookUser, AccountBookWorkspace } from "../../types";
import type { RoomDraft } from "./types";
import {
  StApplyButton,
  StCard,
  StCardList,
  StDangerButton,
  StDescription,
  StInput,
  StMemberChip,
  StMemberGrid,
  StSection,
  StSectionTitle,
} from "./styles";

type Props = {
  users: AccountBookUser[];
  sharedWorkspaces: AccountBookWorkspace[];
  roomDrafts: Record<string, RoomDraft>;
  newRoom: RoomDraft;
  onChangeRoomDraft: (workspaceId: string, nextDraft: RoomDraft) => void;
  onChangeNewRoom: (nextDraft: RoomDraft) => void;
  onToggleRoomMember: (workspaceId: string, userId: string) => void;
  onToggleNewRoomMember: (userId: string) => void;
  onUpdateSharedWorkspace: (
    workspaceId: string,
    name: string,
    password: string,
    memberIds: string[],
  ) => void;
  onDeleteSharedWorkspace: (workspaceId: string) => void;
  onAddSharedWorkspace: () => void;
};

export default function SharedWorkspaceSection({
  users,
  sharedWorkspaces,
  roomDrafts,
  newRoom,
  onChangeRoomDraft,
  onChangeNewRoom,
  onToggleRoomMember,
  onToggleNewRoomMember,
  onUpdateSharedWorkspace,
  onDeleteSharedWorkspace,
  onAddSharedWorkspace,
}: Props) {
  return (
    <StSection>
      <StSectionTitle>공용 가계부방</StSectionTitle>
      <StDescription>
        공용 가계부방 하나 안에 참가자 1, 2, +a 형태로 멤버를 붙여서 운영합니다.
      </StDescription>
      <StCardList>
        {sharedWorkspaces.map((workspace) => (
          <StCard key={workspace.id}>
            <StInput
              value={roomDrafts[workspace.id]?.name || ""}
              onChange={(event) =>
                onChangeRoomDraft(workspace.id, {
                  ...roomDrafts[workspace.id],
                  name: event.target.value,
                })
              }
              placeholder="공용방 이름"
            />
            <StInput
              value={roomDrafts[workspace.id]?.password || ""}
              onChange={(event) =>
                onChangeRoomDraft(workspace.id, {
                  ...roomDrafts[workspace.id],
                  password: event.target.value,
                })
              }
              placeholder="공용방 비밀번호"
            />
            <StMemberGrid>
              {users.map((user) => {
                const active = roomDrafts[workspace.id]?.memberIds.includes(user.id);
                return (
                  <StMemberChip
                    key={`${workspace.id}-${user.id}`}
                    type="button"
                    $active={Boolean(active)}
                    onClick={() => onToggleRoomMember(workspace.id, user.id)}
                  >
                    {user.name}
                  </StMemberChip>
                );
              })}
            </StMemberGrid>
            <StApplyButton
              type="button"
              onClick={() =>
                onUpdateSharedWorkspace(
                  workspace.id,
                  roomDrafts[workspace.id]?.name || workspace.name,
                  roomDrafts[workspace.id]?.password || workspace.password,
                  roomDrafts[workspace.id]?.memberIds || workspace.memberIds,
                )
              }
            >
              공용방 적용
            </StApplyButton>
            <StDangerButton
              type="button"
              onClick={() => onDeleteSharedWorkspace(workspace.id)}
            >
              공용방 삭제
            </StDangerButton>
          </StCard>
        ))}
        <StCard>
          <StInput
            value={newRoom.name}
            onChange={(event) =>
              onChangeNewRoom({ ...newRoom, name: event.target.value })
            }
            placeholder="새 공용방 이름"
          />
          <StInput
            value={newRoom.password}
            onChange={(event) =>
              onChangeNewRoom({ ...newRoom, password: event.target.value })
            }
            placeholder="새 공용방 비밀번호"
          />
          <StMemberGrid>
            {users.map((user) => {
              const active = newRoom.memberIds.includes(user.id);
              return (
                <StMemberChip
                  key={`new-${user.id}`}
                  type="button"
                  $active={active}
                  onClick={() => onToggleNewRoomMember(user.id)}
                >
                  {user.name}
                </StMemberChip>
              );
            })}
          </StMemberGrid>
          <StApplyButton type="button" onClick={onAddSharedWorkspace}>
            공용방 추가
          </StApplyButton>
        </StCard>
      </StCardList>
    </StSection>
  );
}
