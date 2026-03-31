"use client";

import { useRouter } from "next/navigation";
import styled from "styled-components";

type Props = {
  title: string;
  subtitle?: string;
  infoText?: string;
  monthLabel: string;
  monthRangeLabel: string;
  onOpenNaturalRegister?: () => void;
  onOpenImageRegister?: () => void;
  onOpenManual?: () => void;
  onBack?: () => void;
  onMonthMove?: (diff: number) => void;
};

export default function WorkspaceHeader({
  title,
  subtitle,
  infoText,
  monthLabel,
  monthRangeLabel,
  onOpenNaturalRegister,
  onOpenImageRegister,
  onOpenManual,
  onBack,
  onMonthMove,
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
        <StTitleBlock>
          <StHeaderTitle>{title}</StHeaderTitle>
          {subtitle || infoText ? (
            <StHeaderMetaRow>
              {subtitle ? (
                <StHeaderSubtitle>{subtitle}</StHeaderSubtitle>
              ) : null}
              {infoText ? (
                <StHeaderInfoText>{infoText}</StHeaderInfoText>
              ) : null}
            </StHeaderMetaRow>
          ) : null}
        </StTitleBlock>
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

      <StHeaderRight>
        {onOpenNaturalRegister ? (
          <StPrimaryActionButton type="button" onClick={onOpenNaturalRegister}>
            문장등록
          </StPrimaryActionButton>
        ) : null}
        {onOpenImageRegister ? (
          <StSecondaryActionButton type="button" onClick={onOpenImageRegister}>
            이미지등록
          </StSecondaryActionButton>
        ) : null}
        {onOpenManual ? (
          <StSecondaryActionButton type="button" onClick={onOpenManual}>
            직접등록
          </StSecondaryActionButton>
        ) : null}
      </StHeaderRight>
    </StWorkspaceHeader>
  );
}

const StWorkspaceHeader = styled.header`
  border-bottom: 1px solid #d9dde3;
  background: #f7f8fa;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  padding: 0.7rem 1rem;
  gap: 0.75rem;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    justify-items: stretch;
    padding: 0.8rem 0.75rem;
    gap: 0.65rem;
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const StHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
`;

const StTitleBlock = styled.div`
  min-width: 0;
`;

const StHeaderCenter = styled.div`
  display: flex;
  justify-content: center;
  min-width: 0;

  @media (max-width: 980px) {
    order: 2;
  }
`;

const StHeaderRight = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.55rem;
  flex-wrap: wrap;

  @media (max-width: 980px) {
    order: 3;
    justify-content: flex-start;
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
  font-size: 1.05rem;
  font-weight: 800;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StHeaderSubtitle = styled.p`
  font-size: 0.76rem;
  color: #7b8798;
`;

const StHeaderMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.12rem;
`;

const StHeaderInfoText = styled.p`
  font-size: 0.76rem;
  color: #8a94a6;
`;

const StMonthHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 240px;
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

const StActionButtonBase = styled.button`
  border-radius: 18px;
  padding: 0.8rem 1.05rem;
  font-size: 0.88rem;
  font-weight: 900;
`;

const StPrimaryActionButton = styled(StActionButtonBase)`
  border: 1px solid #4e67d0;
  background: #5f73d9;
  color: #fff;
  box-shadow: 0 8px 20px rgba(74, 103, 204, 0.14);
`;

const StSecondaryActionButton = styled(StActionButtonBase)`
  border: 1px solid #cedbeb;
  background: rgba(255, 255, 255, 0.96);
  color: #506683;
`;
