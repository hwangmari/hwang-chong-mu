import styled from "styled-components";
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
  // ✅ [수정] 변수 선언 중복 제거 및 정리
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);

  // 1. 월간 보기 날짜들
  const monthDays = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  });

  // 2. 주간 보기 날짜들
  const weekDaysRange = eachDayOfInterval({
    start: startOfWeek(selectedDate),
    end: endOfWeek(selectedDate),
  });

  // ✅ 모드에 따라 날짜 범위 결정
  const targetDays = isExpanded ? monthDays : weekDaysRange;

  // 주말 필터링
  const filteredDays = showWeekends
    ? targetDays
    : targetDays.filter((day) => !isWeekend(day));

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const filteredWeekDays = showWeekends
    ? weekDays
    : weekDays.filter((_, i) => i !== 0 && i !== 6);
  const today = new Date();

  const getCellStyles = (dateStr: string) => {
    // 1. 특정 아이템 호버 중일 때
    if (hoveredItemId !== null) {
      const isDone = rawLogs?.some(
        (log) => log.item_id === hoveredItemId && log.completed_at === dateStr
      );
      return isDone
        ? { bg: themeColor, isDarkBg: true }
        : { bg: "#f3f4f6", isDarkBg: false };
    }

    // 2. 평상시 (농도 보기)
    const log = monthlyLogs?.find((l) => l.date === dateStr);
    const count = log ? log.count : 0;
    const total = totalItemsCount || 1;
    const ratio = count / total;

    if (ratio === 0) return { bg: "#f3f4f6", isDarkBg: false };
    if (ratio <= 0.3)
      return { bg: hexToRgba(themeColor, 0.3), isDarkBg: false };
    if (ratio <= 0.6) return { bg: hexToRgba(themeColor, 0.6), isDarkBg: true };
    if (ratio < 1) return { bg: hexToRgba(themeColor, 0.85), isDarkBg: true };
    return { bg: themeColor, isDarkBg: true };
  };

  return (
    <StCalendarGrid $columns={showWeekends ? 7 : 5}>
      {filteredWeekDays.map((day) => (
        <StWeekDay key={day}>{day}</StWeekDay>
      ))}
      {filteredDays.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const isToday = isSameDay(day, today);
        const { bg, isDarkBg } = getCellStyles(dateStr);

        return (
          <StDateCell
            key={dateStr}
            $bgColor={bg}
            // ✅ 여기서 계산된 투명도 값을 넘겨줍니다.
            $opacity={isExpanded ? (isSameMonth(day, monthStart) ? 1 : 0.3) : 1}
            $isSelected={isSameDay(day, selectedDate)}
            $borderColor={themeColor}
            onClick={() => onSelectDate(day)}
          >
            <StDateText $isToday={isToday} $isDarkBg={isDarkBg}>
              {format(day, "d")}
            </StDateText>
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

// ✅ [수정] $isCurrentMonth 제거하고 $opacity만 사용하도록 정리
const StDateCell = styled.div<{
  $bgColor: string;
  $opacity: number;
  $isSelected: boolean;
  $borderColor: string;
}>`
  position: relative;
  aspect-ratio: 1;
  background-color: ${({ $bgColor }) => $bgColor};
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  /* ✅ 수정된 부분: opacity 속성 하나로 통합하고 세미콜론 추가 */
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
`;

const StDateText = styled.span<{ $isToday?: boolean; $isDarkBg: boolean }>`
  font-size: 0.85rem;
  font-weight: ${({ $isToday }) => ($isToday ? "900" : "600")};
  color: ${({ $isDarkBg }) => ($isDarkBg ? "white" : "#374151")};
  transition: color 0.2s;
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
