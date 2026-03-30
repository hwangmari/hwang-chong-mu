"use client";

import { AccountBookUser } from "../../types";
import type { UserDraft } from "./types";
import {
  StApplyButton,
  StCard,
  StCardList,
  StDangerButton,
  StInput,
  StSection,
  StSectionTitle,
} from "./styles";

type Props = {
  users: AccountBookUser[];
  userDrafts: Record<string, UserDraft>;
  newUser: UserDraft;
  onChangeUserDraft: (userId: string, nextDraft: UserDraft) => void;
  onChangeNewUser: (nextDraft: UserDraft) => void;
  onUpdateUser: (userId: string, name: string, password: string) => void;
  onDeleteUser: (userId: string) => void;
  onAddUser: () => void;
};

export default function UserSettingsSection({
  users,
  userDrafts,
  newUser,
  onChangeUserDraft,
  onChangeNewUser,
  onUpdateUser,
  onDeleteUser,
  onAddUser,
}: Props) {
  return (
    <StSection>
      <StSectionTitle>참가자</StSectionTitle>
      <StCardList>
        {users.map((user) => (
          <StCard key={user.id}>
            <StInput
              value={userDrafts[user.id]?.name || ""}
              onChange={(event) =>
                onChangeUserDraft(user.id, {
                  ...userDrafts[user.id],
                  name: event.target.value,
                })
              }
              placeholder="사용자 이름"
            />
            <StInput
              value={userDrafts[user.id]?.password || ""}
              onChange={(event) =>
                onChangeUserDraft(user.id, {
                  ...userDrafts[user.id],
                  password: event.target.value,
                })
              }
              placeholder="비밀번호"
            />
            <StApplyButton
              type="button"
              onClick={() =>
                onUpdateUser(
                  user.id,
                  userDrafts[user.id]?.name || user.name,
                  userDrafts[user.id]?.password || user.password,
                )
              }
            >
              사용자 적용
            </StApplyButton>
            <StDangerButton
              type="button"
              onClick={() => onDeleteUser(user.id)}
            >
              사용자 삭제
            </StDangerButton>
          </StCard>
        ))}
        <StCard>
          <StInput
            value={newUser.name}
            onChange={(event) =>
              onChangeNewUser({ ...newUser, name: event.target.value })
            }
            placeholder="새 사용자 이름"
          />
          <StInput
            value={newUser.password}
            onChange={(event) =>
              onChangeNewUser({ ...newUser, password: event.target.value })
            }
            placeholder="새 사용자 비밀번호"
          />
          <StApplyButton type="button" onClick={onAddUser}>
            사용자 추가
          </StApplyButton>
        </StCard>
      </StCardList>
    </StSection>
  );
}
