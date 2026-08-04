"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { fetchAccountBookStore } from "@/app/account-book/repository";
import {
  isSavingsCategory,
  isFixedExpenseCategory,
  isCardSettlementEntry,
  isWelfareEntry,
  resolveMonthlyBudget,
} from "@/app/account-book/components/WorkspaceLedgerView/utils";
import {
  fetchRunningRecords,
  fetchGymRecords,
  fetchActivityRecords,
} from "@/app/workout/repository";
import { weeklyWorkoutDays, weeklyRunDistance } from "@/app/workout/helpers";
import {
  fetchHabitTodaySummary,
  fetchDietProgressSummary,
} from "@/services/homeSummary";

// 통합 홈 대시보드: 로그인 사용자의 연결된 서비스 요약을 위젯으로 보여준다.
// - 비로그인: 로그인 유도 카드 하나 (홈은 정상 동작)
// - 로그인/미연결: 계정 연결 유도 카드
// - 로그인/연결됨: 서비스별 요약 위젯 그리드 (각 위젯은 개별 격리 — 실패 시 조용히 생략)
// schedule 서비스는 서버 세션(hws-session)이 필요해 이번 v1에선 위젯을 그리지 않는다.

type LinkRow = {
  service: string;
  resourceRef: Record<string, unknown>;
  label: string;
};

// "내 방"(약속·정산): 서비스당 여러 개일 수 있는 진행 중 방.
type RoomRow = {
  id: string;
  service: "meeting" | "calc";
  roomId: string;
  label: string;
  createdAt: string;
};

const ROOM_WIDGET_META: Record<
  "meeting" | "calc",
  { icon: string; name: string; path: string }
> = {
  meeting: { icon: "📅", name: "약속잡기", path: "/meeting/room" },
  calc: { icon: "🧮", name: "정산방", path: "/calc" },
};

// 위젯 로더의 표시 데이터. main은 핵심 수치 한 줄, sub는 보조 설명.
type WidgetView = {
  main: string;
  sub?: string;
  // 진행바(예산 대비 등) — 0~1 비율과 초과 여부. 없으면 미표시.
  progress?: { ratio: number; over: boolean } | null;
};

type WidgetStatus = "loading" | "ready" | "empty" | "error";

const DAY_FORMAT = "yyyy-MM-dd";

function formatKrw(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

// ── 공통 위젯 셸: 아이콘 + 서비스명 + 핵심 수치. 클릭 시 해당 서비스로 이동 ──
function WidgetShell({
  href,
  icon,
  name,
  view,
  status,
}: {
  href: string;
  icon: string;
  name: string;
  view: WidgetView | null;
  status: WidgetStatus;
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
    <Link href={href} passHref>
      <StWidgetCard>
        <StWidgetIcon>{icon}</StWidgetIcon>
        <StWidgetBody>
          <StWidgetName>{name}</StWidgetName>
          <StWidgetValue $muted={status !== "ready"}>{main}</StWidgetValue>
          {progress ? (
            <StWidgetBar>
              <StWidgetFill
                $over={progress.over}
                style={{ width: `${Math.min(Math.max(progress.ratio, 0), 1) * 100}%` }}
              />
            </StWidgetBar>
          ) : null}
          {sub ? <StWidgetSub>{sub}</StWidgetSub> : null}
        </StWidgetBody>
      </StWidgetCard>
    </Link>
  );
}

// 위젯 로더 공통 훅: 비동기 로더를 실행하고 상태/뷰를 관리한다.
// 로더가 던지면 status="error" → 부모에서 해당 위젯만 생략한다.
function useWidgetLoader(loader: () => Promise<WidgetView | null>) {
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const [view, setView] = useState<WidgetView | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await loader();
        if (!active) return;
        if (!result) {
          setStatus("empty");
          return;
        }
        setView(result);
        setStatus("ready");
      } catch {
        if (active) setStatus("error");
      }
    })();
    return () => {
      active = false;
    };
    // loader는 위젯 마운트 시 한 번만 실행 (resourceRef는 마운트 시 고정)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, view };
}

// ── 1. 가계부: 오늘 지출(저축 제외) + 이번 달 누적 ──
function AccountBookWidget({ resourceRef }: { resourceRef: Record<string, unknown> }) {
  const workspaceId = String(resourceRef.workspaceId ?? "");
  const { status, view } = useWidgetLoader(async () => {
    if (!workspaceId) return null;
    const store = await fetchAccountBookStore();
    const today = format(new Date(), DAY_FORMAT);
    const monthPrefix = format(new Date(), "yyyy-MM");

    // 이 워크스페이스의 지출에서 카드정산(중복)은 제외
    const expenses = store.entries.filter(
      (entry) =>
        entry.workspaceId === workspaceId &&
        entry.type === "expense" &&
        !isCardSettlementEntry(entry) &&
        !isWelfareEntry(entry),
    );

    // 오늘 지출(저축 제외 실지출)
    const todayExpense = expenses
      .filter(
        (entry) => entry.date === today && !isSavingsCategory(entry.category),
      )
      .reduce((sum, entry) => sum + entry.amount, 0);

    // 이번 달 소비지출 — 가계부 예산 바와 동일 기준(고정비·저축 제외)
    const monthConsumption = expenses
      .filter(
        (entry) =>
          entry.date.startsWith(monthPrefix) &&
          !isSavingsCategory(entry.category) &&
          !isFixedExpenseCategory(entry.category),
      )
      .reduce((sum, entry) => sum + entry.amount, 0);

    // 남은 월 예산(설정돼 있을 때만 표기) — 가계부의 "OO원 남음"과 동일
    const workspace = store.workspaces.find((item) => item.id === workspaceId);
    const budget = resolveMonthlyBudget(
      workspace?.monthlyBudgets,
      workspace?.monthlyBudget,
      monthPrefix,
    );
    let sub: string | undefined;
    if (budget > 0) {
      const remaining = budget - monthConsumption;
      sub =
        remaining >= 0
          ? `예산 ${formatKrw(remaining)} 남음`
          : `예산 ${formatKrw(-remaining)} 초과`;
    }

    return {
      main:
        todayExpense > 0
          ? `오늘 지출 ${formatKrw(todayExpense)}`
          : "오늘은 아직 지출이 없어요",
      sub,
    };
  });

  if (status === "error") return null;
  return (
    <WidgetShell
      href="/account-book"
      icon="💰"
      name="가계부"
      view={view}
      status={status}
    />
  );
}

// ── 2. 운동: 이번 주 운동 일수 + 이번 주 러닝 거리 / 마지막 운동 ──
function WorkoutWidget({ resourceRef }: { resourceRef: Record<string, unknown> }) {
  const roomId = String(resourceRef.roomId ?? "");
  const { status, view } = useWidgetLoader(async () => {
    if (!roomId) return null;
    const [running, gym, activity] = await Promise.all([
      fetchRunningRecords(roomId),
      fetchGymRecords(roomId),
      fetchActivityRecords(roomId),
    ]);
    const totalRecords = running.length + gym.length + activity.length;
    if (totalRecords === 0) return null;

    const days = weeklyWorkoutDays(running, gym, activity);
    const runKm = weeklyRunDistance(running);

    // 보조: 이번 주 러닝이 있으면 거리, 없으면 마지막 운동이 며칠 전인지
    let sub: string;
    if (runKm > 0) {
      sub = `이번 주 러닝 ${Math.round(runKm * 10) / 10}km`;
    } else {
      const lastDate = [...running, ...gym, ...activity]
        .map((record) => record.date)
        .filter(Boolean)
        .sort()
        .pop();
      if (lastDate) {
        const daysAgo = differenceInCalendarDays(new Date(), parseISO(lastDate));
        sub =
          daysAgo <= 0 ? "오늘 운동했어요 💪" : `마지막 운동 ${daysAgo}일 전`;
      } else {
        sub = "이번 주 운동을 시작해봐요";
      }
    }

    return { main: `이번 주 운동 ${days}일`, sub };
  });

  if (status === "error") return null;
  return (
    <WidgetShell
      href="/workout"
      icon="🏋️"
      name="운동"
      view={view}
      status={status}
    />
  );
}

// ── 3. 습관: 오늘 완료 항목 수 / 전체 항목 수 ──
function HabitWidget({ resourceRef }: { resourceRef: Record<string, unknown> }) {
  const goalId = String(resourceRef.goalId ?? "");
  const { status, view } = useWidgetLoader(async () => {
    if (!goalId) return null;
    const summary = await fetchHabitTodaySummary(goalId);
    if (!summary) return null;
    const { done, total, streak } = summary;
    const sub =
      streak > 0
        ? `🔥 ${streak}일 연속 달성`
        : done >= total
          ? "오늘 목표 달성! 🎉"
          : "오늘도 하나씩 체크해요";
    return { main: `오늘 습관 ${done}/${total} 완료`, sub };
  });

  if (status === "error") return null;
  return (
    <WidgetShell
      href={`/habit/${goalId}`}
      icon="🌱"
      name="습관"
      view={view}
      status={status}
    />
  );
}

// ── 4. 다이어트: 시작 대비 감량 정도(절대 체중은 노출하지 않음) ──
function DietWidget({ resourceRef }: { resourceRef: Record<string, unknown> }) {
  const goalId = String(resourceRef.goalId ?? "");
  const { status, view } = useWidgetLoader(async () => {
    if (!goalId) return null;
    const summary = await fetchDietProgressSummary(goalId);
    if (!summary) return null;

    const lost = Math.round(summary.lostKg * 10) / 10;
    let main: string;
    if (!summary.hasProgress) {
      main = "기록 시작! 꾸준히 재봐요";
    } else if (lost > 0) {
      main = `지금까지 -${lost}kg 감량`;
    } else if (lost < 0) {
      main = `시작 대비 +${Math.abs(lost)}kg`;
    } else {
      main = "시작 체중 유지 중";
    }

    let sub: string | undefined;
    if (summary.remainingToTarget != null) {
      sub = `목표까지 -${Math.round(summary.remainingToTarget * 10) / 10}kg`;
    } else {
      const today = format(new Date(), DAY_FORMAT);
      sub = `${summary.latestDate === today ? "오늘" : summary.latestDate} 기록`;
    }

    return { main, sub };
  });

  if (status === "error") return null;
  return (
    <WidgetShell
      href={`/diet/${goalId}`}
      icon="🥗"
      name="다이어트"
      view={view}
      status={status}
    />
  );
}

// ── 내 방 위젯: 진행 중 방 개수/최근 방. 방이 1개면 그 방으로, 여러 개면 /account로 ──
function RoomWidget({
  service,
  rooms,
}: {
  service: "meeting" | "calc";
  rooms: RoomRow[];
}) {
  const meta = ROOM_WIDGET_META[service];
  // rooms는 최신순(RPC에서 정렬) — 첫 항목이 가장 최근 방
  const latest = rooms[0];
  const href =
    rooms.length === 1
      ? `${meta.path}/${latest.roomId}`
      : "/account";
  const view: WidgetView = {
    main:
      rooms.length === 1
        ? latest.label || meta.name
        : `진행 중 ${rooms.length}개`,
    sub: rooms.length > 1 ? `최근: ${latest.label || meta.name}` : undefined,
  };
  return (
    <WidgetShell
      href={href}
      icon={meta.icon}
      name={meta.name}
      view={view}
      status="ready"
    />
  );
}

function renderWidget(link: LinkRow) {
  switch (link.service) {
    case "account-book":
      return (
        <AccountBookWidget key={link.service} resourceRef={link.resourceRef} />
      );
    case "workout":
      return <WorkoutWidget key={link.service} resourceRef={link.resourceRef} />;
    case "habit":
      return <HabitWidget key={link.service} resourceRef={link.resourceRef} />;
    case "diet":
      return <DietWidget key={link.service} resourceRef={link.resourceRef} />;
    // schedule: 서버 세션 필요 → v1 미지원 (위젯 생략)
    default:
      return null;
  }
}

export default function HomeDashboard() {
  const { user, loading } = useAuth();
  const [links, setLinks] = useState<LinkRow[] | null>(null);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setLinks(null);
      setRooms([]);
      return;
    }
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/auth/links", { cache: "no-store" });
        if (!res.ok) throw new Error("links load failed");
        const data = (await res.json()) as { links?: LinkRow[] };
        if (active) setLinks(data.links ?? []);
      } catch {
        // 링크 로드 실패 시 빈 목록으로 처리 — 홈은 정상 유지
        if (active) setLinks([]);
      }
    })();
    void (async () => {
      try {
        const res = await fetch("/api/auth/rooms", { cache: "no-store" });
        if (!res.ok) throw new Error("rooms load failed");
        const data = (await res.json()) as { rooms?: RoomRow[] };
        if (active) setRooms(data.rooms ?? []);
      } catch {
        // 방 로드 실패 시 빈 목록 — 위젯만 생략
        if (active) setRooms([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  // 인증 확인 중에는 아무것도 그리지 않아 홈이 깔끔하게 뜨도록 한다.
  if (loading) return null;

  // 비로그인: 로그인 유도 카드
  if (!user) {
    return (
      <StSection>
        <StPromptCard>
          <StPromptText>
            로그인하면 내 서비스 요약을 한눈에 볼 수 있어요.
          </StPromptText>
          <Link href="/login" passHref>
            <StPromptButton>로그인하러 가기</StPromptButton>
          </Link>
        </StPromptCard>
      </StSection>
    );
  }

  // 로그인했지만 링크 로딩 중
  if (links === null) {
    return (
      <StSection>
        <StBoard>
          <StBoardHead>
            <StBoardTitle>✨ 내 서비스 요약</StBoardTitle>
          </StBoardHead>
          <StGrid>
            <StSkeletonCard />
            <StSkeletonCard />
          </StGrid>
        </StBoard>
      </StSection>
    );
  }

  const supportedLinks = links.filter((link) => link.service !== "schedule");
  const meetingRooms = rooms.filter((room) => room.service === "meeting");
  const calcRooms = rooms.filter((room) => room.service === "calc");
  const hasRoomWidgets = meetingRooms.length > 0 || calcRooms.length > 0;

  // 연결된 서비스도, 등록된 방도 없을 때
  if (supportedLinks.length === 0 && !hasRoomWidgets) {
    return (
      <StSection>
        <StPromptCard>
          <StPromptText>
            서비스를 계정에 연결해보세요. 연결하면 홈에서 요약을 볼 수 있어요.
          </StPromptText>
          <Link href="/account" passHref>
            <StPromptButton>서비스 연결하기</StPromptButton>
          </Link>
        </StPromptCard>
      </StSection>
    );
  }

  return (
    <StSection>
      {supportedLinks.length > 0 ? (
        <StBoard>
          <StBoardHead>
            <StBoardTitleWrap>
              <StBoardTitle>✨ 내 서비스 요약</StBoardTitle>
              <StInfoWrap>
                <StInfoButton
                  type="button"
                  aria-label="요약 사용 안내"
                  aria-expanded={guideOpen}
                  onClick={() => setGuideOpen((v) => !v)}
                >
                  i
                </StInfoButton>
                {guideOpen ? (
                  <>
                    <StTooltipOverlay onClick={() => setGuideOpen(false)} />
                    <StTooltip role="tooltip">
                      <StTooltipTitle>이렇게 쓰면 돼요</StTooltipTitle>
                      <StTooltipList>
                        <li>연결한 서비스의 오늘·이번 주 요약을 한눈에 볼 수 있어요.</li>
                        <li>카드를 누르면 해당 서비스로 바로 이동해요.</li>
                        <li>‘연결 관리’에서 서비스를 계정에 연결하거나 해제할 수 있어요.</li>
                      </StTooltipList>
                    </StTooltip>
                  </>
                ) : null}
              </StInfoWrap>
            </StBoardTitleWrap>
            <Link href="/account" passHref>
              <StBoardManage>연결 관리</StBoardManage>
            </Link>
          </StBoardHead>
          <StGrid>{supportedLinks.map((link) => renderWidget(link))}</StGrid>
        </StBoard>
      ) : null}

      {hasRoomWidgets ? (
        <StBoard>
          <StBoardHead>
            <StBoardTitleWrap>
              <StBoardTitle>🗓️ 내 약속·정산방</StBoardTitle>
            </StBoardTitleWrap>
            <Link href="/account" passHref>
              <StBoardManage>관리</StBoardManage>
            </Link>
          </StBoardHead>
          <StGrid>
            {meetingRooms.length > 0 ? (
              <RoomWidget key="meeting" service="meeting" rooms={meetingRooms} />
            ) : null}
            {calcRooms.length > 0 ? (
              <RoomWidget key="calc" service="calc" rooms={calcRooms} />
            ) : null}
          </StGrid>
        </StBoard>
      ) : null}
    </StSection>
  );
}

const StSection = styled.section`
  width: 100%;
  max-width: 600px;
  margin-bottom: 3rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

// 아래 메뉴 카드(회색 배경 위 흰 카드)와 확실히 구분되도록, 요약은 그라데이션 보드로 감싼다.
const StBoard = styled.div`
  width: 100%;
  padding: 1.25rem;
  border-radius: 1.75rem;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.blue500} 0%,
    ${({ theme }) => theme.colors.indigo500} 100%
  );
  box-shadow: 0 18px 36px -14px rgba(49, 130, 246, 0.5);
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

const StBoardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0 0.15rem;
`;

const StBoardTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 1rem;
  font-weight: 800;
  color: #ffffff;
`;

const StBoardManage = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.7;
  }
`;

const StBoardTitleWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const StInfoWrap = styled.div`
  position: relative;
  display: flex;
`;

const StInfoButton = styled.button`
  width: 1.15rem;
  height: 1.15rem;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.28);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 900;
  font-style: italic;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.45);
  }
`;

// 툴팁 바깥을 누르면 닫히도록 하는 투명 오버레이(모바일 탭 대응)
const StTooltipOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 40;
`;

const StTooltip = styled.div`
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  z-index: 50;
  width: min(17rem, 78vw);
  padding: 0.8rem 0.9rem;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 0.9rem;
  box-shadow: 0 14px 30px -8px rgba(23, 43, 77, 0.45);
  text-align: left;
`;

const StTooltipTitle = styled.p`
  font-size: 0.82rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.4rem;
`;

const StTooltipList = styled.ul`
  margin: 0;
  padding-left: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  list-style: disc;

  li {
    font-size: 0.76rem;
    line-height: 1.45;
    color: ${({ theme }) => theme.colors.gray600};
  }
`;

const StGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StWidgetIcon = styled.div`
  width: 3rem;
  height: 3rem;
  background-color: ${({ theme }) => theme.colors.blue50};
  color: ${({ theme }) => theme.colors.blue600};
  border-radius: 0.8rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  transition: transform 0.2s;
  flex-shrink: 0;
`;

const StWidgetName = styled.p`
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray400};
  margin-bottom: 0.25rem;
`;

const StWidgetValue = styled.strong<{ $muted?: boolean }>`
  display: block;
  font-size: 1rem;
  font-weight: 800;
  color: ${({ $muted, theme }) =>
    $muted ? theme.colors.gray400 : theme.colors.gray900};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StWidgetSub = styled.p`
  margin-top: 0.28rem;
  font-size: 0.74rem;
  color: ${({ theme }) => theme.colors.gray400};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StWidgetBar = styled.div`
  margin-top: 0.4rem;
  height: 0.4rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.gray100};
  overflow: hidden;
`;

const StWidgetFill = styled.div<{ $over?: boolean }>`
  height: 100%;
  border-radius: inherit;
  background: ${({ $over, theme }) =>
    $over ? theme.colors.rose600 : theme.colors.blue600};
  transition: width 0.2s ease;
`;

const StWidgetCard = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  padding: 1.1rem;
  border-radius: 1.25rem;
  box-shadow: 0 8px 18px -8px rgba(23, 43, 77, 0.28);
  border: none;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  height: 100%;

  &:hover {
    box-shadow: 0 12px 22px -8px rgba(23, 43, 77, 0.36);
    transform: translateY(-2px);

    ${StWidgetIcon} {
      transform: scale(1.1) rotate(5deg);
    }
  }
`;

const StWidgetBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const StSkeletonCard = styled.div`
  height: 5.2rem;
  border-radius: 1.25rem;
  border: none;
  background: rgba(255, 255, 255, 0.35);
`;

const StPromptCard = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  padding: 1.25rem 1.4rem;
  border-radius: 1.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const StPromptText = styled.p`
  flex: 1;
  min-width: 12rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.5;
`;

const StPromptButton = styled.span`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.blue600};
  color: ${({ theme }) => theme.colors.white};
  border-radius: 10px;
  padding: 0.55rem 0.95rem;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.blue500};
  }
`;
