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
}: Props) {
  const monthStart = startOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(endOfMonth(monthStart)),
  });

  const filteredDays = showWeekends
    ? calendarDays
    : calendarDays.filter((day) => !isWeekend(day));
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const filteredWeekDays = showWeekends
    ? weekDays
    : weekDays.filter((_, i) => i !== 0 && i !== 6);
  const today = new Date();

  // ✅ [수정] 배경색과 텍스트 색상(흰색 여부)을 함께 반환
  const getCellStyles = (dateStr: string) => {
    // 1. 특정 아이템 호버 중일 때
    if (hoveredItemId !== null) {
      const isDone = rawLogs?.some(
        (log) => log.item_id === hoveredItemId && log.completed_at === dateStr
      );
      // 완료된 항목 위에서는 진한 색 + 흰 글씨
      return isDone
        ? { bg: themeColor, isDarkBg: true }
        : { bg: "#f3f4f6", isDarkBg: false };
    }

    // 2. 평상시 (농도 보기)
    const log = monthlyLogs?.find((l) => l.date === dateStr);
    const count = log ? log.count : 0;
    const total = totalItemsCount || 1;
    const ratio = count / total;

    // 단계별 색상 및 글자색 지정
    if (ratio === 0) return { bg: "#f3f4f6", isDarkBg: false };
    if (ratio <= 0.3)
      return { bg: hexToRgba(themeColor, 0.3), isDarkBg: false }; // 연하면 검은 글씨
    if (ratio <= 0.6) return { bg: hexToRgba(themeColor, 0.6), isDarkBg: true }; // 중간부터 흰 글씨
    if (ratio < 1) return { bg: hexToRgba(themeColor, 0.85), isDarkBg: true };
    return { bg: themeColor, isDarkBg: true }; // 100%는 진한 색 + 흰 글씨
  };

  return (
    <StCalendarGrid $columns={showWeekends ? 7 : 5}>
      {filteredWeekDays.map((day) => (
        <StWeekDay key={day}>{day}</StWeekDay>
      ))}
      {filteredDays.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const isToday = isSameDay(day, today);

        // ✅ 스타일 계산
        const { bg, isDarkBg } = getCellStyles(dateStr);

        return (
          <StDateCell
            key={dateStr}
            $bgColor={bg}
            $isCurrentMonth={isSameMonth(day, monthStart)}
            $isSelected={isSameDay(day, selectedDate)}
            $borderColor={themeColor}
            onClick={() => onSelectDate(day)}
          >
            {/* ✅ 배경이 어두우면($isDarkBg) 글씨를 흰색으로 */}
            <StDateText $isToday={isToday} $isDarkBg={isDarkBg}>
              {format(day, "d")}
            </StDateText>

            {/* ✅ 배경이 어두우면 점을 흰색으로, 밝으면 테마색으로 */}
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

const StDateCell = styled.div<{
  $bgColor: string;
  $isCurrentMonth: boolean;
  $isSelected: boolean;
  $borderColor: string;
}>`
  position: relative;
  aspect-ratio: 1;
  background-color: ${({ $bgColor }) => $bgColor};
  border-radius: 14px; /* 살짝 더 둥글게 수정 */
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  /* 이번 달이 아니면 투명하게 */
  opacity: ${({ $isCurrentMonth }) => ($isCurrentMonth ? 1 : 0.3)};

  /* 선택된 날짜 테두리 */
  border: 2px solid
    ${({ $isSelected, $borderColor }) =>
      $isSelected ? $borderColor : "transparent"};

  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* 호버 시 그림자 추가 */
    z-index: 10;
  }
`;

// ✅ [수정] 글자색 반전 처리 ($isDarkBg)
const StDateText = styled.span<{ $isToday?: boolean; $isDarkBg: boolean }>`
  font-size: 0.85rem;
  font-weight: ${({ $isToday }) => ($isToday ? "900" : "600")};

  /* 배경이 어두우면 흰색, 아니면 짙은 회색 */
  color: ${({ $isDarkBg }) => ($isDarkBg ? "white" : "#374151")};

  transition: color 0.2s;
`;

// ✅ [수정] 오늘 날짜 점 색상 유동적 변경
const StTodayDot = styled.div<{ $color: string }>`
  position: absolute;
  top: 6px;
  /* 날짜 숫자 아래쪽이나 위쪽에 배치 (디자인 취향에 따라 조정 가능) */
  /* 여기서는 기존 위치 유지하되 색상만 변경 */

  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  opacity: 0.9;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;
