"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";
import { byId, chipName, type ServiceId } from "@/lib/services";
import { ROOM_SECRET_NOTICE } from "@/lib/roomServices";
import type { MonthCalendarEvent } from "@/components/common/MonthCalendar";
import DashboardIntro, {
  SERVICE_BENEFITS,
} from "@/components/home/DashboardIntro";
import {
  CalendarBoard,
  GaugeRing,
  RoomBoard,
  WidgetShell,
  StBoard,
  StBoardHead,
  StBoardNote,
  StBoardTitle,
  StBoardTitleWrap,
  StGaugeStrip,
  StSection,
  StServiceList,
  type DatedItem,
  type GaugeItem,
  type RoomRow,
  type WidgetTone,
  type WidgetView,
} from "@/components/home/dashboardParts";

// 비로그인 방문자가 보는 "내 서비스 요약" 미리보기.
//
// 로그인 전후로 화면이 달라 보이면 무엇이 좋아지는지 와닿지 않는다는 지적이 있어,
// 판의 구성·순서·부품을 로그인 후와 똑같이 맞췄다. 다른 것은 데이터뿐이다.
//   🎯 이번 달 → 🗓️ 이번 달 달력 → 📊 서비스 현황 → 🗓️ 내 방
// 머리말·장점 띠·예시 배지·버튼 줄은 로그인 전에만 붙는다 (로그인 후에는 설명이 필요 없다).
// 게이지·달력·현황 줄·내 방은 로그인 후 화면이 쓰는 컴포넌트를 그대로 불러 쓴다.
// 여기 숫자·이름·날짜는 전부 지어낸 예시이고, 줄마다 '예시' 배지를 달아 실제 기록과 구분한다.

const SAMPLE_NOTE = "예시 화면";

// 예시 날짜는 오늘을 기준으로 잡는다. 그래야 며칠에 보든 "다음 약속 D-3"이 말이 된다.
// 달을 넘어가면 달력 칩이 사라지므로, 이번 달 끝(또는 시작)으로 접어 넣는다.
function useSampleDates() {
  return useMemo(() => {
    const today = new Date();
    const iso = (date: Date) => format(date, "yyyy-MM-dd");
    const inThisMonth = (date: Date) =>
      isSameMonth(date, today)
        ? date
        : date > today
          ? endOfMonth(today)
          : startOfMonth(today);
    const shift = (days: number) => iso(inThisMonth(addDays(today, days)));
    return {
      today,
      meeting: shift(3),
      tennis: shift(11),
      schedule: shift(1),
      overtime: shift(-2),
      workout: Array.from(
        new Set(
          [-1, -3, -6, -8]
            .map((offset) => addDays(today, offset))
            .filter((date) => isSameMonth(date, today))
            .map(iso),
        ),
      ),
    };
  }, []);
}

// 접어 넣은 날짜에서 실제 D-day 를 다시 계산한다 (칩·현황 줄·다가오는 일정이 늘 같은 값)
function ddayFrom(today: Date, iso: string) {
  return differenceInCalendarDays(parseISO(iso), today);
}

// ── 🎯 이번 달: 실제 화면에서 고리로 나오는 서비스는 가계부·운동·야근 셋뿐이라 예시도 그 셋만 ──
type SampleGauge = {
  id: ServiceId;
  tone: WidgetTone;
  value: string;
  label: string;
  ratio: number;
};

const SAMPLE_GAUGES: SampleGauge[] = [
  { id: "account-book", tone: "amber", value: "70%", label: "이달 예산 사용", ratio: 0.7 },
  { id: "workout", tone: "blue", value: "12일", label: "이달 30일 중", ratio: 0.4 },
  { id: "overtime", tone: "orange", value: "6시간", label: "이달 20시간 중", ratio: 0.32 },
];

// ── 📊 서비스 현황: 로그인 후와 같은 줄 모양으로, 서비스마다 한 줄 ──
type SampleRow = {
  id: ServiceId;
  tone: WidgetTone;
  view: WidgetView;
  /** 있으면 핵심 줄 뒤에 실제 날짜로 계산한 D-day 를 붙인다 */
  ddayOf?: "meeting" | "tennis";
};

const SAMPLE_ROWS: SampleRow[] = [
  {
    id: "meeting",
    tone: "indigo",
    view: { main: "다음 약속", sub: "저녁 7시 · 6명 참석" },
    ddayOf: "meeting",
  },
  {
    id: "calc",
    tone: "rose",
    view: { main: "받을 돈 12,000원", sub: "정산 1건 남음", progress: { ratio: 0.75, over: false } },
  },
  {
    id: "place",
    tone: "teal",
    view: { main: "1위 홍대 고기집", sub: "장소 투표 진행 중 · 3표" },
  },
  {
    id: "tennis",
    tone: "green",
    view: { main: "다음 대회", sub: "참가 18명" },
    ddayOf: "tennis",
  },
  {
    id: "daily",
    tone: "rose",
    view: {
      main: "이번 주 4일 기록",
      sub: "한 줄 일기와 체크리스트",
      progress: { ratio: 0.57, over: false },
    },
  },
  {
    id: "overtime",
    tone: "orange",
    view: {
      main: "보상휴가 1.25일",
      sub: "이번 달 야근 6시간 20분",
      progress: { ratio: 0.63, over: false },
    },
  },
  {
    id: "schedule",
    tone: "teal",
    view: {
      main: "이번 주 할 일 3건",
      sub: "오늘 마감 1건",
      progress: { ratio: 0.4, over: false },
    },
  },
  {
    id: "account-book",
    tone: "amber",
    view: {
      main: "842,000원 / 1,200,000원",
      sub: "이번 달 예산 사용",
      progress: { ratio: 0.7, over: false },
    },
  },
  {
    id: "gift-log",
    tone: "rose",
    view: { main: "받은 돈 50,000원", sub: "김민준 · 결혼식" },
  },
  {
    id: "habit",
    tone: "teal",
    view: { main: "이번 주 3/5", sub: "물 2L 마시기", progress: { ratio: 0.6, over: false } },
  },
  {
    id: "diet",
    tone: "green",
    view: { main: "-2.4kg", sub: "목표까지 3.6kg", progress: { ratio: 0.4, over: false } },
  },
  {
    id: "workout",
    tone: "blue",
    view: { main: "이번 주 3일", sub: "러닝 12.4km", progress: { ratio: 0.6, over: false } },
  },
];

export default function GuestDashboardPreview({ wide = false }: { wide?: boolean }) {
  const dates = useSampleDates();
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // 게이지와 진행바는 0에서 시작해, 화면에 붙은 다음 한 번만 실제 값으로 찬다.
  // (서버·클라이언트가 같은 값으로 시작하므로 하이드레이션 경고가 없다)
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const gauges = useMemo<GaugeItem[]>(
    () =>
      SAMPLE_GAUGES.map((gauge) => {
        const service = byId(gauge.id);
        return {
          value: gauge.value,
          caption: chipName(service),
          label: gauge.label,
          ratio: filled ? gauge.ratio : 0,
          over: false,
          icon: service.icon,
          tone: gauge.tone,
          href: service.href,
        };
      }),
    [filled],
  );

  // 달력 칩: 약속·테니스·업무·야근·운동을 로그인 후와 같은 색으로.
  // kind 는 아래 요약 수치를 세는 데만 쓰고 달력에는 넘기지 않는다.
  const sampleEvents = useMemo(
    () => [
      { date: dates.meeting, label: "저녁 7시 모임", tone: "indigo" as const, kind: "약속" },
      { date: dates.tennis, label: "63OPEN 테니스 대회", tone: "green" as const, kind: "테니스" },
      { date: dates.schedule, label: "기획서 마감", tone: "teal" as const, kind: "업무" },
      { date: dates.overtime, label: "야근 2시간 30분", tone: "orange" as const, kind: "야근" },
      ...dates.workout.map((date) => ({
        date,
        label: "운동",
        tone: "blue" as const,
        kind: "운동",
      })),
    ],
    [dates],
  );

  const calendarEvents = useMemo<MonthCalendarEvent[]>(
    () => sampleEvents.map(({ date, label, tone }) => ({ date, label, tone })),
    [sampleEvents],
  );

  // 보고 있는 달의 칩만 세어 요약 줄을 만든다 (‹ › 로 달을 넘기면 같이 바뀐다)
  const monthCounts = useMemo(() => {
    const shown = sampleEvents.filter((event) =>
      isSameMonth(parseISO(event.date), calendarMonth),
    );
    const count = (kind: string) =>
      shown.filter((event) => event.kind === kind).length;
    return {
      plan: count("약속") + count("테니스") + count("업무"),
      workout: count("운동"),
      overtime: count("야근"),
    };
  }, [sampleEvents, calendarMonth]);

  const upcoming = useMemo<DatedItem[]>(
    () =>
      [
        {
          id: "sample-schedule",
          date: dates.schedule,
          kind: "업무",
          tone: "teal" as WidgetTone,
          label: "기획서 마감",
          href: byId("schedule").href,
          upcoming: true,
        },
        {
          id: "sample-meeting",
          date: dates.meeting,
          kind: "약속",
          tone: "indigo" as WidgetTone,
          label: "9월 정기 모임",
          href: byId("meeting").href,
          upcoming: true,
        },
        {
          id: "sample-tennis",
          date: dates.tennis,
          kind: "테니스",
          tone: "green" as WidgetTone,
          label: "63OPEN 테니스 대회",
          href: byId("tennis").href,
          upcoming: true,
        },
      ].sort((a, b) => a.date.localeCompare(b.date)),
    [dates],
  );

  const rooms = useMemo<RoomRow[]>(
    () => [
      {
        id: "sample-room-meeting",
        service: "meeting",
        roomId: "sample",
        label: "9월 정기 모임",
        createdAt: `${dates.meeting}T09:00:00.000Z`,
        confirmedDate: dates.meeting,
      },
      {
        id: "sample-room-calc",
        service: "calc",
        roomId: "sample",
        label: "제주도 여행 정산",
        createdAt: `${dates.meeting}T09:00:00.000Z`,
      },
      {
        id: "sample-room-tennis",
        service: "tennis",
        roomId: "sample",
        label: "63OPEN 테니스 대회",
        createdAt: `${dates.meeting}T09:00:00.000Z`,
        confirmedDate: dates.tennis,
      },
    ],
    [dates],
  );

  // 로그인 후 현황 판과 같은 기준 문구
  const basisLine = useMemo(() => {
    const now = dates.today;
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    return `기준 ${format(now, "M월 d일 (EEE)", { locale: ko })} · 이번 주 ${format(
      weekStart,
      "M/d",
    )}~${format(weekEnd, "M/d")}`;
  }, [dates]);

  return (
    <StSection $wide={wide}>
      {/* ⓪ 머리말 + 장점 띠 — 로그인 전에만 (로그인 후에는 설명 없이 바로 판이 시작한다) */}
      <DashboardIntro />

      {/* ① 이번 달 게이지 띠 */}
      <StRise style={{ animationDelay: "180ms" }}>
        <StBoard>
          <StBoardHead>
            <StBoardTitleWrap>
              <StBoardTitle>🎯 이번 달</StBoardTitle>
            </StBoardTitleWrap>
            <StBoardNote>{SAMPLE_NOTE}</StBoardNote>
          </StBoardHead>
          <StGaugeStrip>
            {gauges.map((gauge) => (
              <GaugeRing key={gauge.caption} gauge={gauge} />
            ))}
          </StGaugeStrip>
        </StBoard>
      </StRise>

      {/* ② 이번 달 달력 + 다가오는 일정 */}
      <StRise style={{ animationDelay: "240ms" }}>
        <CalendarBoard
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          events={calendarEvents}
          note={SAMPLE_NOTE}
          planCount={monthCounts.plan}
          workoutDays={monthCounts.workout}
          overtimeDays={monthCounts.overtime}
          showWorkout={monthCounts.workout > 0}
          showSchedule={monthCounts.plan > 0}
          showOvertime={monthCounts.overtime > 0}
          upcoming={upcoming}
        />
      </StRise>

      {/* ③ 서비스 현황 */}
      <StRise style={{ animationDelay: "300ms" }}>
        <StBoard>
          <StBoardHead>
            <StBoardTitleWrap>
              <StBoardTitle>📊 서비스 현황</StBoardTitle>
            </StBoardTitleWrap>
            <StBoardNote>{SAMPLE_NOTE}</StBoardNote>
          </StBoardHead>
          <StBoardNote>{basisLine}</StBoardNote>
          <StServiceList>
            {SAMPLE_ROWS.map((row) => {
              const service = byId(row.id);
              const progress = row.view.progress;
              const dday = row.ddayOf
                ? ddayFrom(dates.today, dates[row.ddayOf])
                : null;
              const main =
                dday === null
                  ? row.view.main
                  : dday > 0
                    ? `${row.view.main} D-${dday}`
                    : dday === 0
                      ? `${row.view.main} 오늘`
                      : row.view.main;
              return (
                <WidgetShell
                  key={row.id}
                  href={service.href}
                  icon={service.icon}
                  name={chipName(service)}
                  tone={row.tone}
                  status="ready"
                  view={{
                    ...row.view,
                    main,
                    progress: progress
                      ? { ...progress, ratio: filled ? progress.ratio : 0 }
                      : null,
                  }}
                  benefit={SERVICE_BENEFITS[row.id]}
                  sample
                />
              );
            })}
          </StServiceList>
        </StBoard>
      </StRise>

      {/* ④ 내 방 */}
      <StRise style={{ animationDelay: "360ms" }}>
        <RoomBoard
          rooms={rooms}
          notice={ROOM_SECRET_NOTICE}
          note={SAMPLE_NOTE}
          hrefFor={(room) => byId(room.service).href}
        />
      </StRise>

      {/* 로그인 전에만 — 버튼 줄 */}
      <StCtaRow style={{ animationDelay: "420ms" }}>
        <StCtaPrimary href="/login">로그인하고 내 화면 만들기</StCtaPrimary>
        <StCtaGhost href="/">먼저 둘러보기</StCtaGhost>
      </StCtaRow>
    </StSection>
  );
}

// ── 스타일 ──
// 판이 아래에서 한 번 올라온다. 순서마다 animation-delay만 달라 한 동작처럼 이어진다.
const rise = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StRise = styled.div`
  width: 100%;
  animation: ${rise} 320ms cubic-bezier(0.2, 0.9, 0.3, 1) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const StCtaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  padding: 0 0.25rem;
  animation: ${rise} 320ms cubic-bezier(0.2, 0.9, 0.3, 1) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  /* 좁은 화면에서 글이 두 줄이 되는 버튼이 생겨도 두 버튼이 같은 높이로 끝나게 */
  @media ${({ theme }) => theme.media.mobile} {
    align-items: stretch;

    > a {
      flex: 1;
      justify-content: center;
      text-align: center;
    }
  }
`;

const StCtaPrimary = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 0.7rem 1.1rem;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.semantic.primary};
  color: ${({ theme }) => theme.colors.white};
  font-weight: 800;
  font-size: 0.92rem;
  text-decoration: none;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: 2px;
  }
`;

const StCtaGhost = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 0.7rem 1rem;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.semantic.primary};
  font-weight: 700;
  font-size: 0.92rem;
  text-decoration: none;
  border: 1px solid ${({ theme }) => theme.colors.blue100};

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: 2px;
  }
`;
