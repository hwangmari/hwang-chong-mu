import styled, { css } from "styled-components"; // 👈 1. { css } 추가
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWeekend,
} from "date-fns";

interface Props {
  currentDate: Date;
  selectedDate: Date;
  showWeekends: boolean;
  themeColor: string;
  monthlyLogs: { date: string; count: number }[];
  totalItemsCount: number;
  onSelectDate: (date: Date) => void;
  hoveredItemId: number | null;
  rawLogs: { item_id: number; completed_at: string }[];
  isExpanded: boolean;
}

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function CalendarGrid({
  currentDate,
  selectedDate,
  showWeekends,
  themeColor,
  monthlyLogs = [],
  totalItemsCount,
  onSelectDate,
  hoveredItemId,
  rawLogs = [],
  isExpanded,
}: Props) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);

  const monthDays = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  });

  const weekDaysRange = eachDayOfInterval({
    start: startOfWeek(selectedDate),
    end: endOfWeek(selectedDate),
  });

  const targetDays = isExpanded ? monthDays : weekDaysRange;

  const filteredDays = showWeekends
    ? targetDays
    : targetDays.filter((day) => !isWeekend(day));

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const filteredWeekDays = showWeekends
    ? weekDays
    : weekDays.filter((_, i) => i !== 0 && i !== 6);
  const today = new Date();

  // 배경색 및 텍스트 색상 결정 로직
  const getCellStyles = (
    dateStr: string
  ): { bg: string; isDarkBg: boolean; isHoverTarget?: boolean } => {
    // [1] 일단 원래의 농도(Heatmap) 색상을 먼저 계산해둡니다.
    const log = monthlyLogs?.find((l) => l.date === dateStr);
    const count = log ? log.count : 0;
    const total = totalItemsCount || 1;
    const ratio = count / total;

    let originalStyle = { bg: "#f3f4f6", isDarkBg: false }; // 기본값

    if (ratio > 0) {
      if (ratio <= 0.3) {
        originalStyle = { bg: hexToRgba(themeColor, 0.3), isDarkBg: false };
      } else if (ratio <= 0.6) {
        originalStyle = { bg: hexToRgba(themeColor, 0.6), isDarkBg: true };
      } else if (ratio < 1) {
        originalStyle = { bg: hexToRgba(themeColor, 0.85), isDarkBg: true };
      } else {
        originalStyle = { bg: themeColor, isDarkBg: true };
      }
    }

    // [2] 호버 상태 체크
    if (hoveredItemId !== null) {
      const isDone = rawLogs?.some(
        (log) => log.item_id === hoveredItemId && log.completed_at === dateStr
      );

      if (isDone) {
        // ✅ 수행한 날: 원래 농도 색상 유지 + 강조 효과(isHoverTarget: true)
        return {
          ...originalStyle,
          isHoverTarget: true,
        };
      } else {
        // ✂️ 수행 안 한 날: 색상을 날려버림 (기본 회색으로 리셋)
        return {
          bg: "#f3f4f6",
          isDarkBg: false,
          isHoverTarget: false,
        };
      }
    }

    // [3] 호버 안 했을 때는 원래 계산한 스타일 반환
    return originalStyle;
  };

  return (
    <StCalendarGrid $columns={showWeekends ? 7 : 5}>
      {filteredWeekDays.map((day) => (
        <StWeekDay key={day}>{day}</StWeekDay>
      ))}
      {filteredDays.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const isToday = isSameDay(day, today);

        const { bg, isDarkBg, isHoverTarget } = getCellStyles(dateStr);

        const log = monthlyLogs?.find((l) => l.date === dateStr);
        const count = log?.count ?? 0;
        const total = totalItemsCount || 1;
        const percentage = Math.round((count / total) * 100);

        return (
          <StDateCell
            key={dateStr}
            $bgColor={bg}
            $opacity={isExpanded ? (isSameMonth(day, monthStart) ? 1 : 0.3) : 1}
            $isSelected={isSameDay(day, selectedDate)}
            $borderColor={themeColor}
            onClick={() => onSelectDate(day)}
            $isHoverTarget={isHoverTarget}
          >
            <StDateText $isToday={isToday} $isDarkBg={isDarkBg}>
              {format(day, "d")}
            </StDateText>

            {percentage > 0 && (
              <StRateText $isDarkBg={isDarkBg}>{percentage}%</StRateText>
            )}

            {isToday && <StTodayDot $color={isDarkBg ? "white" : themeColor} />}
          </StDateCell>
        );
      })}
    </StCalendarGrid>
  );
}

// ✨ 스타일 정의
const StCalendarGrid = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, 1fr);
  gap: 8px;
  margin-bottom: 2rem;
  transition: all 0.3s ease;
`;

const StWeekDay = styled.div`
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 0.5rem;
`;

// 👈 4. $isHoverTarget 타입 추가 (옵셔널 ? 로 처리)
const StDateCell = styled.div<{
  $bgColor: string;
  $opacity: number;
  $isSelected: boolean;
  $borderColor: string;
  $isHoverTarget?: boolean;
}>`
  position: relative;
  background-color: ${({ $bgColor }) => $bgColor};
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  min-height: 70px;
  cursor: pointer;
  opacity: ${({ $opacity }) => $opacity};

  /* 선택된 날짜 테두리 */
  border: 2px solid
    ${({ $isSelected, $borderColor }) =>
      $isSelected ? $borderColor : "transparent"};

  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 10;
  }

  /* 조건부 css 적용 */
  ${(props) =>
    props.$isHoverTarget &&
    css`
      transform: scale(1.02);
      z-index: 15;
      border: 1px solid #000;
      box-shadow: 0 4px 6px rgba(59, 59, 59, 0.4);
    `}
`;

const StDateText = styled.span<{ $isToday?: boolean; $isDarkBg: boolean }>`
  font-size: 1rem;
  font-weight: ${({ $isToday }) => ($isToday ? "900" : "600")};
  color: ${({ $isDarkBg }) => ($isDarkBg ? "white" : "#374151")};
  transition: color 0.2s;
  margin-bottom: 2px;
`;

const StRateText = styled.span<{ $isDarkBg: boolean }>`
  font-size: 0.5rem;
  font-weight: 500;
  color: ${({ $isDarkBg }) =>
    $isDarkBg ? "rgba(255, 255, 255, 0.9)" : "#6b7280"};
  position: absolute;
  bottom: 10px;
`;

const StTodayDot = styled.div<{ $color: string }>`
  position: absolute;
  top: 6px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  opacity: 0.9;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;
