"use client";

import { useMemo, useState } from "react";
import styled from "styled-components";

// 기록하기 폼의 날짜 칸 아래에 붙는 "한 주 띠".
// 선택한 날짜가 든 주(일~토)를 한 줄로 보여 주고, ‹ › 로 한 주씩 옮긴다. '📅 달력' 버튼으로 그 달 전체를 펼칠 수 있다.
// 점은 이미 기록이 있는 날. 날짜 입력 칸(달력 아이콘)은 그대로 두고 이건 빠른 선택용이다.
type Props = {
  value: string; // YYYY-MM-DD
  onChange: (iso: string) => void;
  markedDates?: ReadonlySet<string>;
};

const DAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];

function isoOf(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function startOfWeek(d: Date) {
  const s = new Date(d);
  s.setDate(d.getDate() - d.getDay()); // 일요일
  s.setHours(0, 0, 0, 0);
  return s;
}

export default function DatePickerCalendar({ value, onChange, markedDates }: Props) {
  const todayIso = isoOf(new Date());
  // 보고 있는 주: 선택한 날짜의 주에서 시작하고, 화살표로만 옮긴다
  const [weekStart, setWeekStart] = useState(() => startOfWeek(parseIso(value)));
  // '달력' 버튼으로 그 달 전체를 펼쳐 볼 수 있다 (기본은 한 주 띠)
  const [monthOpen, setMonthOpen] = useState(false);
  // 달력을 펼쳤을 때 보는 달(1일). 주 시작일과 따로 두어야 9/27(일)부터 시작하는 주가 10월로 넘어가도 라벨이 맞는다
  const [viewMonth, setViewMonth] = useState(() => {
    const d = parseIso(value);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const monthCells = useMemo(() => {
    if (!monthOpen) return [];
    const base = viewMonth;
    const first = new Date(base.getFullYear(), base.getMonth(), 1);
    const last = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    const lead = first.getDay();
    const total = Math.ceil((lead + last.getDate()) / 7) * 7;
    const start = new Date(first);
    start.setDate(first.getDate() - lead);
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { iso: isoOf(d), day: d.getDate(), inMonth: d.getMonth() === base.getMonth(), dow: d.getDay() };
    });
  }, [monthOpen, viewMonth]);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return { iso: isoOf(d), day: d.getDate(), month: d.getMonth() + 1, dow: i };
      }),
    [weekStart],
  );

  // 주가 두 달에 걸치면 "8월 31일 – 9월 6일"처럼, 아니면 "9월 7일 – 13일"
  const first = days[0];
  const last = days[6];
  const rangeLabel =
    first.month === last.month
      ? `${first.month}월 ${first.day}일 – ${last.day}일`
      : `${first.month}월 ${first.day}일 – ${last.month}월 ${last.day}일`;

  // 띠일 땐 한 주씩, 달력을 펼쳤을 땐 한 달씩 옮긴다
  const move = (delta: number) => {
    if (monthOpen) {
      setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
      return;
    }
    setWeekStart((s) => {
      const n = new Date(s);
      n.setDate(s.getDate() + delta * 7);
      return n;
    });
  };
  const goToday = () => {
    const t = new Date();
    setWeekStart(startOfWeek(t));
    setViewMonth(new Date(t.getFullYear(), t.getMonth(), 1));
    onChange(todayIso);
  };
  const toggleMonth = () => {
    if (!monthOpen) {
      // 펼칠 때는 지금 보고 있는 주의 달(주 가운데 날 기준)에서 시작
      const mid = new Date(weekStart);
      mid.setDate(weekStart.getDate() + 3);
      setViewMonth(new Date(mid.getFullYear(), mid.getMonth(), 1));
    }
    setMonthOpen((v) => !v);
  };

  return (
    <StWrap aria-label="날짜 빠르게 고르기">
      <StHead>
        <StNavBtn type="button" onClick={() => move(-1)} aria-label={monthOpen ? "지난달" : "지난주"}>‹</StNavBtn>
        <StRange>{monthOpen ? `${viewMonth.getFullYear()}년 ${viewMonth.getMonth() + 1}월` : rangeLabel}</StRange>
        <StNavBtn type="button" onClick={() => move(1)} aria-label={monthOpen ? "다음달" : "다음주"}>›</StNavBtn>
        <StTodayBtn type="button" $push onClick={goToday}>오늘</StTodayBtn>
        <StTodayBtn
          type="button"
          $active={monthOpen}
          aria-pressed={monthOpen}
          onClick={toggleMonth}
        >
          {monthOpen ? "한 주만" : "📅 달력"}
        </StTodayBtn>
      </StHead>
      {monthOpen ? (
        <StMonthGrid>
          {DAY_HEADERS.map((label, i) => (
            <StDow key={label} $weekend={i === 0 || i === 6}>{label}</StDow>
          ))}
          {monthCells.map((c) => (
            <StMonthDay
              key={c.iso}
              type="button"
              $selected={c.iso === value}
              $inMonth={c.inMonth}
              $today={c.iso === todayIso}
              $weekend={c.dow === 0 || c.dow === 6}
              aria-pressed={c.iso === value}
              aria-label={`${c.iso}${markedDates?.has(c.iso) ? " · 기록 있음" : ""}`}
              onClick={() => {
                onChange(c.iso);
                setWeekStart(startOfWeek(parseIso(c.iso)));
                setMonthOpen(false);
              }}
            >
              {c.day}
              {markedDates?.has(c.iso) ? <StDot aria-hidden="true" /> : null}
            </StMonthDay>
          ))}
        </StMonthGrid>
      ) : (
      <StWeek>
        {days.map((d) => (
          <StDay
            key={d.iso}
            type="button"
            $selected={d.iso === value}
            $today={d.iso === todayIso}
            $weekend={d.dow === 0 || d.dow === 6}
            aria-pressed={d.iso === value}
            aria-label={`${d.iso}${markedDates?.has(d.iso) ? " · 기록 있음" : ""}`}
            onClick={() => onChange(d.iso)}
          >
            <small>{DAY_HEADERS[d.dow]}</small>
            <strong>{d.day}</strong>
            {markedDates?.has(d.iso) ? <StDot aria-hidden="true" /> : null}
          </StDay>
        ))}
      </StWeek>
      )}
    </StWrap>
  );
}

const StWrap = styled.div`
  margin-top: 0.15rem;
  padding: 0.5rem 0.55rem 0.55rem;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.semantic.bg};
`;

const StHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  margin-bottom: 0.4rem;
`;

const StNavBtn = styled.button`
  width: 1.7rem;
  height: 1.7rem;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: ${({ theme }) => theme.semantic.subText};
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.white};
    color: ${({ theme }) => theme.semantic.text};
  }
`;

const StRange = styled.span`
  min-width: 8.5rem;
  text-align: center;
  font-size: 0.82rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

const StTodayBtn = styled.button<{ $active?: boolean; $push?: boolean }>`
  margin-left: ${({ $push }) => ($push ? "auto" : "0")};
  padding: 0.25rem 0.55rem;
  border: 1px solid ${({ $active, theme }) => ($active ? theme.semantic.primary : theme.semantic.border)};
  border-radius: 999px;
  background: ${({ $active, theme }) => ($active ? theme.semantic.primaryLight : theme.colors.white)};
  color: ${({ $active, theme }) => ($active ? theme.semantic.primary : theme.semantic.subText)};
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
`;

const StMonthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.15rem;
`;

const StDow = styled.span<{ $weekend: boolean }>`
  text-align: center;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.1rem 0 0.2rem;
  color: ${({ $weekend, theme }) => ($weekend ? theme.colors.gray400 : theme.colors.gray500)};
`;

const StMonthDay = styled.button<{ $selected: boolean; $inMonth: boolean; $today: boolean; $weekend: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.1rem;
  border: 0;
  border-radius: 0.5rem;
  background: ${({ $selected, theme }) => ($selected ? theme.semantic.primary : "transparent")};
  color: ${({ $selected, $inMonth, $weekend, theme }) =>
    $selected ? theme.colors.white : !$inMonth ? theme.colors.gray300 : $weekend ? theme.colors.gray500 : theme.semantic.text};
  font-size: 0.82rem;
  font-weight: ${({ $selected, $today }) => ($selected || $today ? 800 : 600)};
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  box-shadow: ${({ $today, $selected, theme }) => ($today && !$selected ? `inset 0 0 0 1px ${theme.semantic.primary}` : "none")};

  &:hover {
    background: ${({ $selected, theme }) => ($selected ? theme.semantic.primary : theme.colors.white)};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.primary};
    outline-offset: 1px;
  }

  > span {
    position: absolute;
    left: 50%;
    bottom: 0.15rem;
    margin-left: -0.15rem;
  }
`;

const StWeek = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.2rem;
`;

const StDay = styled.button<{ $selected: boolean; $today: boolean; $weekend: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  padding: 0.35rem 0 0.45rem;
  border: 0;
  border-radius: 0.6rem;
  background: ${({ $selected, theme }) => ($selected ? theme.semantic.primary : "transparent")};
  color: ${({ $selected, $weekend, theme }) =>
    $selected ? theme.colors.white : $weekend ? theme.colors.gray500 : theme.semantic.text};
  cursor: pointer;
  box-shadow: ${({ $today, $selected, theme }) =>
    $today && !$selected ? `inset 0 0 0 1px ${theme.semantic.primary}` : "none"};

  small {
    font-size: 0.66rem;
    font-weight: 700;
    opacity: ${({ $selected }) => ($selected ? 0.9 : 0.75)};
  }

  strong {
    font-size: 0.95rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }

  &:hover {
    background: ${({ $selected, theme }) => ($selected ? theme.semantic.primary : theme.colors.white)};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.primary};
    outline-offset: 1px;
  }
`;

const StDot = styled.span`
  width: 0.3rem;
  height: 0.3rem;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.85;
`;
