"use client";

import styled from "styled-components";
import type { WorkspaceType } from "../../types";

type Props = {
  workspaceType: WorkspaceType;
  memberNames: string[];
  onOpenNaturalRegister: () => void;
  onOpenImageRegister: () => void;
  onOpenManual: () => void;
};

export default function WorkspaceInfoBar({
  workspaceType,
  memberNames,
  onOpenNaturalRegister,
  onOpenImageRegister,
  onOpenManual,
}: Props) {
  return (
    <StInfoBar>
      <StInfoContent>
        <StInfoPill>
          {workspaceType === "personal" ? "개인 가계부" : "공용 가계부방"}
        </StInfoPill>
        <StInfoPill>멤버 {memberNames.join(", ") || "미설정"}</StInfoPill>
        {workspaceType === "personal" ? (
          <StInfoText>
            공용방에서 내가 직접 쓴 내역은 이 화면에 자동 반영됩니다.
          </StInfoText>
        ) : (
          <StInfoText>
            공용방은 참가자별 내역을 함께 보고 비교하는 기준 화면입니다.
          </StInfoText>
        )}
      </StInfoContent>

      <StActions>
        <StPrimaryButton type="button" onClick={onOpenNaturalRegister}>
          문장등록
        </StPrimaryButton>
        <StSecondaryButton type="button" onClick={onOpenImageRegister}>
          이미지등록
        </StSecondaryButton>
        <StSecondaryButton type="button" onClick={onOpenManual}>
          직접등록
        </StSecondaryButton>
      </StActions>
    </StInfoBar>
  );
}

const StInfoBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 960px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const StInfoContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
`;

const StInfoPill = styled.span`
  border-radius: 999px;
  background: #fff;
  border: 1px solid #d7e2ef;
  padding: 0.35rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: #51637d;
`;

const StInfoText = styled.p`
  font-size: 0.82rem;
  color: #7a8798;
`;

const StActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.55rem;

  @media (max-width: 960px) {
    justify-content: flex-start;
  }
`;

const StActionButtonBase = styled.button`
  border-radius: 14px;
  padding: 0.75rem 1rem;
  font-size: 0.88rem;
  font-weight: 900;
`;

const StPrimaryButton = styled(StActionButtonBase)`
  border: 1px solid #4e67d0;
  background: #5f73d9;
  color: #fff;
  box-shadow: 0 8px 20px rgba(74, 103, 204, 0.14);
`;

const StSecondaryButton = styled(StActionButtonBase)`
  border: 1px solid #cedbeb;
  background: rgba(255, 255, 255, 0.96);
  color: #506683;
`;
