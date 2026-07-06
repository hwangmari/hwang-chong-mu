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
  hideIncomeAmount?: boolean;
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
  hideIncomeAmount = false,
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
                {info?.income
                  ? hideIncomeAmount
                    ? "＋•••"
                    : `+${formatCalendarAmount(info.income)}`
                  : ""}
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

  @media (max-width: 720px) {
    margin-bottom: 0.18rem;
    padding: 0 0.1rem;
  }
`;
const StWeekName = styled.div`
  text-align: center;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: 700;

  @media (max-width: 720px) {
    font-size: 0.68rem;
    color: #aaadb3;
  }
`;
const StCalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.35rem;
  margin-bottom: 1rem;

  @media (max-width: 720px) {
    gap: 0.08rem;
    margin-bottom: 0.7rem;
    padding: 0 0.05rem;
  }
`;
const StDayCell = styled.button<{ $selected: boolean; $muted: boolean }>`
  border: 1px solid ${({ $selected }) => ($selected ? "#c3c5c8" : "transparent")};
  background: transparent;
  color: ${({ $selected, $muted, theme }) => $selected ? "#182d4e" : $muted ? "#c7c9cd" : theme.colors.gray900};
  box-shadow: none;
  border-radius: 16px;
  min-height: 80px;
  padding: 0.45rem 0.3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.18rem;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: ${({ $selected }) => ($selected ? "#c3c5c8" : "#e4e5e7")};
  }

  @media (max-width: 720px) {
    border: 1px solid ${({ $selected }) => ($selected ? "#c3c5c8" : "transparent")};
    background: transparent;
    box-shadow: none;
    border-radius: 14px;
    min-height: 58px;
    padding: 0.34rem 0.1rem 0.3rem;
    align-items: center;
    gap: 0.08rem;
  }
`;
const StDayNum = styled.span<{ $selected: boolean }>`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ $selected }) => ($selected ? "#172a48" : "inherit")};

  @media (max-width: 720px) {
    font-size: 0.82rem;
    line-height: 1.15;
  }
`;
const StDayMeta = styled.span<{
  $kind: "income" | "expense" | "settlement";
  $selected: boolean;
}>`
  font-size: 0.65rem;
  color: ${({ $kind, $selected }) => {
    if ($selected) {
      if ($kind === "income") return "#2b6fd6";
      if ($kind === "settlement") return "#e03d49";
      return "#7f848c";
    }
    if ($kind === "income") return "#3182f6";
    if ($kind === "settlement") return "#f04452";
    return "#888c94";
  }};
  line-height: 1;
  font-weight: ${({ $selected }) => ($selected ? 800 : 700)};

  @media (max-width: 720px) {
    font-size: ${({ $kind }) => ($kind === "settlement" ? "0.52rem" : "0.56rem")};
    line-height: 1.05;
    letter-spacing: -0.02em;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
