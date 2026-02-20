"use client";

import { format } from "date-fns";
import styled from "styled-components";
import { EntryType } from "../types";

type Props = {
  currentMonth: Date;
  calendarDays: Date[];
  daySummary: Record<string, { income: number; expense: number }>;
  selectedDate: string;
  toIsoDate: (date: Date) => string;
  onSelectDate: (date: string) => void;
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
            >
              <StDayNum>{format(day, "d")}</StDayNum>
              <StDayMeta $kind="income">
                {info?.income ? `+${formatCalendarAmount(info.income)}` : ""}
              </StDayMeta>
              <StDayMeta $kind="expense">
                {info?.expense ? `-${formatCalendarAmount(info.expense)}` : ""}
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
  border: 1px solid ${({ $selected }) => ($selected ? "#f4a5bd" : "#edf1f5")};
  background: ${({ $selected }) =>
    $selected ? "linear-gradient(145deg, #f7b5cb, #f18bb1)" : "#fff"};
  color: ${({ $selected, $muted }) =>
    $selected ? "#fff" : $muted ? "#c2c8d2" : "#111827"};
  border-radius: 10px;
  min-height: 74px;
  padding: 0.35rem 0.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.15rem;
`;
const StDayNum = styled.span`
  font-size: 0.95rem;
  font-weight: 700;
`;
const StDayMeta = styled.span<{ $kind: EntryType }>`
  font-size: 0.65rem;
  color: ${({ $kind }) => ($kind === "income" ? "#2ea66d" : "#e0648f")};
  line-height: 1;
`;
