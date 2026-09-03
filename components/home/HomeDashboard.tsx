"use client";

import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import styled from "styled-components";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useModal } from "@/components/common/ModalProvider";
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
  fetchCalcRoomNames,
  fetchMeetingConfirmedDates,
} from "@/services/homeSummary";
import { isUuid } from "@/lib/slug";
import {
  ROOM_SECRET_NOTICE,
  ROOM_SERVICE_META,
  ROOM_SERVICES,
  isRoomService,
  type RoomService,
} from "@/lib/roomServices";
import QuickActionModal, {
  QUICK_ACTION_META,
  type QuickService,
} from "@/components/home/QuickActionModal";

// /my에서 서비스로 이동한 뒤 헤더 백키로 다시 /my로 돌아올 수 있게 하는 쿼리
const withFromMy = (href: string) =>
  `${href}${href.includes("?") ? "&" : "?"}from=my`;

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

// "내 방": 서비스당 여러 개일 수 있는 진행 중 방(약속·정산·장소·테니스·게임·야근·일일기록).
// 아이콘·이름·링크는 lib/roomServices.ts에서 가져와 /account와 똑같이 보이게 한다.
type RoomRow = {
  id: string;
  service: RoomService;
  roomId: string;
  label: string;
  createdAt: string;
  // 약속방의 확정된 약속 날짜(yyyy-MM-dd) — 클라에서 rooms 조회로 채운다
  confirmedDate?: string;
};

// 위젯 로더의 표시 데이터. main은 핵심 수치 한 줄, sub는 보조 설명.
type WidgetView = {
  main: string;
  sub?: string;
  // 진행바(예산 대비 등) — 0~1 비율과 초과 여부. 없으면 미표시.
  progress?: { ratio: number; over: boolean } | null;
};

type WidgetStatus = "loading" | "ready" | "empty" | "error";

// 서비스별 아이콘 톤 (같은 파랑 반복 → 서비스마다 색 구분으로 생동감)
type WidgetTone = "blue" | "amber" | "green" | "teal" | "indigo" | "rose";

const DAY_FORMAT = "yyyy-MM-dd";

function formatKrw(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

// 확정된 약속 날짜 표기: "📅 11월 14일 (토) 확정 · D-87" (지난 약속은 D-day 생략)
function formatConfirmedDate(dateStr: string) {
  const date = parseISO(dateStr);
  if (isNaN(date.getTime())) return `📅 ${dateStr} 확정`;
  const base = `📅 ${format(date, "M월 d일 (EEE)", { locale: ko })} 확정`;
  const dday = differenceInCalendarDays(date, new Date());
  if (dday > 0) return `${base} · D-${dday}`;
  if (dday === 0) return `${base} · 오늘!`;
  return base;
}

// ── 공통 위젯 셸: 아이콘 + 서비스명 + 핵심 수치. 클릭 시 해당 서비스로 이동 ──
function WidgetShell({
  href,
  icon,
  name,
  view,
  status,
  tone = "blue",
}: {
  href: string;
  icon: string;
  name: string;
  view: WidgetView | null;
  status: WidgetStatus;
  tone?: WidgetTone;
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
        <StWidgetIcon $tone={tone}>{icon}</StWidgetIcon>
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
      // 연결된 워크스페이스가 있으면 허브를 거치지 않고 개인 가계부로 바로 이동
      href={withFromMy(
        workspaceId
          ? `/account-book?workspaceId=${workspaceId}`
          : "/account-book",
      )}
      tone="amber"
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
      href={withFromMy("/workout")}
      tone="blue"
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
      href={withFromMy(`/habit/${goalId}`)}
      tone="teal"
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
      href={withFromMy(`/diet/${goalId}`)}
      tone="green"
      icon="🥗"
      name="다이어트"
      view={view}
      status={status}
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

// wide: 전용 페이지(/my)에서 PC 화면을 넓게 쓰는 레이아웃 (기본은 홈용 540~600px 폭)
export default function HomeDashboard({ wide = false }: { wide?: boolean }) {
  const { user, loading } = useAuth();
  const [links, setLinks] = useState<LinkRow[] | null>(null);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [guideOpen, setGuideOpen] = useState(false);
  // 우클릭 컨텍스트 메뉴(빠른 등록) 상태
  const [quickMenu, setQuickMenu] = useState<{
    x: number;
    y: number;
    link: LinkRow;
  } | null>(null);
  const [quickModal, setQuickModal] = useState<LinkRow | null>(null);
  // 빠른 등록 후 위젯 그리드를 다시 마운트해 요약을 새로고침한다
  const [refreshKey, setRefreshKey] = useState(0);

  const { openConfirm, openAlert } = useModal();

  // 방 등록 해제: 계정에서만 빠지고 방 자체는 남는다 (/account 관리와 동일 동작)
  const handleDeleteRoom = async (room: RoomRow) => {
    const meta = ROOM_SERVICE_META[room.service];
    const confirmed = await openConfirm(
      `'${room.label || meta.name}' 방 등록을 해제할까요?\n(방 자체는 삭제되지 않아요)`,
    );
    if (!confirmed) return;
    try {
      const res = await fetch(
        `/api/auth/rooms?service=${room.service}&roomId=${encodeURIComponent(room.roomId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("room delete failed");
      const data = (await res.json()) as { rooms?: RoomRow[] };
      setRooms(data.rooms ?? []);
    } catch {
      await openAlert("해제에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  const openQuickMenu = (
    event: ReactMouseEvent<HTMLDivElement>,
    link: LinkRow,
  ) => {
    if (!(link.service in QUICK_ACTION_META)) return;
    event.preventDefault();
    // 화면 오른쪽 끝에서 메뉴가 잘리지 않게 보정
    const x = Math.min(event.clientX, window.innerWidth - 230);
    setQuickMenu({ x, y: event.clientY, link });
  };

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
        // 모르는 서비스가 섞여 있으면(예: 앱보다 먼저 늘어난 DB) 조용히 걸러 낸다
        const loaded = (data.rooms ?? []).filter((room) =>
          isRoomService(room.service),
        );
        if (active) setRooms(loaded);

        // 정산방 라벨이 비었거나 uuid면 calc_rooms의 실제 방 이름(약속 파생명)으로 교체
        const unnamedCalcIds = loaded
          .filter(
            (room) =>
              room.service === "calc" &&
              (!room.label || isUuid(room.label)) &&
              isUuid(room.roomId),
          )
          .map((room) => room.roomId);
        // 약속방은 확정된 약속 날짜를 함께 로드해 행에 표시
        const meetingIds = loaded
          .filter((room) => room.service === "meeting")
          .map((room) => room.roomId);
        const [names, confirmedDates] = await Promise.all([
          unnamedCalcIds.length > 0
            ? fetchCalcRoomNames(unnamedCalcIds).catch(
                () => ({}) as Record<string, string>,
              )
            : Promise.resolve({} as Record<string, string>),
          meetingIds.length > 0
            ? fetchMeetingConfirmedDates(meetingIds).catch(
                () => ({}) as Record<string, string>,
              )
            : Promise.resolve({} as Record<string, string>),
        ]);
        if (
          active &&
          (Object.keys(names).length > 0 ||
            Object.keys(confirmedDates).length > 0)
        ) {
          setRooms((prev) =>
            prev.map((room) => ({
              ...room,
              label: names[room.roomId] || room.label,
              confirmedDate:
                room.service === "meeting"
                  ? confirmedDates[room.roomId]
                  : undefined,
            })),
          );
        }
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
      <StSection $wide={wide}>
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
      <StSection $wide={wide}>
        <StBoard>
          <StBoardHead>
            <StBoardTitle>📊 서비스 현황</StBoardTitle>
          </StBoardHead>
          <StGrid $wide={wide}>
            <StSkeletonCard />
            <StSkeletonCard />
          </StGrid>
        </StBoard>
      </StSection>
    );
  }

  const supportedLinks = links.filter((link) => link.service !== "schedule");
  const hasRooms = rooms.length > 0;

  // 연결된 서비스도, 등록된 방도 없을 때
  if (supportedLinks.length === 0 && !hasRooms) {
    return (
      <StSection $wide={wide}>
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
    <StSection $wide={wide}>
      {supportedLinks.length > 0 ? (
        <StBoard>
          <StBoardHead>
            <StBoardTitleWrap>
              <StBoardTitle>📊 서비스 현황</StBoardTitle>
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
            <Link href={withFromMy("/account")} passHref>
              <StBoardManage>연결 관리</StBoardManage>
            </Link>
          </StBoardHead>
          <StGrid $wide={wide} key={refreshKey}>
            {supportedLinks.map((link) => (
              <div
                key={link.service}
                style={{ display: "contents" }}
                onContextMenu={(event) => openQuickMenu(event, link)}
              >
                {renderWidget(link)}
              </div>
            ))}
          </StGrid>
        </StBoard>
      ) : null}

      {hasRooms ? (
        <StBoard>
          <StBoardHead>
            <StBoardTitleWrap>
              <StBoardTitle>🗓️ 내 방</StBoardTitle>
            </StBoardTitleWrap>
            <Link href={withFromMy("/account")} passHref>
              <StBoardManage>관리</StBoardManage>
            </Link>
          </StBoardHead>
          <StRoomNotice>{ROOM_SECRET_NOTICE}</StRoomNotice>
          {/* 방은 여러 건일 수 있어 카드 대신 서비스별로 묶어 나열하고, 행에서 바로 해제한다 */}
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
                        href={withFromMy(meta.href(room.roomId))}
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
                      <StRoomDelete
                        type="button"
                        aria-label="방 등록 해제"
                        onClick={() => void handleDeleteRoom(room)}
                      >
                        ✕
                      </StRoomDelete>
                    </StRoomRow>
                  ))}
                </StRoomList>
              </StRoomGroup>
            );
          })}
        </StBoard>
      ) : null}

      {/* 우클릭 컨텍스트 메뉴: 서비스별 대표 기능 바로 등록 */}
      {quickMenu ? (
        <>
          <StMenuBackdrop
            onClick={() => setQuickMenu(null)}
            onContextMenu={(event) => {
              event.preventDefault();
              setQuickMenu(null);
            }}
          />
          <StContextMenu style={{ top: quickMenu.y, left: quickMenu.x }}>
            <StContextMenuItem
              type="button"
              onClick={() => {
                setQuickModal(quickMenu.link);
                setQuickMenu(null);
              }}
            >
              {QUICK_ACTION_META[quickMenu.link.service as QuickService].label}
            </StContextMenuItem>
          </StContextMenu>
        </>
      ) : null}

      {quickModal ? (
        <QuickActionModal
          service={quickModal.service as QuickService}
          resourceRef={quickModal.resourceRef}
          onClose={() => setQuickModal(null)}
          onSaved={() => setRefreshKey((key) => key + 1)}
        />
      ) : null}
    </StSection>
  );
}

const StSection = styled.section<{ $wide?: boolean }>`
  width: 100%;
  max-width: ${({ $wide }) => ($wide ? "100%" : "600px")};
  margin-bottom: 3rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

// 대시보드 스타일: 회색 배경 위에 섹션 라벨 + 흰 카드 그리드 (홈 메뉴와 같은 결)
const StBoard = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

const StBoardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0 0.25rem;
`;

const StBoardTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray700};
`;

const StBoardManage = styled.span`
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
  background: ${({ theme }) => theme.colors.gray200};
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 0.72rem;
  font-weight: 900;
  font-style: italic;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ theme }) => theme.colors.gray300};
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

const StMenuBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 110;
`;

const StContextMenu = styled.div`
  position: fixed;
  z-index: 115;
  min-width: 13rem;
  padding: 0.3rem;
  border-radius: 0.85rem;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  box-shadow: 0 14px 30px -8px rgba(23, 43, 77, 0.35);
`;

const StContextMenuItem = styled.button`
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: none;
  border-radius: 0.6rem;
  background: none;
  text-align: left;
  font-size: 0.9rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray800};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray50};
  }
`;

const StGrid = styled.div<{ $wide?: boolean }>`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 640px) {
    /* minmax(0,1fr): 긴 텍스트(uuid 등)가 트랙을 밀어 카드가 넘치지 않게 */
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  /* 전용 페이지(wide)에서는 데스크톱에서 3열로 넓게 */
  @media ${({ theme }) => theme.media.desktop} {
    grid-template-columns: ${({ $wide }) =>
      $wide ? "repeat(3, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))"};
  }
`;

const StWidgetIcon = styled.div<{ $tone: WidgetTone }>`
  width: 3rem;
  height: 3rem;
  background-color: ${({ $tone, theme }) =>
    ({
      blue: theme.colors.blue50,
      amber: theme.colors.amber50,
      green: theme.colors.green50,
      teal: theme.colors.teal50,
      indigo: theme.colors.indigo50,
      rose: theme.colors.rose50,
    })[$tone]};
  color: ${({ $tone, theme }) =>
    ({
      blue: theme.colors.blue600,
      amber: theme.colors.amber600,
      green: theme.colors.green600,
      teal: theme.colors.teal600,
      indigo: theme.colors.indigo600,
      rose: theme.colors.rose600,
    })[$tone]};
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
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  height: 100%;

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border-color: ${({ theme }) => theme.colors.blue200};
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

// ── 약속·정산방 리스트 ──
const StRoomList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StRoomRow = styled.div`
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
`;

const StRoomLink = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
  cursor: pointer;
`;

// 위젯 아이콘과 같은 톤, 리스트에 맞게 크기만 줄임
const StRoomIcon = styled(StWidgetIcon)`
  width: 2.4rem;
  height: 2.4rem;
  font-size: 1.2rem;
  border-radius: 0.65rem;
`;

const StRoomInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const StRoomNotice = styled.p`
  margin-bottom: 0.75rem;
  font-size: 0.78rem;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.gray500};
`;

const StRoomGroup = styled.div`
  & + & {
    margin-top: 1rem;
  }
`;

const StRoomGroupHead = styled.p`
  margin-bottom: 0.4rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray500};
`;

const StRoomLabel = styled.p`
  font-size: 0.92rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StRoomDate = styled.p`
  margin-top: 0.15rem;
  font-size: 0.76rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.indigo600};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StRoomDelete = styled.button`
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
`;

const StSkeletonCard = styled.div`
  height: 5.2rem;
  border-radius: 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  background: ${({ theme }) => theme.colors.gray100};
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
