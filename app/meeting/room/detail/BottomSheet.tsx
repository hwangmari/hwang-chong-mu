"use client";

import styled, { keyframes, css } from "styled-components";
import { format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { UserVote } from "@/types";

interface Props {
  date: Date | null;
  participants: UserVote[];
  onClose: () => void;
  onConfirm: () => void;
}

export default function BottomSheet({
  date,
  participants,
  onClose,
  onConfirm,
}: Props) {
  if (!date) return null;

  // 헬퍼 함수
  const getUnavailablePeople = (d: Date) =>
    participants.filter((p) =>
      p.unavailableDates.some((ud) => isSameDay(ud, d))
    );
  const getAvailablePeople = (d: Date) =>
    participants.filter(
      (p) => !p.unavailableDates.some((ud) => isSameDay(ud, d))
    );

  return (
    <>
      <StOverlay onClick={onClose} />
      <StSheetContainer>
        {/* 드래그 핸들 (시각적 요소) */}
        <StDragHandle />

        <StContentWrapper>
          <StLabel>이 날짜로 정할까요?</StLabel>
          <StDateTitle>
            {format(date, "M월 d일 (E)", { locale: ko })}
          </StDateTitle>

          <StStatsRow>
            <StBadge $variant="gray">
              참석 {getAvailablePeople(date).length}명
            </StBadge>
            <StBadge $variant="red">
              불참 {getUnavailablePeople(date).length}명
            </StBadge>
          </StStatsRow>
        </StContentWrapper>

        <StButtonGroup>
          <StActionButton onClick={onClose} $variant="cancel">
            취소
          </StActionButton>
          <StActionButton onClick={onConfirm} $variant="confirm">
            확정하기 🔨
          </StActionButton>
        </StButtonGroup>
      </StSheetContainer>
    </>
  );
}

// ✨ 스타일 정의 (St 프리픽스)

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
`;

const StOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4); /* bg-black/40 */
  z-index: 40;
  animation: ${fadeIn} 0.3s ease-out;
  cursor: pointer;
`;

const StSheetContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  margin: 0 auto;
  width: 100%;
  max-width: 540px;
  background-color: ${({ theme }) => theme.colors.white};
  z-index: 50;
  border-top-left-radius: 2rem;
  border-top-right-radius: 2rem;
  padding: 2rem 2rem 3rem 2rem; /* p-8 pb-12 */
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  animation: ${slideUp} 0.3s cubic-bezier(0.16, 1, 0.3, 1); /* 부드러운 슬라이드 */
`;

const StDragHandle = styled.div`
  width: 3rem; /* w-12 */
  height: 0.375rem; /* h-1.5 */
  background-color: ${({ theme }) => theme.colors.gray200};
  border-radius: 9999px;
  margin: 0 auto 1.5rem auto; /* mx-auto mb-6 */
`;

const StContentWrapper = styled.div`
  text-align: center;
  margin-bottom: 2rem; /* mb-8 */
`;

const StLabel = styled.p`
  color: ${({ theme }) => theme.colors.gray400};
  font-size: 0.875rem; /* text-sm */
  font-weight: 700;
  margin-bottom: 0.5rem; /* mb-2 */
`;

const StDateTitle = styled.h3`
  font-size: 1.875rem; /* text-3xl */
  font-weight: 900; /* font-black */
  color: ${({ theme }) => theme.colors.gray900};
`;

const StStatsRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem; /* gap-4 */
  margin-top: 1rem; /* mt-4 */
`;

const StBadge = styled.div<{ $variant: "gray" | "red" }>`
  font-size: 0.75rem; /* text-xs */
  padding: 0.25rem 0.75rem; /* px-3 py-1 */
  border-radius: 0.5rem; /* rounded-lg */
  font-weight: 700;

  ${({ $variant, theme }) =>
    $variant === "gray"
      ? css`
          background-color: ${theme.colors.gray100};
          color: ${theme.colors.gray500};
        `
      : css`
          background-color: #fef2f2; /* red-50 */
          color: #f87171; /* red-400 */
        `}
`;

const StButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem; /* gap-3 */
`;

const StActionButton = styled.button<{ $variant: "cancel" | "confirm" }>`
  flex: 1;
  padding: 1rem 0; /* py-4 */
  font-weight: 700;
  border-radius: 1rem; /* rounded-2xl */
  transition: all 0.2s;

  ${({ $variant, theme }) =>
    $variant === "cancel"
      ? css`
          background-color: ${theme.colors.gray100};
          color: ${theme.colors.gray600};
          &:hover {
            background-color: ${theme.colors.gray200};
          }
        `
      : css`
          background-color: ${theme.colors.gray900};
          color: ${theme.colors.white};
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); /* shadow-lg */
          &:hover {
            background-color: ${theme.colors.black};
          }
        `}
`;
