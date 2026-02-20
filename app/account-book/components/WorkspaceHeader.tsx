"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";

type Props = {
  title: string;
  monthLabel: string;
  monthRangeLabel: string;
  showActions?: boolean;
  onBack?: () => void;
  onMonthMove?: (diff: number) => void;
  onLoadSeed?: () => void;
};

export default function WorkspaceHeader({
  title,
  monthLabel,
  monthRangeLabel,
  showActions = true,
  onBack,
  onMonthMove,
  onLoadSeed,
}: Props) {
  const router = useRouter();

  return (
    <StWorkspaceHeader>
      <StHeaderLeft>
        <StBackButton
          type="button"
          aria-label="뒤로 가기"
          onClick={() => {
            if (onBack) onBack();
            else router.push("/");
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m14.71 6.71-1.42-1.42L6.59 12l6.7 6.71 1.42-1.42L9.41 12z" />
          </svg>
        </StBackButton>
        <StHeaderTitle>{title}</StHeaderTitle>
      </StHeaderLeft>

      <StHeaderCenter>
        <StMonthHeader>
          <StMonthButton type="button" onClick={() => onMonthMove?.(-1)}>
            <StChevronIcon viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </StChevronIcon>
          </StMonthButton>
          <StMonthInfo>
            <StMonthTitle>{monthLabel}</StMonthTitle>
            <StMonthRange>{monthRangeLabel}</StMonthRange>
          </StMonthInfo>
          <StMonthButton type="button" onClick={() => onMonthMove?.(1)}>
            <StChevronIcon viewBox="0 0 24 24" aria-hidden="true">
              <path d="m8.59 16.59 1.41 1.41 6-6-6-6-1.41 1.41L13.17 12z" />
            </StChevronIcon>
          </StMonthButton>
        </StMonthHeader>
      </StHeaderCenter>

      {showActions && (
        <StHeaderRight>
          <StTopActions>
            <StSeedButton type="button" onClick={onLoadSeed}>
              샘플 데이터 다시 넣기
            </StSeedButton>
          </StTopActions>
        </StHeaderRight>
      )}
    </StWorkspaceHeader>
  );
}

const StWorkspaceHeader = styled.header`
  height: 72px;
  border-bottom: 1px solid #d9dde3;
  background: #f7f8fa;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  padding: 0 1rem;
  gap: 0.75rem;
  @media (max-width: 720px) {
    height: 56px;
    padding: 0 0.65rem;
    grid-template-columns: 1fr;
    gap: 0.4rem;
  }
`;

const StHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
`;
const StHeaderCenter = styled.div`
  display: flex;
  justify-content: center;
  min-width: 0;
  @media (max-width: 720px) {
    display: none;
  }
`;

const StBackButton = styled.button`
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #5f6675;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  svg {
    width: 1.25rem;
    height: 1.25rem;
    fill: currentColor;
  }
`;

const StHeaderTitle = styled.h1`
  font-size: 1.45rem;
  font-weight: 800;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media (max-width: 720px) {
    font-size: 1rem;
  }
`;

const StHeaderRight = styled.div`
  display: inline-flex;
  padding: 0.4rem 0.65rem;
  @media (max-width: 720px) {
    display: none;
  }
`;

const StTopActions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;
`;
const StSeedButton = styled.button`
  border: 1px solid #cdd9e5;
  background: #fff;
  color: #5c6b7f;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.45rem 0.8rem;
`;

const StMonthHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 220px;
  justify-content: space-between;
`;
const StMonthButton = styled.button`
  width: 2.3rem;
  height: 2.3rem;
  border-radius: 999px;
  border: 1px solid #dce3eb;
  background: #fff;
  font-size: 1.3rem;
  color: #4b5563;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;
const StChevronIcon = styled.svg`
  width: 1.35rem;
  height: 1.35rem;
  fill: currentColor;
`;
const StMonthInfo = styled.div`
  text-align: center;
`;
const StMonthTitle = styled.h2`
  font-size: 1.15rem;
  font-weight: 800;
  color: #1f2937;
`;
const StMonthRange = styled.p`
  font-size: 0.75rem;
  color: #8a94a6;
`;
