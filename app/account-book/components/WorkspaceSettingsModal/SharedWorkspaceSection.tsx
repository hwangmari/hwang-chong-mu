"use client";

import { AccountBookUser, AccountBookWorkspace } from "../../types";
import type { RoomDraft, UserDraft } from "./types";
import {
  StApplyButton,
  StButtonRow,
  StCard,
  StCardList,
  StDangerButton,
  StDescription,
  StInlineLabel,
  StInput,
  StMetaText,
  StParticipantCard,
  StParticipantList,
  StSection,
  StSectionTitle,
  StSubTitle,
} from "./styles";

type Props = {
  activeUser: AccountBookUser;
  users: AccountBookUser[];
  sharedWorkspaces: AccountBookWorkspace[];
  newSharedRoomDraft: RoomDraft;
  roomDrafts: Record<string, RoomDraft>;
  memberDrafts: Record<string, Record<string, UserDraft>>;
  newMemberDrafts: Record<string, UserDraft>;
  onChangeNewSharedRoomDraft: (nextDraft: RoomDraft) => void;
  onCreateSharedWorkspace: () => void;
  onChangeRoomDraft: (workspaceId: string, nextDraft: RoomDraft) => void;
  onChangeMemberDraft: (userId: string, nextDraft: UserDraft) => void;
  onChangeNewMemberDraft: (workspaceId: string, nextDraft: UserDraft) => void;
  onUpdateSharedWorkspace: (
    workspaceId: string,
    name: string,
    password: string,
  ) => void;
  onUpdateUser: (userId: string, name: string, password: string) => void;
  onAddRoomMember: (workspaceId: string) => void;
  onRemoveRoomMember: (workspaceId: string, userId: string) => void;
  onDeleteSharedWorkspace: (workspaceId: string) => void;
};

export default function SharedWorkspaceSection({
  activeUser,
  users,
  sharedWorkspaces,
  newSharedRoomDraft,
  roomDrafts,
  memberDrafts,
  newMemberDrafts,
  onChangeNewSharedRoomDraft,
  onCreateSharedWorkspace,
  onChangeRoomDraft,
  onChangeMemberDraft,
  onChangeNewMemberDraft,
  onUpdateSharedWorkspace,
  onUpdateUser,
  onAddRoomMember,
  onRemoveRoomMember,
  onDeleteSharedWorkspace,
}: Props) {
  return (
    <StSection>
      <StSectionTitle>서버방 참가자 관리</StSectionTitle>
      <StDescription>
        개인으로 시작했더라도 여기서 현재 계정 기준 공용방을 새로 추가할 수 있고,
        참여 중인 서버방 참가자도 함께 관리할 수 있습니다.
      </StDescription>
      <StCardList>
        <StCard>
          <StSubTitle>새 공용방 만들기</StSubTitle>
          <StMetaText>
            {activeUser.name} 님 계정을 그대로 유지한 채 공용 가계부방만 추가합니다.
          </StMetaText>
          <StInput
            value={newSharedRoomDraft.name}
            onChange={(event) =>
              onChangeNewSharedRoomDraft({
                ...newSharedRoomDraft,
                name: event.target.value,
              })
            }
            placeholder="공용방 이름"
          />
          <StInput
            value={newSharedRoomDraft.password}
            type="password"
            autoComplete="new-password"
            onChange={(event) =>
              onChangeNewSharedRoomDraft({
                ...newSharedRoomDraft,
                password: event.target.value,
              })
            }
            placeholder="공용방 비밀번호"
          />
          <StApplyButton type="button" onClick={onCreateSharedWorkspace}>
            공용방 추가 만들기
          </StApplyButton>
        </StCard>

        {sharedWorkspaces.length === 0 ? (
          <StCard>
            <StSubTitle>참여 중인 공용방 없음</StSubTitle>
            <StMetaText>
              아직 {activeUser.name} 님이 참여 중인 공용방이 없습니다. 위에서 새
              공용방을 만들면 바로 여기에 추가됩니다.
            </StMetaText>
          </StCard>
        ) : null}

        {sharedWorkspaces.map((workspace) => (
          <StCard key={workspace.id}>
            <StInlineLabel>
              초대 코드 {workspace.inviteCode || "미발급"}
            </StInlineLabel>
            <StInput
              value={roomDrafts[workspace.id]?.name || workspace.name}
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
              type="password"
              autoComplete="current-password"
              onChange={(event) =>
                onChangeRoomDraft(workspace.id, {
                  ...roomDrafts[workspace.id],
                  password: event.target.value,
                })
              }
              placeholder="공용방 비밀번호"
            />
            <StButtonRow>
              <StApplyButton
                type="button"
                onClick={() =>
                  onUpdateSharedWorkspace(
                    workspace.id,
                    roomDrafts[workspace.id]?.name.trim() || workspace.name,
                    roomDrafts[workspace.id]?.password.trim() || workspace.password,
                  )
                }
              >
                방 정보 적용
              </StApplyButton>
              <StDangerButton
                type="button"
                onClick={() => onDeleteSharedWorkspace(workspace.id)}
              >
                공용방 삭제
              </StDangerButton>
            </StButtonRow>

            <StSubTitle>참여 사용자</StSubTitle>
            <StMetaText>
              현재 {workspace.memberIds.length}명이 이 방을 사용 중입니다.
            </StMetaText>
            <StParticipantList>
              {workspace.memberIds.map((memberId) => {
                const user = users.find((candidate) => candidate.id === memberId);
                if (!user) return null;
                const draft = memberDrafts[workspace.id]?.[user.id] || {
                  name: user.name,
                  password: user.password,
                };

                return (
                  <StParticipantCard key={`${workspace.id}-${user.id}`}>
                    <StSubTitle>{user.name}</StSubTitle>
                    <StMetaText>
                      이 방에서 사용하는 닉네임과 비밀번호를 수정합니다.
                    </StMetaText>
                    <StInput
                      value={draft.name}
                      onChange={(event) =>
                        onChangeMemberDraft(user.id, {
                          ...draft,
                          name: event.target.value,
                        })
                      }
                      placeholder="사용자 이름"
                    />
                    <StInput
                      value={draft.password}
                      type="password"
                      autoComplete="current-password"
                      onChange={(event) =>
                        onChangeMemberDraft(user.id, {
                          ...draft,
                          password: event.target.value,
                        })
                      }
                      placeholder="사용자 비밀번호"
                    />
                    <StButtonRow>
                      <StApplyButton
                        type="button"
                        onClick={() =>
                          onUpdateUser(
                            user.id,
                            draft.name.trim() || user.name,
                            draft.password.trim() || user.password,
                          )
                        }
                      >
                        참가자 적용
                      </StApplyButton>
                      <StDangerButton
                        type="button"
                        disabled={workspace.memberIds.length <= 1}
                        onClick={() => onRemoveRoomMember(workspace.id, user.id)}
                      >
                        방에서 제외
                      </StDangerButton>
                    </StButtonRow>
                  </StParticipantCard>
                );
              })}

              <StParticipantCard>
                <StSubTitle>새 참여자 추가</StSubTitle>
                <StMetaText>
                  참여 코드를 몰라도 이 서버방에 바로 쓸 사용자를 만들어 붙입니다.
                </StMetaText>
                <StInput
                  value={newMemberDrafts[workspace.id]?.name || ""}
                  onChange={(event) =>
                    onChangeNewMemberDraft(workspace.id, {
                      ...(newMemberDrafts[workspace.id] || {
                        name: "",
                        password: "",
                      }),
                      name: event.target.value,
                    })
                  }
                  placeholder="새 사용자 이름"
                />
                <StInput
                  value={newMemberDrafts[workspace.id]?.password || ""}
                  type="password"
                  autoComplete="new-password"
                  onChange={(event) =>
                    onChangeNewMemberDraft(workspace.id, {
                      ...(newMemberDrafts[workspace.id] || {
                        name: "",
                        password: "",
                      }),
                      password: event.target.value,
                    })
                  }
                  placeholder="새 사용자 비밀번호"
                />
                <StApplyButton
                  type="button"
                  onClick={() => onAddRoomMember(workspace.id)}
                >
                  이 방에 사용자 추가
                </StApplyButton>
              </StParticipantCard>
            </StParticipantList>
          </StCard>
        ))}
      </StCardList>
    </StSection>
  );
}
