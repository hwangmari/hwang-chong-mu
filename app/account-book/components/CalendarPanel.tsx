"use client";

import { format } from "date-fns";
import styled from "styled-components";
type Props = {
  currentMonth: Date;
  calendarDays: Date[];
  daySummary: Record<
    string,
    { income: number; expense: number; settlement: number }
  >;
  selectedDate: string;
  toIsoDate: (date: Date) => string;
  onSelectDate: (date: string) => void;
  onOpenNaturalRegisterForDate: (date: string) => void;
};

function formatCalendarAmount(value?: number) {
  if (!value) return "";
  return Math.round(value).toLocaleString();
}

export default function CalendarPanel({
  currentMonth,
  calendarDays,
  daySummary,
  selectedDate,
  toIsoDate,
  onSelectDate,
  onOpenNaturalRegisterForDate,
}: Props) {
  return (
    <>
      <StCalendarHead>
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <StWeekName key={day}>{day}</StWeekName>
        ))}
      </StCalendarHead>
      <StCalendarGrid>
        {calendarDays.map((day) => {
          const dayIso = toIsoDate(day);
          const info = daySummary[dayIso];
          const isCurrent =
            day.getMonth() === currentMonth.getMonth() &&
            day.getFullYear() === currentMonth.getFullYear();
          const isSelected = selectedDate === dayIso;

          return (
            <StDayCell
              key={dayIso}
              type="button"
              $selected={isSelected}
              $muted={!isCurrent}
              onClick={() => onSelectDate(dayIso)}
              onContextMenu={(event) => {
                event.preventDefault();
                onSelectDate(dayIso);
                onOpenNaturalRegisterForDate(dayIso);
              }}
            >
              <StDayNum $selected={isSelected}>{format(day, "d")}</StDayNum>
              <StDayMeta $kind="income" $selected={isSelected}>
                {info?.income ? `+${formatCalendarAmount(info.income)}` : ""}
              </StDayMeta>
              <StDayMeta $kind="expense" $selected={isSelected}>
                {info?.expense ? `-${formatCalendarAmount(info.expense)}` : ""}
              </StDayMeta>
              <StDayMeta $kind="settlement" $selected={isSelected}>
                {info?.settlement
                  ? `정산 -${formatCalendarAmount(info.settlement)}`
                  : ""}
              </StDayMeta>
            </StDayCell>
          );
        })}
      </StCalendarGrid>
    </>
  );
}

const StCalendarHead = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  margin-bottom: 0.35rem;
`;
const StWeekName = styled.div`
  text-align: center;
  font-size: 0.78rem;
  color: #8a94a6;
  font-weight: 700;
`;
const StCalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.35rem;
  margin-bottom: 1rem;
`;
const StDayCell = styled.button<{ $selected: boolean; $muted: boolean }>`
  border: 1px solid ${({ $selected }) => ($selected ? "#88a5f4" : "#edf1f5")};
  background: ${({ $selected }) =>
    $selected
      ? "linear-gradient(180deg, #eef4ff, #e2ebff)"
      : "linear-gradient(180deg, #ffffff, #fbfdff)"};
  color: ${({ $selected, $muted }) =>
    $selected ? "#213453" : $muted ? "#c2c8d2" : "#111827"};
  box-shadow: ${({ $selected }) =>
    $selected ? "0 10px 22px rgba(99, 126, 212, 0.14)" : "none"};
  border-radius: 16px;
  min-height: 80px;
  padding: 0.45rem 0.3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.18rem;
`;
const StDayNum = styled.span<{ $selected: boolean }>`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ $selected }) => ($selected ? "#1f2f4d" : "inherit")};
`;
const StDayMeta = styled.span<{
  $kind: "income" | "expense" | "settlement";
  $selected: boolean;
}>`
  font-size: 0.65rem;
  color: ${({ $kind, $selected }) => {
    if ($selected) {
      if ($kind === "income") return "#3e67d8";
      if ($kind === "settlement") return "#8d6328";
      return "#655ae0";
    }
    if ($kind === "income") return "#4f7cff";
    if ($kind === "settlement") return "#a7752f";
    return "#6b63e8";
  }};
  line-height: 1;
  font-weight: ${({ $selected }) => ($selected ? 800 : 700)};
`;
