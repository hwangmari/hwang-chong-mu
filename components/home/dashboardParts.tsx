"use client";

import { type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import styled from "styled-components";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import MonthCalendar, {
  type MonthCalendarEvent,
} from "@/components/common/MonthCalendar";
import {
  ROOM_SERVICE_META,
  ROOM_SERVICES,
  type RoomService,
} from "@/lib/roomServices";

// 내 서비스 요약(/my) 판을 이루는 부품 모음.
//
// 로그인 전 미리보기(GuestDashboardPreview)와 로그인 후 대시보드(HomeDashboard)가
// 같은 화면을 그리려면 같은 부품을 써야 하는데, 두 파일이 서로를 import 하면 순환이 된다.
// 그래서 둘 다 여기서 가져다 쓴다. 여기에는 조회·계산이 없고 "받은 값을 그리는 일"만 있다.

// /my에서 서비스로 이동한 뒤 헤더 백키로 다시 /my로 돌아올 수 있게 하는 쿼리
export const withFromMy = (href: string) =>
  `${href}${href.includes("?") ? "&" : "?"}from=my`;

// "내 방": 서비스당 여러 개일 수 있는 진행 중 방(약속·정산·장소·테니스·게임·야근·일일기록).
// 아이콘·이름·링크는 lib/roomServices.ts에서 가져와 /account와 똑같이 보이게 한다.
export type RoomRow = {
  id: string;
  service: RoomService;
  roomId: string;
  label: string;
  createdAt: string;
  // 약속방의 확정된 약속 날짜(yyyy-MM-dd) — 클라에서 rooms 조회로 채운다
  confirmedDate?: string;
  // 테니스방의 예정 날짜(yyyy-MM-dd) — 달력에 칩으로 찍기 위해 채운다
  eventDate?: string;
};

// 서비스 현황 한 줄의 표시 데이터. main은 핵심 수치 한 줄, sub는 보조 설명.
export type WidgetView = {
  main: string;
  sub?: string;
  // 진행바(예산 대비 등) — 0~1 비율과 초과 여부. 없으면 미표시.
  progress?: { ratio: number; over: boolean } | null;
};

export type WidgetStatus = "loading" | "ready" | "empty" | "error";

// 서비스별 아이콘 톤 (같은 파랑 반복 → 서비스마다 색 구분으로 생동감)
export type WidgetTone =
  | "blue"
  | "amber"
  | "green"
  | "teal"
  | "indigo"
  | "rose"
  | "orange";

// 이번 달 게이지 띠의 한 칸. 달 단위 목표가 있는 서비스만 만든다.
export type GaugeItem = {
  // 고리 안에 크게 쓰는 값 ("62%", "12일")
  value: string;
  // 고리 아래 서비스 이름
  caption: string;
  // 서비스 이름 아래 한 줄 설명 ("이달 예산 사용")
  label: string;
  // 고리를 채우는 비율(0~1로 잘라 쓴다)
  ratio: number;
  over: boolean;
  icon: string;
  tone: WidgetTone;
  href: string;
};

// 달력 칩과 "다가오는 일정"이 함께 쓰는 항목.
// 날짜 있는 방(약속·테니스)과 제목이 있는 서비스 기록(업무 할 일·야근)이 같은 모양으로 모인다.
export type DatedItem = {
  id: string;
  // yyyy-MM-dd
  date: string;
  // 칩·목록 앞에 붙는 갈래 이름 ("약속" · "테니스" · "업무" · "야근")
  kind: string;
  tone: WidgetTone;
  label: string;
  href: string;
  // "다가오는 일정" 목록에 올릴 항목인지. 지난 기록인 야근은 false.
  upcoming: boolean;
};

export function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

// 확정된 약속 날짜 표기: "📅 11월 14일 (토) 확정 · D-87" (지난 약속은 D-day 생략)
export function formatConfirmedDate(dateStr: string) {
  const date = parseISO(dateStr);
  if (isNaN(date.getTime())) return `📅 ${dateStr} 확정`;
  const base = `📅 ${format(date, "M월 d일 (EEE)", { locale: ko })} 확정`;
  const dday = differenceInCalendarDays(date, new Date());
  if (dday > 0) return `${base} · D-${dday}`;
  if (dday === 0) return `${base} · 오늘!`;
  return base;
}

// D-day 배지 문구
export function formatDday(dateStr: string) {
  const dday = differenceInCalendarDays(parseISO(dateStr), new Date());
  if (dday === 0) return "오늘";
  if (dday > 0) return `D-${dday}`;
  return `D+${-dday}`;
}

// ── 이번 달 게이지 한 칸 ──
export const GAUGE_RADIUS = 34;

export const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

export function GaugeRing({ gauge }: { gauge: GaugeItem }) {
  const filled = clamp01(gauge.ratio);
  return (
    <StGauge href={gauge.href}>
      <StGaugeRingWrap>
        <StGaugeSvg viewBox="0 0 80 80" aria-hidden="true">
          <StGaugeTrack cx="40" cy="40" r={GAUGE_RADIUS} />
          <StGaugeFill
            cx="40"
            cy="40"
            r={GAUGE_RADIUS}
            $tone={gauge.tone}
            $over={gauge.over}
            strokeDasharray={GAUGE_CIRCUMFERENCE}
            strokeDashoffset={GAUGE_CIRCUMFERENCE * (1 - filled)}
            transform="rotate(-90 40 40)"
          />
        </StGaugeSvg>
        <StGaugeValue $over={gauge.over}>{gauge.value}</StGaugeValue>
      </StGaugeRingWrap>
      <StGaugeText>
        <StGaugeCaption>
          <span aria-hidden="true">{gauge.icon}</span> {gauge.caption}
        </StGaugeCaption>
        <StGaugeLabel>{gauge.label}</StGaugeLabel>
      </StGaugeText>
    </StGauge>
  );
}

// ── 서비스 현황 한 줄: 왼쪽 아이콘·이름 / 가운데 수치 / 오른쪽 열기 ──
// benefit: 수치 아래에 붙는 '연결하면 이게 좋아요' 한 줄 (로그인 전후 같은 문장)
// sample: 예시 데이터임을 알리는 배지 (로그인 전에만)
export function WidgetShell({
  href,
  icon,
  name,
  view,
  status,
  tone = "blue",
  onContextMenu,
  benefit,
  sample,
}: {
  href: string;
  icon: string;
  name: string;
  view: WidgetView | null;
  status: WidgetStatus;
  tone?: WidgetTone;
  onContextMenu?: (event: ReactMouseEvent<HTMLElement>) => void;
  benefit?: string;
  sample?: boolean;
}) {
  const main =
    status === "loading"
      ? "불러오는 중…"
      : status === "empty"
        ? "기록 없음"
        : view?.main || "기록 없음";
  const sub = status === "ready" ? view?.sub : undefined;
  const progress = status === "ready" ? view?.progress : null;

  return (
    <StServiceRow href={href} onContextMenu={onContextMenu}>
      <StRowHead>
        <StWidgetIcon $tone={tone}>{icon}</StWidgetIcon>
        <StRowName>{name}</StRowName>
        {sample ? <StSampleBadge>예시</StSampleBadge> : null}
      </StRowHead>
      <StRowBody>
        <StRowValue $muted={status !== "ready"}>{main}</StRowValue>
        {sub ? <StRowSub>{sub}</StRowSub> : null}
        {progress ? (
          <StRowBar>
            <StRowFill
              $tone={tone}
              $over={progress.over}
              style={{ width: `${clamp01(progress.ratio) * 100}%` }}
            />
          </StRowBar>
        ) : null}
        {benefit ? (
          <StRowBenefit>
            <span aria-hidden="true">✓</span> {benefit}
          </StRowBenefit>
        ) : null}
      </StRowBody>
      <StRowOpen>열기 →</StRowOpen>
    </StServiceRow>
  );
}

// ── ② 이번 달 달력 + 다가오는 일정 ──
// 로그인 전 예시 화면과 로그인 후 실제 화면이 이 컴포넌트 하나를 같이 쓴다.
// 계산은 전부 부르는 쪽에서 하고, 여기는 받은 값을 그리기만 한다.
export function CalendarBoard({
  month,
  onMonthChange,
  events,
  note,
  planCount,
  workoutDays,
  overtimeDays,
  showWorkout,
  showSchedule,
  showOvertime,
  upcoming,
}: {
  month: Date;
  onMonthChange: (next: Date) => void;
  events: MonthCalendarEvent[];
  note: string;
  planCount: number;
  workoutDays: number;
  overtimeDays: number;
  showWorkout: boolean;
  showSchedule: boolean;
  showOvertime: boolean;
  upcoming: DatedItem[];
}) {
  return (
    <StBoard>
      <StBoardHead>
        <StBoardTitleWrap>
          <StBoardTitle>🗓️ 이번 달 달력</StBoardTitle>
        </StBoardTitleWrap>
        <StBoardNote>{note}</StBoardNote>
      </StBoardHead>
      <StCalendarLayout>
        <StCalendarPane>
          <MonthCalendar
            month={month}
            events={events}
            onMonthChange={onMonthChange}
            summary={
              <StCalSummaryRow>
                <StCalSummaryItem>
                  <b>{planCount}</b>건 일정
                </StCalSummaryItem>
                {showWorkout ? (
                  <StCalSummaryItem>
                    <b>{workoutDays}</b>일 운동
                  </StCalSummaryItem>
                ) : null}
                {showOvertime ? (
                  <StCalSummaryItem>
                    <b>{overtimeDays}</b>일 야근
                  </StCalSummaryItem>
                ) : null}
              </StCalSummaryRow>
            }
            legend={
              <>
                <StLegendItem $tone="indigo">
                  <StLegendDot $tone="indigo" />
                  약속
                </StLegendItem>
                <StLegendItem $tone="green">
                  <StLegendDot $tone="green" />
                  테니스
                </StLegendItem>
                {showWorkout ? (
                  <StLegendItem $tone="blue">
                    <StLegendDot $tone="blue" />
                    운동
                  </StLegendItem>
                ) : null}
                {showSchedule ? (
                  <StLegendItem $tone="teal">
                    <StLegendDot $tone="teal" />
                    업무
                  </StLegendItem>
                ) : null}
                {showOvertime ? (
                  <StLegendItem $tone="orange">
                    <StLegendDot $tone="orange" />
                    야근
                  </StLegendItem>
                ) : null}
              </>
            }
            emptyHint="이 달에는 표시할 일정이 없어요."
          />
        </StCalendarPane>
        <StUpcomingPane>
          <StUpcomingTitle>다가오는 일정</StUpcomingTitle>
          {upcoming.length > 0 ? (
            <StUpcomingList>
              {upcoming.map((item) => (
                <StUpcomingRow key={item.id} href={item.href}>
                  <StUpcomingDday $tone={item.tone}>
                    {formatDday(item.date)}
                  </StUpcomingDday>
                  <StUpcomingBody>
                    <StUpcomingLabel>{item.label}</StUpcomingLabel>
                    <StUpcomingDate>
                      {item.kind} ·{" "}
                      {format(parseISO(item.date), "M월 d일 (EEE)", {
                        locale: ko,
                      })}
                    </StUpcomingDate>
                  </StUpcomingBody>
                </StUpcomingRow>
              ))}
            </StUpcomingList>
          ) : (
            <StUpcomingEmpty>
              아직 잡힌 약속이 없어요. 약속방에서 날짜를 확정하면 여기에 떠요.
            </StUpcomingEmpty>
          )}
        </StUpcomingPane>
      </StCalendarLayout>
    </StBoard>
  );
}

// ── ④ 내 방 ──
// manageHref/onDelete 가 없으면(로그인 전 예시) '관리'와 해제 버튼을 빼고 그리기만 한다.
export function RoomBoard({
  rooms,
  notice,
  manageHref,
  onDelete,
  note,
  hrefFor,
}: {
  rooms: RoomRow[];
  notice: string;
  manageHref?: string;
  onDelete?: (room: RoomRow) => void;
  note?: string;
  hrefFor?: (room: RoomRow) => string;
}) {
  return (
    <StBoard>
      <StBoardHead>
        <StBoardTitleWrap>
          <StBoardTitle>🗓️ 내 방</StBoardTitle>
        </StBoardTitleWrap>
        {manageHref ? (
          <Link href={manageHref} passHref>
            <StBoardManage>관리</StBoardManage>
          </Link>
        ) : note ? (
          <StBoardNote>{note}</StBoardNote>
        ) : null}
      </StBoardHead>
      <StRoomNotice>{notice}</StRoomNotice>
      {/* 방은 여러 건일 수 있어 카드 대신 서비스별로 묶어 나열한다 */}
      {ROOM_SERVICES.map((service) => {
        const group = rooms.filter((room) => room.service === service);
        if (group.length === 0) return null;
        const meta = ROOM_SERVICE_META[service];
        return (
          <StRoomGroup key={service}>
            <StRoomGroupHead>
              {meta.icon} {meta.name}
            </StRoomGroupHead>
            <StRoomList>
              {group.map((room) => (
                <StRoomRow key={room.id}>
                  <Link
                    href={
                      hrefFor
                        ? hrefFor(room)
                        : withFromMy(meta.href(room.roomId))
                    }
                    passHref
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <StRoomLink>
                      <StRoomIcon $tone={meta.tone}>{meta.icon}</StRoomIcon>
                      <StRoomInfo>
                        <StRoomLabel>{room.label || meta.name}</StRoomLabel>
                        {room.confirmedDate ? (
                          <StRoomDate>
                            {formatConfirmedDate(room.confirmedDate)}
                          </StRoomDate>
                        ) : null}
                      </StRoomInfo>
                    </StRoomLink>
                  </Link>
                  {onDelete ? (
                    <StRoomDelete
                      type="button"
                      aria-label="방 등록 해제"
                      onClick={() => onDelete(room)}
                    >
                      ✕
                    </StRoomDelete>
                  ) : null}
                </StRoomRow>
              ))}
            </StRoomList>
          </StRoomGroup>
        );
      })}
    </StBoard>
  );
}

// ── 톤 팔레트 (아이콘 배지·게이지·범례가 함께 쓴다) ──
export const toneBg = (tone: WidgetTone) => (theme: { colors: Record<string, string> }) =>
  ({
    blue: theme.colors.blue50,
    amber: theme.colors.amber50,
    green: theme.colors.green50,
    teal: theme.colors.teal50,
    indigo: theme.colors.indigo50,
    rose: theme.colors.rose50,
    orange: theme.colors.orange50,
  })[tone];

export const toneFg = (tone: WidgetTone) => (theme: { colors: Record<string, string> }) =>
  ({
    blue: theme.colors.blue600,
    amber: theme.colors.amber600,
    green: theme.colors.green600,
    teal: theme.colors.teal600,
    indigo: theme.colors.indigo600,
    rose: theme.colors.rose600,
    orange: theme.colors.orange600,
  })[tone];

export const StSection = styled.section<{ $wide?: boolean }>`
  width: 100%;
  max-width: ${({ $wide }) => ($wide ? "100%" : "600px")};
  margin-bottom: 3rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

// 대시보드 스타일: 회색 배경 위에 섹션 라벨 + 흰 판 (홈 메뉴와 같은 결)
export const StBoard = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

export const StBoardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0 0.25rem;
`;

export const StBoardTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray700};
`;

// 섹션 제목 아래(또는 옆)의 작은 설명 한 줄
export const StBoardNote = styled.p`
  padding: 0 0.25rem;
  font-size: 0.76rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray400};
  text-align: right;

  @media ${({ theme }) => theme.media.mobile} {
    text-align: left;
  }
`;

export const StBoardManage = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.primary};
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.7;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`;

export const StBoardTitleWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

// ── ① 이번 달 게이지 띠 ──
export const StGaugeStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;

  /* 칸이 늘어나도 한 줄에 욱여넣지 않고, 좁아지면 아랫줄로 접힌다 */
  @media (min-width: 640px) {
    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
    gap: 0.85rem;
  }
`;

export const StGauge = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 1rem 0.6rem 0.9rem;

  /* 넓은 화면: 고리 왼쪽 · 이름/설명 오른쪽 (카드가 허전해지지 않게) */
  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0 0.9rem;
    padding: 1.1rem 1rem;
  }
  border-radius: 1.25rem;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  text-decoration: none;
  transition:
    transform 0.2s,
    box-shadow 0.2s,
    border-color 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border-color: ${({ theme }) => theme.colors.blue200};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.primary};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover {
      transform: none;
    }
  }
`;

export const StGaugeRingWrap = styled.div`
  position: relative;
  width: 5rem;
  height: 5rem;
`;

export const StGaugeSvg = styled.svg`
  width: 100%;
  height: 100%;
  display: block;
`;

export const StGaugeTrack = styled.circle`
  fill: none;
  stroke: ${({ theme }) => theme.colors.gray100};
  stroke-width: 8;
`;

export const StGaugeFill = styled.circle<{ $tone: WidgetTone; $over: boolean }>`
  fill: none;
  stroke: ${({ $tone, $over, theme }) =>
    $over ? theme.colors.rose600 : toneFg($tone)(theme)};
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const StGaugeValue = styled.strong<{ $over: boolean }>`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: ${({ $over, theme }) =>
    $over ? theme.colors.rose600 : theme.colors.gray900};
`;

// 넓은 화면에서 고리 오른쪽에 붙는 글자 묶음
export const StGaugeText = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  min-width: 0;

  @media (min-width: 640px) {
    align-items: flex-start;
  }
`;

export const StGaugeCaption = styled.span`
  margin-top: 0.2rem;
  font-size: 0.88rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};

  @media (min-width: 640px) {
    margin-top: 0;
  }
`;

export const StGaugeLabel = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray400};
  text-align: center;

  @media (min-width: 640px) {
    text-align: left;
  }
`;

// ── ② 달력 + 다가오는 일정 ──
export const StCalendarLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  padding: 1.1rem;
  border-radius: 1.25rem;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  @media (min-width: 900px) {
    grid-template-columns: minmax(0, 1fr) 15rem;
    gap: 1.5rem;
  }
`;

export const StCalendarPane = styled.div`
  min-width: 0;
`;

export const StCalSummaryRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem 1.2rem;
`;

export const StCalSummaryItem = styled.span`
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray600};

  b {
    font-size: 1.05rem;
    font-weight: 900;
    color: ${({ theme }) => theme.colors.gray900};
    margin-right: 0.15rem;
  }
`;

export const StLegendItem = styled.span<{ $tone: WidgetTone }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray600};
`;

export const StLegendDot = styled.span<{ $tone: WidgetTone }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $tone, theme }) => toneFg($tone)(theme)};
`;

export const StUpcomingPane = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  @media (min-width: 900px) {
    border-left: 1px solid ${({ theme }) => theme.colors.gray100};
    padding-left: 1.5rem;
  }

  @media (max-width: 899px) {
    border-top: 1px solid ${({ theme }) => theme.colors.gray100};
    padding-top: 1rem;
  }
`;

export const StUpcomingTitle = styled.p`
  font-size: 0.8rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray700};
`;

export const StUpcomingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

export const StUpcomingRow = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.6rem;
  border-radius: 0.85rem;
  text-decoration: none;
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.gray50};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.primary};
    outline-offset: 1px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const StUpcomingDday = styled.span<{ $tone: WidgetTone }>`
  flex-shrink: 0;
  min-width: 3rem;
  padding: 0.3rem 0.4rem;
  border-radius: 0.55rem;
  text-align: center;
  font-size: 0.74rem;
  font-weight: 900;
  background: ${({ $tone, theme }) => toneBg($tone)(theme)};
  color: ${({ $tone, theme }) => toneFg($tone)(theme)};
`;

export const StUpcomingBody = styled.div`
  min-width: 0;
`;

export const StUpcomingLabel = styled.p`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StUpcomingDate = styled.p`
  margin-top: 0.1rem;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray400};
`;

export const StUpcomingEmpty = styled.p`
  font-size: 0.78rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.gray400};
`;

// ── ③ 서비스 현황: 카드 대신 구분선으로 나눈 넓은 줄 ──
export const StServiceList = styled.div`
  width: 100%;
  border-radius: 1.25rem;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

export const StWidgetIcon = styled.div<{ $tone: WidgetTone }>`
  width: 2.1rem;
  height: 2.1rem;
  background-color: ${({ $tone, theme }) => toneBg($tone)(theme)};
  color: ${({ $tone, theme }) => toneFg($tone)(theme)};
  border-radius: 0.65rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.1rem;
  transition: transform 0.2s;
  flex-shrink: 0;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const StRowHead = styled.div`
  grid-area: head;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
`;

export const StRowName = styled.span`
  font-size: 0.88rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};
  white-space: nowrap;
`;

export const StRowBody = styled.div`
  grid-area: main;
  min-width: 0;
`;

export const StRowValue = styled.strong<{ $muted?: boolean }>`
  display: block;
  font-size: 0.98rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.3;
  color: ${({ $muted, theme }) =>
    $muted ? theme.colors.gray400 : theme.colors.gray900};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StRowSub = styled.p`
  margin-top: 0.1rem;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray400};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// 수치 아래 '연결하면 이게 좋아요' 한 줄 (로그인 전 예시 줄과 로그인 후 진짜 줄이 같은 문장)
export const StRowBenefit = styled.p`
  display: flex;
  align-items: flex-start;
  gap: 0.3rem;
  margin-top: 0.25rem;
  font-size: 0.74rem;
  line-height: 1.4;
  font-weight: 600;
  color: ${({ theme }) => theme.semantic.primary};
  word-break: keep-all;

  > span {
    flex-shrink: 0;
    font-weight: 900;
  }
`;

// 로그인 전 미리보기에서 '이건 예시예요'를 알리는 작은 배지
export const StSampleBadge = styled.span`
  flex-shrink: 0;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  /* gray100 은 다크에서 카드 표면과 같은 색이라 알약이 사라진다 */
  background: ${({ theme }) => theme.colors.gray200};
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.02em;
`;

export const StRowBar = styled.div`
  margin-top: 0.35rem;
  max-width: 16rem;
  height: 0.32rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.gray100};
  overflow: hidden;
`;

export const StRowFill = styled.div<{ $tone: WidgetTone; $over?: boolean }>`
  height: 100%;
  border-radius: inherit;
  background: ${({ $tone, $over, theme }) =>
    $over ? theme.colors.rose600 : toneFg($tone)(theme)};
  transition: width 0.2s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const StRowOpen = styled.span`
  grid-area: open;
  align-self: center;
  flex-shrink: 0;
  font-size: 0.8rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.primary};
  white-space: nowrap;
`;

export const StServiceRow = styled(Link)`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    "head open"
    "main main";
  align-items: center;
  gap: 0.35rem 0.75rem;
  padding: 0.65rem 0.9rem; /* 줄이 너무 커 보인다는 피드백(2026-09-08)으로 축소 */
  text-decoration: none;
  transition: background 0.15s;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.gray100};
  }

  &:hover {
    background: ${({ theme }) => theme.colors.gray50};

    ${StWidgetIcon} {
      transform: scale(1.06) rotate(4deg);
    }
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.primary};
    outline-offset: -2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  @media (min-width: 720px) {
    grid-template-columns: 9.5rem minmax(0, 1fr) auto;
    grid-template-areas: "head main open";
    gap: 0.6rem 1rem;
    padding: 0.7rem 1rem;
  }
`;

// ── 약속·정산방 리스트 ──
export const StRoomList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const StRoomRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 1rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  padding: 0.6rem 0.75rem;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border-color: ${({ theme }) => theme.colors.blue200};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const StRoomLink = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
  cursor: pointer;
`;

// 위젯 아이콘과 같은 톤, 리스트에 맞게 크기만 줄임
export const StRoomIcon = styled(StWidgetIcon)`
  width: 2.4rem;
  height: 2.4rem;
  font-size: 1.2rem;
  border-radius: 0.65rem;
`;

export const StRoomInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const StRoomNotice = styled.p`
  margin-bottom: 0.75rem;
  font-size: 0.78rem;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.gray500};
`;

export const StRoomGroup = styled.div`
  & + & {
    margin-top: 1rem;
  }
`;

export const StRoomGroupHead = styled.p`
  margin-bottom: 0.4rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray500};
`;

export const StRoomLabel = styled.p`
  font-size: 0.92rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StRoomDate = styled.p`
  margin-top: 0.15rem;
  font-size: 0.76rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.indigo600};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StRoomDelete = styled.button`
  flex-shrink: 0;
  width: 1.9rem;
  height: 1.9rem;
  border: none;
  border-radius: 50%;
  background: none;
  color: ${({ theme }) => theme.colors.gray300};
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.rose50};
    color: ${({ theme }) => theme.colors.rose600};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.primary};
    outline-offset: 2px;
  }
`;
