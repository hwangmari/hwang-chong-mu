"use client";

import styled from "styled-components";
import { AccountBookUser, AccountBookWorkspace } from "../types";

type Props = {
  users: AccountBookUser[];
  workspaces: AccountBookWorkspace[];
  onSelectWorkspace: (workspaceId: string) => void;
  onOpenManage: () => void;
};

export default function WorkspaceHub({
  users,
  workspaces,
  onSelectWorkspace,
  onOpenManage,
}: Props) {
  const personalWorkspaces = workspaces.filter(
    (workspace) => workspace.type === "personal",
  );
  const sharedWorkspaces = workspaces.filter(
    (workspace) => workspace.type === "shared",
  );

  const getMembersLabel = (workspace: AccountBookWorkspace) =>
    workspace.memberIds
      .map((memberId) => users.find((user) => user.id === memberId)?.name)
      .filter(Boolean)
      .join(", ");

  return (
    <StPage>
      <StHeader>
        <div>
          <StEyebrow>Account Book Hub</StEyebrow>
          <StTitle>공용 가계부 중심 허브</StTitle>
          <StDescription>
            공용 가계부방이 큰 틀이고, 각 방 안에서 참가자 1, 2, +a 기준으로
            함께 기록하고 비교합니다.
          </StDescription>
        </div>
        <StManageButton type="button" onClick={onOpenManage}>
          사용자 / 공용방 설정
        </StManageButton>
      </StHeader>

      <StSection>
        <StSectionTitle>공용 가계부방</StSectionTitle>
        <StGrid>
          {sharedWorkspaces.map((workspace) => (
            <StCard
              key={workspace.id}
              type="button"
              onClick={() => onSelectWorkspace(workspace.id)}
            >
              <StCardType>SHARED ROOM</StCardType>
              <StCardTitle>{workspace.name}</StCardTitle>
              <StCardMeta>
                참가자 {getMembersLabel(workspace) || "미설정"}
              </StCardMeta>
              <StMemberPreview>
                {workspace.memberIds.map((memberId) => {
                  const label =
                    users.find((user) => user.id === memberId)?.name ||
                    "참가자";
                  return (
                    <span key={`${workspace.id}-${memberId}`}>{label}</span>
                  );
                })}
              </StMemberPreview>
              <StCardHint>
                방 안에서 `전체 / 참가자별`로 필터링해서 생활비와 사용내역을
                바로 볼 수 있습니다.
              </StCardHint>
            </StCard>
          ))}
        </StGrid>
      </StSection>

      <StSection>
        <StSectionTitle>개인 동기화 작업공간</StSectionTitle>
        <StSectionDescription>
          개인 작업공간은 공용방과 연결되는 원본 기록 용도로 유지됩니다.
        </StSectionDescription>
        <StGrid>
          {personalWorkspaces.map((workspace) => (
            <StCard
              key={workspace.id}
              type="button"
              onClick={() => onSelectWorkspace(workspace.id)}
            >
              <StCardType>PERSONAL</StCardType>
              <StCardTitle>{workspace.name}</StCardTitle>
              <StCardMeta>
                작성자 {getMembersLabel(workspace) || "미설정"}
              </StCardMeta>
              <StCardHint>
                개인 기준 원본 기록을 관리하고, 필요한 항목만 공용 가계부방으로
                연결합니다.
              </StCardHint>
            </StCard>
          ))}
        </StGrid>
      </StSection>
    </StPage>
  );
}

const StPage = styled.main`
  min-height: 100vh;
  padding: 1.25rem;
  background:
    radial-gradient(
      circle at top left,
      rgba(109, 135, 239, 0.16),
      transparent 28%
    ),
    linear-gradient(180deg, #f6f8fc 0%, #edf2f8 100%);
`;

const StHeader = styled.header`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1.2rem;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

const StEyebrow = styled.p`
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7083a1;
`;

const StTitle = styled.h1`
  margin-top: 0.25rem;
  font-size: 2rem;
  font-weight: 900;
  color: #1f2937;
`;

const StDescription = styled.p`
  margin-top: 0.45rem;
  max-width: 42rem;
  font-size: 0.92rem;
  line-height: 1.6;
  color: #66758b;
`;

const StManageButton = styled.button`
  border: 1px solid #cad8ea;
  background: #fff;
  color: #49628b;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-size: 0.86rem;
  font-weight: 800;
`;

const StSection = styled.section`
  margin-top: 1.1rem;
`;

const StSectionTitle = styled.h2`
  font-size: 1.05rem;
  font-weight: 900;
  color: #253348;
  margin-bottom: 0.7rem;
`;

const StSectionDescription = styled.p`
  margin-bottom: 0.7rem;
  font-size: 0.82rem;
  color: #748297;
`;

const StGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const StCard = styled.button`
  text-align: left;
  min-height: 13rem;
  border: 1px solid #d8e1ee;
  border-radius: 22px;
  padding: 1rem;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98),
    rgba(244, 248, 253, 0.98)
  );
  box-shadow: 0 18px 45px rgba(71, 95, 140, 0.08);
`;

const StCardType = styled.span`
  display: inline-flex;
  border-radius: 999px;
  background: #eef4ff;
  color: #4b69bb;
  font-size: 0.72rem;
  font-weight: 900;
  padding: 0.28rem 0.55rem;
`;

const StCardTitle = styled.h3`
  margin-top: 0.85rem;
  font-size: 1.2rem;
  font-weight: 900;
  color: #1f2937;
`;

const StCardMeta = styled.p`
  margin-top: 0.4rem;
  font-size: 0.85rem;
  color: #5f718b;
  font-weight: 700;
`;

const StCardHint = styled.p`
  margin-top: 1rem;
  font-size: 0.82rem;
  line-height: 1.55;
  color: #7b899d;
`;

const StMemberPreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.8rem;

  span {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    background: #eef4ff;
    color: #4d66a7;
    padding: 0.22rem 0.48rem;
    font-size: 0.72rem;
    font-weight: 800;
  }
`;
