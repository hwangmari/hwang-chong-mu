"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import styled, { css } from "styled-components";

// 여러 서비스가 함께 쓰는 "한 달 달력" 표시용 컴포넌트.
// 운동방 월별 달력(app/workout/components/WorkoutCharts.tsx)의 생김새를 그대로 옮겨 왔고,
// 데이터는 events로만 받는다(계산·조회는 쓰는 쪽 책임).
//
// - month: 보여 줄 달(그 달의 아무 날짜나 넣어도 됨)
// - events: 날짜별 칩. 같은 날짜에 여러 개면 세로로 쌓인다.
// - onMonthChange: ‹ › · 오늘 버튼을 눌렀을 때 호출(안 주면 이동 버튼을 숨긴다)
// - summary / legend: 달력 위에 붙는 요약·범례 자리(자유롭게 넣는다)
// - onDayClick: 날짜 칸을 눌렀을 때(안 주면 칸은 클릭 대상이 아니다)

export type MonthCalendarTone =
  | "blue"
  | "amber"
  | "green"
  | "teal"
  | "indigo"
  | "rose"
  | "orange"
  | "gray";

export type MonthCalendarEvent = {
  /** yyyy-MM-dd */
  date: string;
  label: string;
  tone: MonthCalendarTone;
  /** 있으면 칩이 링크가 된다 */
  href?: string;
  /** 마우스를 올렸을 때 전체 내용(칩은 좁아서 말줄임될 수 있다) */
  title?: string;
};

type MonthCalendarProps = {
  month: Date;
  events: MonthCalendarEvent[];
  onMonthChange?: (next: Date) => void;
  legend?: ReactNode;
  summary?: ReactNode;
  onDayClick?: (iso: string) => void;
  /** 칩이 하나도 없을 때 달력 아래에 보여 줄 안내 */
  emptyHint?: ReactNode;
  className?: string;
};

const DAY_HEADERS = ["월", "화", "수", "목", "금", "토", "일"];

function isoFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function MonthCalendar({
  month,
  events,
  onMonthChange,
  legend,
  summary,
  onDayClick,
  emptyHint,
  className,
}: MonthCalendarProps) {
  const todayISO = useMemo(() => isoFromDate(new Date()), []);

  // 날짜별로 칩을 모아 둔다(한 번만 계산 — 렌더마다 다시 훑지 않도록)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, MonthCalendarEvent[]>();
    events.forEach((event) => {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    });
    return map;
  }, [events]);

  // 월요일 시작 7칸 × N줄. 앞뒤로 남는 칸은 옆 달 날짜로 흐리게 채운다.
  const cells = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstOfMonth = new Date(year, monthIndex, 1);
    const lastOfMonth = new Date(year, monthIndex + 1, 0);
    const leading = (firstOfMonth.getDay() + 6) % 7; // 월=0
    const start = new Date(firstOfMonth);
    start.setDate(start.getDate() - leading);
    const totalCells = Math.ceil((leading + lastOfMonth.getDate()) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        date,
        iso: isoFromDate(date),
        inMonth: date.getMonth() === monthIndex,
      };
    });
  }, [month]);

  const monthLabel = `${month.getFullYear()}년 ${month.getMonth() + 1}월`;

  const goMonth = (delta: number) => {
    onMonthChange?.(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  };

  const goToday = () => {
    const now = new Date();
    onMonthChange?.(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  return (
    <StWrap className={className}>
      <StHeader>
        {onMonthChange ? (
          <StNavGroup>
            <StNav>
              <StNavBtn
                type="button"
                onClick={() => goMonth(-1)}
                aria-label="이전 달"
              >
                ‹
              </StNavBtn>
              <StMonth>{monthLabel}</StMonth>
              <StNavBtn
                type="button"
                onClick={() => goMonth(1)}
                aria-label="다음 달"
              >
                ›
              </StNavBtn>
            </StNav>
            <StTodayBtn type="button" onClick={goToday}>
              오늘
            </StTodayBtn>
          </StNavGroup>
        ) : (
          <StMonth>{monthLabel}</StMonth>
        )}
        {legend ? <StLegend>{legend}</StLegend> : null}
      </StHeader>

      {summary ? <StSummary>{summary}</StSummary> : null}

      <StDayHeaderRow>
        {DAY_HEADERS.map((label, index) => (
          <StDayHeader key={label} $weekend={index >= 5}>
            {label}
          </StDayHeader>
        ))}
      </StDayHeaderRow>

      <StGrid>
        {cells.map((cell) => {
          const dayEvents = eventsByDate.get(cell.iso) ?? [];
          const hasAny = dayEvents.length > 0;
          const isToday = cell.iso === todayISO;
          const clickable = Boolean(onDayClick);
          return (
            <StCell
              key={cell.iso}
              $inMonth={cell.inMonth}
              $today={isToday}
              $active={hasAny}
              $clickable={clickable}
              {...(clickable
                ? {
                    role: "button" as const,
                    tabIndex: 0,
                    onClick: () => onDayClick?.(cell.iso),
                    onKeyDown: (event: React.KeyboardEvent) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onDayClick?.(cell.iso);
                      }
                    },
                  }
                : {})}
            >
              <StDayNum $today={isToday}>{cell.date.getDate()}</StDayNum>
              <StTags>
                {dayEvents.map((event, index) =>
                  event.href ? (
                    <StTagLink
                      key={`${event.date}-${index}`}
                      href={event.href}
                      $tone={event.tone}
                      title={event.title ?? event.label}
                    >
                      {event.label}
                    </StTagLink>
                  ) : (
                    <StTag
                      key={`${event.date}-${index}`}
                      $tone={event.tone}
                      title={event.title ?? event.label}
                    >
                      {event.label}
                    </StTag>
                  ),
                )}
              </StTags>
            </StCell>
          );
        })}
      </StGrid>

      {!events.length && emptyHint ? <StHint>{emptyHint}</StHint> : null}
    </StWrap>
  );
}

// ── 스타일 ── (운동방 달력과 같은 크기·간격을 쓰되 색은 테마 토큰으로)

// 톤별 칩 색: 옅은 배경 + 진한 글씨. 다크 모드에선 토큰이 뒤집혀 자동으로 어두운 틴트가 된다.
const toneStyles = css<{ $tone: MonthCalendarTone }>`
  --tone-fg: ${({ $tone, theme }) =>
    ({
      blue: theme.colors.blue600,
      amber: theme.colors.amber600,
      green: theme.colors.green600,
      teal: theme.colors.teal600,
      indigo: theme.colors.indigo600,
      rose: theme.colors.rose600,
      orange: theme.colors.orange600,
      gray: theme.colors.gray600,
    })[$tone]};
  --tone-bg: ${({ $tone, theme }) =>
    ({
      blue: theme.colors.blue50,
      amber: theme.colors.amber50,
      green: theme.colors.green50,
      teal: theme.colors.teal50,
      indigo: theme.colors.indigo50,
      rose: theme.colors.rose50,
      orange: theme.colors.orange50,
      gray: theme.colors.gray100,
    })[$tone]};
  color: var(--tone-fg);
  background: var(--tone-bg);
`;

// 좁은 화면(달력 칸이 8자도 못 담는 폭)에서는 글자를 지우고 색 막대만 남긴다.
// "약속 · 3분…"처럼 잘린 글자는 읽히지 않아 오히려 방해가 되고,
// 무엇인지는 위 범례와 아래 '다가오는 일정' 목록이 알려 준다.
const chipNarrow = css`
  @media (max-width: 640px) {
    width: 76%;
    height: 5px;
    padding: 0;
    border-radius: 999px;
    font-size: 0;
    line-height: 0;
    background: var(--tone-fg);
  }
`;

const StWrap = styled.div`
  width: 100%;
  min-width: 0;
`;

const StHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  margin-bottom: 0.6rem;
`;

const StNavGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StNav = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

const StNavBtn = styled.button`
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.blue600};
    border-color: ${({ theme }) => theme.colors.blue200};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.primary};
    outline-offset: 2px;
  }
`;

const StMonth = styled.span`
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  letter-spacing: -0.01em;
  padding: 0 0.3rem;
`;

const StTodayBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.35rem 0.7rem;
  border-radius: 0.5rem;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.blue600};
    border-color: ${({ theme }) => theme.colors.blue200};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.primary};
    outline-offset: 2px;
  }
`;

const StLegend = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const StSummary = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 1.4rem;
  padding-top: 0.75rem;
  margin-bottom: 0.9rem;
  border-top: 1px dashed ${({ theme }) => theme.colors.gray200};
`;

const StDayHeaderRow = styled.div`
  display: grid;
  /* minmax(0,1fr): 긴 칩 글자가 칸을 밀어 요일 줄과 어긋나지 않게 */
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 2px;
`;

const StDayHeader = styled.div<{ $weekend: boolean }>`
  font-size: 0.68rem;
  font-weight: 800;
  text-align: center;
  padding: 0.35rem 0;
  color: ${({ $weekend, theme }) =>
    $weekend ? theme.colors.gray400 : theme.colors.gray500};
`;

const StGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 2px;
`;

const StCell = styled.div<{
  $inMonth: boolean;
  $today: boolean;
  $active: boolean;
  $clickable: boolean;
}>`
  position: relative;
  min-height: 62px;
  /* 긴 칩이 칸 폭을 늘리지 못하게 (칩은 안에서 말줄임된다) */
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 3px;
  padding: 0.32rem 0.18rem 0.3rem;
  border-radius: 0.55rem;
  background: ${({ $today, $active, theme }) =>
    $today
      ? theme.colors.blue50
      : $active
        ? theme.colors.gray50
        : "transparent"};
  border: 1px solid
    ${({ $today, theme }) => ($today ? theme.colors.blue200 : "transparent")};
  opacity: ${({ $inMonth }) => ($inMonth ? 1 : 0.35)};
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};
  transition:
    background 0.1s,
    border-color 0.1s;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.primary};
    outline-offset: 1px;
  }

  @media (max-width: 480px) {
    min-height: 54px;
  }
`;

const StDayNum = styled.span<{ $today: boolean }>`
  font-size: 0.72rem;
  font-weight: ${({ $today }) => ($today ? 900 : 700)};
  color: ${({ $today, theme }) =>
    $today ? theme.colors.blue600 : theme.colors.gray700};
  line-height: 1;
`;

const StTags = styled.div`
  margin-top: auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
`;

const tagBase = css`
  display: block;
  max-width: 100%;
  font-size: 0.58rem;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 3px;
  line-height: 1.35;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

`;

const StTag = styled.span<{ $tone: MonthCalendarTone }>`
  ${tagBase}
  ${toneStyles}
  ${chipNarrow}
`;

const StTagLink = styled(Link)<{ $tone: MonthCalendarTone }>`
  ${tagBase}
  ${toneStyles}
  ${chipNarrow}
  cursor: pointer;
  text-decoration: none;

  &:hover {
    filter: brightness(0.96);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.primary};
    outline-offset: 1px;
  }
`;

const StHint = styled.p`
  margin-top: 0.7rem;
  font-size: 0.76rem;
  color: ${({ theme }) => theme.colors.gray400};
  text-align: center;
`;
