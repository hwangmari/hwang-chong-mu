"use client";

import styled, { css } from "styled-components";
import { format, isSameDay } from "date-fns";
import { UserVote } from "@/types";

interface Props {
  dates: (Date | null)[];
  participants: UserVote[];
  currentUnavailable: Date[];
  step: "VOTING" | "CONFIRM";
  currentName: string;
  finalDate: Date | null;
  includeWeekend: boolean;
  onToggleDate: (date: Date) => void;
  hoveredUserId: string | number | null;
}

export default function CalendarGrid({
  dates,
  participants,
  currentUnavailable,
  step,
  currentName,
  finalDate,
  includeWeekend,
  onToggleDate,
  hoveredUserId,
}: Props) {
  const getUnavailableCount = (date: Date) =>
    participants.filter((p) =>
      p.unavailableDates.some((ud) => isSameDay(ud, date))
    ).length;

  const firstDateIndex = dates.findIndex((d) => d !== null);

  const weekDays = includeWeekend
    ? ["일", "월", "화", "수", "목", "금", "토"]
    : ["월", "화", "수", "목", "금"];
  const hoveredUser = participants.find((p) => p.id === hoveredUserId);
  return (
    <StGridContainer $step={step}>
      {/* 요일 헤더 */}
      <StWeekHeader $includeWeekend={includeWeekend}>
        {weekDays.map((day) => (
          <StWeekDay key={day}>{day}</StWeekDay>
        ))}
      </StWeekHeader>

      {/* 날짜 그리드 */}
      <StDaysGrid $includeWeekend={includeWeekend}>
        {dates.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} />;

          const unavailableCount = getUnavailableCount(date);
          const totalParticipants = participants.length;
          const intensity =
            totalParticipants > 0 ? unavailableCount / totalParticipants : 0;

          // 상태 계산
          const isMySelection =
            step === "VOTING" &&
            currentUnavailable.some((d) => isSameDay(d, date));

          const isFinalSelected =
            step === "CONFIRM" && finalDate && isSameDay(finalDate, date);

          const isBestDate = step === "CONFIRM" && unavailableCount === 0;
          const isHoveredDate = hoveredUser?.unavailableDates.some((ud) =>
            isSameDay(ud, date)
          );
          // 배경색 로직 (Typing 모드일 땐 회색, 아닐 땐 붉은색)
          const isTypingMode = step === "VOTING" && currentName.length > 0;
          const baseColor = isTypingMode ? "209, 213, 219" : "251, 113, 133";
          const dynamicBg = `rgba(${baseColor}, ${intensity * 0.9})`;

          const dayString = format(date, "d");
          const showMonth = dayString === "1" || index === firstDateIndex;

          return (
            <StDateButton
              key={date.toISOString()}
              onClick={() => onToggleDate(date)}
              $isMySelection={isMySelection}
              $isFinalSelected={!!isFinalSelected}
              $isBestDate={isBestDate}
              $dynamicBg={dynamicBg}
              $unavailableCount={unavailableCount}
              $isHoveredDate={!!isHoveredDate}
            >
              {/* 날짜 텍스트 (월/일) */}
              <StDateText>
                {showMonth && (
                  <StMonthLabel>{format(date, "M월")}</StMonthLabel>
                )}
                {dayString}
              </StDateText>

              {/* 불가능 인원 수 뱃지 */}
              {!isFinalSelected && unavailableCount > 0 && (
                <StCountBadge $isTypingMode={isTypingMode}>
                  {unavailableCount}
                </StCountBadge>
              )}

              {/* 추천 뱃지 (확정 단계에서 불가능 0명일 때) */}
              {step === "CONFIRM" &&
                unavailableCount === 0 &&
                !isFinalSelected && <StRecommendBadge>추천👍</StRecommendBadge>}
            </StDateButton>
          );
        })}
      </StDaysGrid>
    </StGridContainer>
  );
}

// ✨ 스타일 정의 (St 프리픽스)

const StGridContainer = styled.div<{ $step: "VOTING" | "CONFIRM" }>`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.white};
  padding: 1rem; /* p-4 */
  border-radius: 2rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); /* shadow-lg */
  border: 2px solid;
  margin-bottom: 1.5rem; /* mb-6 */
  transition: border-color 0.3s, box-shadow 0.3s;

  ${({ $step, theme }) =>
    $step === "CONFIRM"
      ? css`
          border-color: ${theme.colors.gray900};
          box-shadow: 0 4px 6px -1px rgba(209, 213, 219, 0.5); /* shadow-gray-300 */
        `
      : css`
          border-color: ${theme.colors.gray100};
        `}

  @media ${({ theme }) => theme.media.desktop} {
    padding: 1.5rem; /* sm:p-6 */
  }
`;

// 그리드 레이아웃 공통 믹스인
const gridLayout = css<{ $includeWeekend: boolean }>`
  display: grid;
  grid-template-columns: ${({ $includeWeekend }) =>
    $includeWeekend ? "repeat(7, 1fr)" : "repeat(5, 1fr)"};
  gap: 0.75rem; /* gap-3 */
`;

const StWeekHeader = styled.div<{ $includeWeekend: boolean }>`
  ${gridLayout}
  margin-bottom: 0.75rem; /* mb-3 */
  padding-bottom: 0.5rem; /* pb-2 */
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};
`;

const StWeekDay = styled.div`
  text-align: center;
  font-size: 0.75rem; /* text-xs */
  font-weight: 800; /* font-extrabold */
  color: ${({ theme }) => theme.colors.gray400};

  @media ${({ theme }) => theme.media.desktop} {
    font-size: 0.875rem; /* sm:text-sm */
  }
`;

const StDaysGrid = styled.div<{ $includeWeekend: boolean }>`
  ${gridLayout}
`;

// 날짜 버튼 (핵심 스타일)
const StDateButton = styled.button<{
  $isMySelection: boolean;
  $isFinalSelected: boolean;
  $isBestDate: boolean;
  $dynamicBg: string;
  $unavailableCount: number;
  $isHoveredDate: boolean;
}>`
  position: relative;
  aspect-ratio: 1 / 1; /* aspect-square */
  border-radius: 0.75rem; /* rounded-xl */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  border: 1px solid transparent;

  /* 1. 배경색 우선순위 로직 */
  background-color: ${({
    $isFinalSelected,
    $isMySelection,
    $dynamicBg,
    theme,
  }) => {
    if ($isFinalSelected) return theme.colors.gray900;
    if ($isMySelection) return theme.colors.white;
    return $dynamicBg; // 계산된 열지도 색상
  }};

  /* 2. 텍스트 색상 우선순위 로직 */
  color: ${({ $isFinalSelected, $isMySelection, $unavailableCount, theme }) => {
    if ($isFinalSelected) return theme.colors.white;
    if ($isMySelection) return theme.colors.black;
    if ($unavailableCount > 0) return theme.colors.white; // 배경이 진하므로 글자는 흰색
    return theme.colors.gray500; // 기본 (배경 없을 때)
  }};
  ${({ $isHoveredDate }) =>
    $isHoveredDate &&
    css`
      transform: scale(1.05);
      z-index: 15;
      border: 1px solid #000;
      box-shadow: 0 4px 6px rgba(59, 59, 59, 0.4);
    `}

  /* 3. 테두리 및 효과 로직 */
  ${({ $isMySelection, theme }) =>
    $isMySelection &&
    css`
      border: 2px solid ${theme.colors.black};
      z-index: 10;
    `}

  ${({ $isFinalSelected, theme }) =>
    $isFinalSelected &&
    css`
      border: 1px solid ${theme.colors.gray900};
      transform: scale(1.1);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); /* shadow-xl */
      z-index: 20;
    `}

  ${({ $isBestDate, $isFinalSelected, theme }) =>
    $isBestDate &&
    !$isFinalSelected &&
    css`
      box-shadow: 0 0 0 2px ${theme.colors.gray400}; /* ring-2 ring-gray-400 */
    `}

  @media ${({ theme }) => theme.media.desktop} {
    border-radius: 1rem; /* sm:rounded-2xl */
  }
`;

const StDateText = styled.span`
  font-size: 0.875rem; /* text-sm */
  font-weight: 700;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media ${({ theme }) => theme.media.desktop} {
    font-size: 1rem; /* sm:text-base */
  }
`;

const StMonthLabel = styled.span`
  position: absolute;
  top: -0.8rem; /* 모바일 위치 조정 */
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.625rem; /* text-[10px] */
  line-height: 1;
  white-space: nowrap;

  @media ${({ theme }) => theme.media.desktop} {
    top: -1rem;
    font-size: 0.75rem; /* sm:text-xs */
  }
`;

const StCountBadge = styled.span<{ $isTypingMode: boolean }>`
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.5625rem; /* text-[9px] */
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  background-color: ${
    ({ $isTypingMode, theme }) =>
      $isTypingMode ? theme.colors.gray400 : "#fb7185" /* rose-400 */
  };

  @media ${({ theme }) => theme.media.desktop} {
    font-size: 0.625rem; /* sm:text-[10px] */
  }
`;

const StRecommendBadge = styled.span`
  position: absolute;
  top: -0.5rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${({ theme }) => theme.colors.gray800};
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.5rem; /* text-[8px] */
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  z-index: 30;
  white-space: nowrap;

  @media ${({ theme }) => theme.media.desktop} {
    font-size: 0.5625rem; /* sm:text-[9px] */
  }
`;
