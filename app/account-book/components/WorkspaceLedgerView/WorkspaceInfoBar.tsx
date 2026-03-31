"use client";

import styled from "styled-components";
import type { WorkspaceType } from "../../types";

type Props = {
  workspaceType: WorkspaceType;
};

export default function WorkspaceInfoBar({
  workspaceType,
}: Props) {
  return (
    <StInfoBar>
      <StInfoText>
        {workspaceType === "personal"
          ? "공용방에서 내가 직접 쓴 내역은 이 화면에 자동 반영됩니다."
          : "공용방은 참가자별 내역을 함께 보고 비교하는 기준 화면입니다."}
      </StInfoText>
    </StInfoBar>
  );
}

const StInfoBar = styled.div`
  display: flex;
  align-items: center;
  min-height: 2.25rem;
  padding: 0 0.15rem;
`;

const StInfoText = styled.p`
  font-size: 0.8rem;
  color: #7a8798;
  line-height: 1.45;
`;
