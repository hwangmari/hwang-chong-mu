"use client";

import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import Link from "next/link";
import styled from "styled-components";
import {
  format,
  differenceInCalendarDays,
  parseISO,
  startOfWeek,
  endOfWeek,
  getDaysInMonth,
} from "date-fns";
import { ko } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useModal } from "@/components/common/ModalProvider";
import { SkeletonBlock, SkeletonCard } from "@/components/common/Skeleton";
import MonthCalendar, {
  type MonthCalendarEvent,
} from "@/components/common/MonthCalendar";
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
  fetchTennisEventDates,
} from "@/services/homeSummary";
import { fetchOvertimeRoomData } from "@/services/overtime";
import { OVERTIME_RULES, RULE_KEY } from "@/app/overtime/constants";
import type { OvertimeRuleId } from "@/app/overtime/types";
import {
  buildOvertimeSummary,
  formatCompactDuration,
  formatDayValue,
  formatRawDuration,
  mergeRecordsByDate,
} from "@/app/overtime/utils";
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

// 통합 홈 대시보드: 로그인 사용자의 연결된 서비스 요약을 한 화면에 모은다.
// - 비로그인: 로그인 유도 카드 하나 (홈은 정상 동작)
// - 로그인/미연결: 계정 연결 유도 카드
// - 로그인/연결됨: ① 이번 달 게이지 띠 → ② 이번 달 달력 + 다가오는 일정 → ③ 서비스 현황 → ④ 내 방
// 서비스별 조회는 대시보드에서 서비스당 딱 한 번만 돌고, 그 결과를 게이지·달력·현황이 나눠 쓴다.
// 업무 캘린더(schedule)는 서버 세션(hws-session)이 있을 때만 수치를 그리고, 없으면 안내 한 줄만 둔다.
// 야근 계산기(overtime)는 연결(link)이 아니라 "내 방"이라, 가장 최근에 등록한 방 하나를 요약한다.

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
  // 테니스방의 예정 날짜(yyyy-MM-dd) — 달력에 칩으로 찍기 위해 채운다
  eventDate?: string;
};

// 서비스 현황 한 줄의 표시 데이터. main은 핵심 수치 한 줄, sub는 보조 설명.
type WidgetView = {
  main: string;
  sub?: string;
  // 진행바(예산 대비 등) — 0~1 비율과 초과 여부. 없으면 미표시.
  progress?: { ratio: number; over: boolean } | null;
};

type WidgetStatus = "loading" | "ready" | "empty" | "error";

// 현황 줄 하나를 세우는 데 필요한 것. 연결된 서비스(link)와 야근 방을 같은 모양으로 다룬다.
type ServiceRow = {
  // summaries 통에서 요약을 찾는 키(서비스 이름)
  key: string;
  href: string;
  icon: string;
  name: string;
  tone: WidgetTone;
  // 우클릭 빠른 등록이 가능한 연결 서비스만 채워진다
  link?: LinkRow;
};

// 서비스별 아이콘 톤 (같은 파랑 반복 → 서비스마다 색 구분으로 생동감)
type WidgetTone =
  | "blue"
  | "amber"
  | "green"
  | "teal"
  | "indigo"
  | "rose"
  | "orange";

// 이번 달 게이지 띠의 한 칸. 달 단위 목표가 있는 서비스만 만든다.
type GaugeItem = {
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
type DatedItem = {
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

// 서비스 하나를 한 번 조회해서 얻는 모든 것 — 현황 줄 + 게이지 + 달력 칩
type ServiceSummary = {
  view: WidgetView;
  gauge: GaugeItem | null;
  // 달력에 날짜만 찍는 서비스(운동)가 쓰는 날짜 목록(yyyy-MM-dd).
  calendarDates: string[];
  // 제목까지 함께 보여 주는 서비스(업무·야근)가 쓰는 항목 목록.
  calendarItems?: DatedItem[];
};

type ServiceState = { status: WidgetStatus; data: ServiceSummary | null };

const DAY_FORMAT = "yyyy-MM-dd";

function formatKrw(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
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

// D-day 배지 문구
function formatDday(dateStr: string) {
  const dday = differenceInCalendarDays(parseISO(dateStr), new Date());
  if (dday === 0) return "오늘";
  if (dday > 0) return `D-${dday}`;
  return `D+${-dday}`;
}

// ── 서비스 메타: 아이콘·이름·톤·주소 (현황 줄과 게이지가 함께 쓴다) ──
const SERVICE_META: Record<
  string,
  {
    icon: string;
    name: string;
    tone: WidgetTone;
    href: (resourceRef: Record<string, unknown>) => string;
  }
> = {
  "account-book": {
    icon: "💰",
    name: "가계부",
    tone: "amber",
    // 연결된 워크스페이스가 있으면 허브를 거치지 않고 개인 가계부로 바로 이동
    href: (ref) => {
      const workspaceId = String(ref.workspaceId ?? "");
      return workspaceId
        ? `/account-book?workspaceId=${workspaceId}`
        : "/account-book";
    },
  },
  workout: { icon: "🏋️", name: "운동", tone: "blue", href: () => "/workout" },
  habit: {
    icon: "🌱",
    name: "습관",
    tone: "teal",
    href: (ref) => `/habit/${String(ref.goalId ?? "")}`,
  },
  diet: {
    icon: "🥗",
    name: "다이어트",
    tone: "green",
    href: (ref) => `/diet/${String(ref.goalId ?? "")}`,
  },
  schedule: {
    icon: "🗓️",
    name: "업무 캘린더",
    tone: "teal",
    href: (ref) => {
      const workspaceId = String(ref.workspaceId ?? "");
      return workspaceId ? `/schedule?workspaceId=${workspaceId}` : "/schedule";
    },
  },
  // 야근 계산기는 주소에 방이 없고, 열면 이 기기에 저장된 방으로 자동 연결된다.
  overtime: {
    icon: ROOM_SERVICE_META.overtime.icon,
    name: ROOM_SERVICE_META.overtime.name,
    tone: "orange",
    href: () => "/overtime",
  },
};

// ── 서비스별 로더: 조회 1회로 현황 줄 + 게이지 + 달력 칩을 함께 만든다 ──
// null을 돌려주면 "기록 없음"(empty), 던지면 그 서비스만 화면에서 빠진다(error).

// 1. 가계부: 오늘 지출(저축 제외) + 이달 예산 사용률
async function loadAccountBook(
  resourceRef: Record<string, unknown>,
): Promise<ServiceSummary | null> {
  const workspaceId = String(resourceRef.workspaceId ?? "");
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
    .filter((entry) => entry.date === today && !isSavingsCategory(entry.category))
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
  let gauge: GaugeItem | null = null;
  let progress: WidgetView["progress"] = null;
  if (budget > 0) {
    const remaining = budget - monthConsumption;
    sub =
      remaining >= 0
        ? `예산 ${formatKrw(remaining)} 남음`
        : `예산 ${formatKrw(-remaining)} 초과`;
    const ratio = monthConsumption / budget;
    progress = { ratio, over: ratio > 1 };
    gauge = {
      value: `${Math.round(ratio * 100)}%`,
      caption: "가계부",
      label: "이달 예산 사용",
      ratio,
      over: ratio > 1,
      icon: "💰",
      tone: "amber",
      href: withFromMy(SERVICE_META["account-book"].href(resourceRef)),
    };
  }

  return {
    view: {
      main:
        todayExpense > 0
          ? `오늘 지출 ${formatKrw(todayExpense)}`
          : "오늘은 아직 지출이 없어요",
      sub,
      progress,
    },
    gauge,
    calendarDates: [],
  };
}

// 2. 운동: 이번 주 운동 일수 + 이달 운동일 게이지 + 달력에 찍을 운동한 날
async function loadWorkout(
  resourceRef: Record<string, unknown>,
): Promise<ServiceSummary | null> {
  const roomId = String(resourceRef.roomId ?? "");
  if (!roomId) return null;
  const [running, gym, activity] = await Promise.all([
    fetchRunningRecords(roomId),
    fetchGymRecords(roomId),
    fetchActivityRecords(roomId),
  ]);
  if (running.length + gym.length + activity.length === 0) return null;

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
      sub = daysAgo <= 0 ? "오늘 운동했어요 💪" : `마지막 운동 ${daysAgo}일 전`;
    } else {
      sub = "이번 주 운동을 시작해봐요";
    }
  }

  // 운동한 날(중복 제거) — 달력 칩과 이달 게이지가 같은 배열을 쓴다
  const workoutDays = Array.from(
    new Set(
      [...running, ...gym, ...activity]
        .map((record) => record.date)
        .filter(Boolean),
    ),
  ).sort();

  const now = new Date();
  const monthPrefix = format(now, "yyyy-MM");
  const monthDays = workoutDays.filter((date) =>
    date.startsWith(monthPrefix),
  ).length;
  const daysInMonth = getDaysInMonth(now);

  return {
    view: { main: `이번 주 운동 ${days}일`, sub },
    gauge: {
      value: `${monthDays}일`,
      caption: "운동",
      label: `이달 ${daysInMonth}일 중`,
      ratio: monthDays / daysInMonth,
      over: false,
      icon: "🏋️",
      tone: "blue",
      href: withFromMy("/workout"),
    },
    calendarDates: workoutDays,
  };
}

// 3. 습관: 오늘 완료 항목 수 + 이달 달성률 게이지
async function loadHabit(
  resourceRef: Record<string, unknown>,
): Promise<ServiceSummary | null> {
  const goalId = String(resourceRef.goalId ?? "");
  if (!goalId) return null;
  const summary = await fetchHabitTodaySummary(goalId);
  if (!summary) return null;

  const { done, total, streak, monthDone, monthPossible } = summary;
  const sub =
    streak > 0
      ? `🔥 ${streak}일 연속 달성`
      : done >= total
        ? "오늘 목표 달성! 🎉"
        : "오늘도 하나씩 체크해요";
  const monthRatio = monthPossible > 0 ? monthDone / monthPossible : 0;

  return {
    view: {
      main: `오늘 습관 ${done}/${total} 완료`,
      sub,
      progress: total > 0 ? { ratio: done / total, over: false } : null,
    },
    gauge:
      monthPossible > 0
        ? {
            value: `${Math.round(monthRatio * 100)}%`,
            caption: "습관",
            label: "이달 달성률",
            ratio: monthRatio,
            over: false,
            icon: "🌱",
            tone: "teal",
            href: withFromMy(`/habit/${goalId}`),
          }
        : null,
    calendarDates: [],
  };
}

// 4. 다이어트: 시작 대비 감량 정도(절대 체중은 노출하지 않음). 달 단위 목표가 없어 게이지는 없다.
async function loadDiet(
  resourceRef: Record<string, unknown>,
): Promise<ServiceSummary | null> {
  const goalId = String(resourceRef.goalId ?? "");
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

  let sub: string;
  if (summary.remainingToTarget != null) {
    sub = `목표까지 -${Math.round(summary.remainingToTarget * 10) / 10}kg`;
  } else {
    const today = format(new Date(), DAY_FORMAT);
    sub = `${summary.latestDate === today ? "오늘" : summary.latestDate} 기록`;
  }

  return { view: { main, sub }, gauge: null, calendarDates: [] };
}

// 5. 업무 캘린더: 오늘 할 일 + 이번 주 완료율. 달력에는 마감일에 할 일 제목을 찍는다.
// 접근 권한은 업무 캘린더 자신의 세션(hws-session)이 판단한다 — 아직 입장 전이면 안내만 보여 준다.
type ScheduleTaskRow = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  boardId: string;
};

async function loadSchedule(
  resourceRef: Record<string, unknown>,
): Promise<ServiceSummary | null> {
  const workspaceId = String(resourceRef.workspaceId ?? "");
  if (!workspaceId) return null;

  const res = await fetch(
    `/api/schedule/summary?workspaceId=${encodeURIComponent(workspaceId)}`,
    { cache: "no-store", credentials: "same-origin" },
  );
  // 401/403 = 아직 워크스페이스에 입장하지 않음(또는 다른 워크스페이스 세션)
  if (res.status === 401 || res.status === 403) {
    return {
      view: {
        main: "입장하면 요약이 보여요",
        sub: "업무 캘린더에 들어가면 오늘 할 일이 여기 떠요",
      },
      gauge: null,
      calendarDates: [],
    };
  }
  if (!res.ok) throw new Error("schedule summary failed");

  const data = (await res.json()) as { tasks?: ScheduleTaskRow[] };
  const tasks = data.tasks ?? [];
  if (tasks.length === 0) return null;

  const now = new Date();
  const today = format(now, DAY_FORMAT);
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), DAY_FORMAT);
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), DAY_FORMAT);
  const boardHref = SERVICE_META.schedule.href(resourceRef);

  // 오늘 걸쳐 있는 미완료 할 일
  const todayOpen = tasks.filter(
    (task) =>
      !task.isCompleted && task.startDate <= today && task.endDate >= today,
  );
  // 이번 주(월~일)에 마감인 할 일
  const weekTasks = tasks.filter(
    (task) => task.endDate >= weekStart && task.endDate <= weekEnd,
  );
  const weekDone = weekTasks.filter((task) => task.isCompleted).length;
  const weekOpen = weekTasks.length - weekDone;
  const nextDue = tasks
    .filter((task) => !task.isCompleted && task.endDate >= today)
    .sort((a, b) => a.endDate.localeCompare(b.endDate))[0];

  let main: string;
  if (todayOpen.length > 0) {
    main = `오늘 할 일 ${todayOpen.length}개`;
  } else if (weekOpen > 0) {
    main = `이번 주 마감 ${weekOpen}개`;
  } else {
    main = "마감이 임박한 일이 없어요";
  }

  let sub: string | undefined;
  if (nextDue) {
    sub = `다음 마감 · ${nextDue.title} ${formatDday(nextDue.endDate)}`;
  } else if (weekTasks.length > 0) {
    sub = "이번 주 할 일을 다 끝냈어요 🎉";
  }

  const weekRatio = weekTasks.length > 0 ? weekDone / weekTasks.length : 0;

  return {
    view: {
      main,
      sub,
      progress: weekTasks.length > 0 ? { ratio: weekRatio, over: false } : null,
    },
    gauge:
      weekTasks.length > 0
        ? {
            value: `${Math.round(weekRatio * 100)}%`,
            caption: "업무",
            label: "이번 주 완료율",
            ratio: weekRatio,
            over: false,
            icon: SERVICE_META.schedule.icon,
            tone: "teal",
            href: withFromMy(boardHref),
          }
        : null,
    calendarDates: [],
    calendarItems: tasks.map((task) => ({
      id: `schedule-${task.id}`,
      date: task.endDate,
      kind: "업무",
      tone: "teal" as const,
      label: task.title,
      href: withFromMy(task.boardId ? `/schedule/${task.boardId}` : boardHref),
      // 이미 끝낸 할 일은 달력에만 남기고 "다가오는 일정"에는 올리지 않는다
      upcoming: !task.isCompleted,
    })),
  };
}

// 이 기기에서 고른 야근 계산 규칙(야근 페이지와 같은 키·같은 기본값)
function readOvertimeRuleId(): OvertimeRuleId {
  if (typeof window === "undefined") return "threshold_15h";
  return localStorage.getItem(RULE_KEY) === "from_1830"
    ? "from_1830"
    : "threshold_15h";
}

// 6. 야근 계산기: 이달 야근시간 + 보상휴가. 계산은 야근 페이지의 규칙 함수를 그대로 쓴다.
// 야근 페이지의 월간 요약과 같은 기준(그 달 기록만 넣어 계산)이라 숫자가 서로 어긋나지 않는다.
async function loadOvertime(roomRef: string): Promise<ServiceSummary | null> {
  if (!roomRef) return null;
  const { records } = await fetchOvertimeRoomData(roomRef);
  if (records.length === 0) return null;

  const now = new Date();
  const monthPrefix = format(now, "yyyy-MM");
  const monthRecords = mergeRecordsByDate(records).filter((record) =>
    record.date.startsWith(monthPrefix),
  );
  const href = withFromMy("/overtime");

  if (monthRecords.length === 0) {
    return {
      view: {
        main: "이번 달은 아직 야근이 없어요 🎉",
        sub: "지난 달 기록은 야근 계산기에서 볼 수 있어요",
      },
      gauge: null,
      calendarDates: [],
    };
  }

  const rule = OVERTIME_RULES[readOvertimeRuleId()];
  const summary = buildOvertimeSummary(monthRecords, rule);
  const totalMinutes = summary.totalRawMinutes;

  let sub: string;
  if (summary.usableDays > 0) {
    sub = `보상휴가 ${formatDayValue(summary.usableDays)} 적립`;
  } else if (summary.remainingThresholdMinutes > 0) {
    sub = `적립 시작까지 ${formatRawDuration(summary.remainingThresholdMinutes)}`;
  } else {
    sub = "조금만 더 쌓이면 0.25일이 돼요";
  }

  // 규칙에 적립 시작 기준(예: 15시간)이 있으면 그 시간을 고리의 한 바퀴로 쓴다.
  // 기준이 없는 규칙(18:30부터)은 한 바퀴를 40시간으로 두고 "누적"이라고만 적는다.
  const hasThreshold = rule.thresholdMinutes > 0;
  const gaugeMax = hasThreshold ? rule.thresholdMinutes : 40 * 60;
  const gaugeRatio = totalMinutes / gaugeMax;

  return {
    view: {
      main: `이달 야근 ${formatRawDuration(totalMinutes)}`,
      sub,
      progress: { ratio: gaugeRatio, over: false },
    },
    gauge: {
      value:
        totalMinutes >= 60
          ? `${Math.floor(totalMinutes / 60)}시간`
          : `${totalMinutes}분`,
      caption: "야근",
      label: hasThreshold
        ? `이달 ${rule.thresholdMinutes / 60}시간 중`
        : "이달 누적",
      ratio: gaugeRatio,
      over: false,
      icon: SERVICE_META.overtime.icon,
      tone: "orange",
      href,
    },
    calendarDates: [],
    calendarItems: monthRecords.map((record) => ({
      id: `overtime-${record.id}`,
      date: record.date,
      kind: "야근",
      tone: "orange" as const,
      label: formatCompactDuration(
        record.before10Minutes + record.after10Minutes,
      ),
      href,
      // 야근은 이미 지난 기록이라 "다가오는 일정"에는 올리지 않는다
      upcoming: false,
    })),
  };
}

const SERVICE_LOADERS: Record<
  string,
  (resourceRef: Record<string, unknown>) => Promise<ServiceSummary | null>
> = {
  "account-book": loadAccountBook,
  workout: loadWorkout,
  habit: loadHabit,
  diet: loadDiet,
  schedule: loadSchedule,
};

// ── 이번 달 게이지 한 칸 ──
const GAUGE_RADIUS = 34;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

function GaugeRing({ gauge }: { gauge: GaugeItem }) {
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
function WidgetShell({
  href,
  icon,
  name,
  view,
  status,
  tone = "blue",
  onContextMenu,
}: {
  href: string;
  icon: string;
  name: string;
  view: WidgetView | null;
  status: WidgetStatus;
  tone?: WidgetTone;
  onContextMenu?: (event: ReactMouseEvent<HTMLElement>) => void;
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
      </StRowBody>
      <StRowOpen>열기 →</StRowOpen>
    </StServiceRow>
  );
}

// wide: 전용 페이지(/my)에서 PC 화면을 넓게 쓰는 레이아웃 (기본은 홈용 540~600px 폭)
export default function HomeDashboard({ wide = false }: { wide?: boolean }) {
  const { user, loading } = useAuth();
  const [links, setLinks] = useState<LinkRow[] | null>(null);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [summaries, setSummaries] = useState<Record<string, ServiceState>>({});
  const [guideOpen, setGuideOpen] = useState(false);
  // 달력이 보고 있는 달(항상 그 달 1일)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  // 우클릭 컨텍스트 메뉴(빠른 등록) 상태
  const [quickMenu, setQuickMenu] = useState<{
    x: number;
    y: number;
    link: LinkRow;
  } | null>(null);
  const [quickModal, setQuickModal] = useState<LinkRow | null>(null);
  // 빠른 등록 후 요약을 다시 불러오기 위한 키
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
    event: ReactMouseEvent<HTMLElement>,
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
        // 약속방·테니스방은 날짜를 함께 로드해 행·달력에 표시 (각각 조회 1번)
        const meetingIds = loaded
          .filter((room) => room.service === "meeting")
          .map((room) => room.roomId);
        const tennisIds = loaded
          .filter((room) => room.service === "tennis")
          .map((room) => room.roomId);
        const [names, confirmedDates, tennisDates] = await Promise.all([
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
          tennisIds.length > 0
            ? fetchTennisEventDates(tennisIds).catch(
                () => ({}) as Record<string, { date: string; title: string }>,
              )
            : Promise.resolve(
                {} as Record<string, { date: string; title: string }>,
              ),
        ]);
        if (
          active &&
          (Object.keys(names).length > 0 ||
            Object.keys(confirmedDates).length > 0 ||
            Object.keys(tennisDates).length > 0)
        ) {
          setRooms((prev) =>
            prev.map((room) => ({
              ...room,
              label:
                names[room.roomId] ||
                (room.service === "tennis"
                  ? tennisDates[room.roomId]?.title || room.label
                  : room.label),
              confirmedDate:
                room.service === "meeting"
                  ? confirmedDates[room.roomId]
                  : undefined,
              eventDate:
                room.service === "tennis"
                  ? tennisDates[room.roomId]?.date
                  : undefined,
            })),
          );
        }
      } catch {
        // 방 로드 실패 시 빈 목록 — 달력·내 방만 생략
        if (active) setRooms([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  // 연결된 서비스별 요약을 서비스당 한 번씩만 불러온다.
  // (links는 마운트 후 한 번만 바뀌고, refreshKey는 빠른 등록 후에만 오른다)
  useEffect(() => {
    if (!links) return;
    let active = true;
    links.forEach((link) => {
      const loader = SERVICE_LOADERS[link.service];
      if (!loader) return;
      void (async () => {
        try {
          const result = await loader(link.resourceRef);
          if (!active) return;
          setSummaries((prev) => ({
            ...prev,
            [link.service]: result
              ? { status: "ready", data: result }
              : { status: "empty", data: null },
          }));
        } catch {
          if (active) {
            setSummaries((prev) => ({
              ...prev,
              [link.service]: { status: "error", data: null },
            }));
          }
        }
      })();
    });
    return () => {
      active = false;
    };
  }, [links, refreshKey]);

  const supportedLinks = useMemo(
    () => (links ?? []).filter((link) => link.service in SERVICE_LOADERS),
    [links],
  );

  // 야근 계산기는 연결이 아니라 "내 방"이라 방 목록에서 찾는다.
  // 방이 여럿이면 가장 최근에 등록한 것 하나만 요약한다(조회도 그만큼만 돈다).
  const overtimeRoomId = useMemo(() => {
    const list = rooms.filter((room) => room.service === "overtime");
    if (list.length === 0) return null;
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      .roomId;
  }, [rooms]);

  // 야근 방 요약도 links와 같은 summaries 통에 담아, 게이지·달력·현황이 똑같이 꺼내 쓰게 한다.
  // (방 이름이 나중에 채워져도 roomId는 그대로라 조회는 방당 한 번만 돈다)
  useEffect(() => {
    if (!overtimeRoomId) return;
    let active = true;
    void (async () => {
      try {
        const result = await loadOvertime(overtimeRoomId);
        if (!active) return;
        setSummaries((prev) => ({
          ...prev,
          overtime: result
            ? { status: "ready", data: result }
            : { status: "empty", data: null },
        }));
      } catch {
        if (active) {
          setSummaries((prev) => ({
            ...prev,
            overtime: { status: "error", data: null },
          }));
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [overtimeRoomId, refreshKey]);

  // 현황 줄 목록: 연결된 서비스 + (있으면) 야근 방
  const serviceRows = useMemo<ServiceRow[]>(() => {
    const rows: ServiceRow[] = supportedLinks.map((link) => {
      const meta = SERVICE_META[link.service];
      return {
        key: link.service,
        href: withFromMy(meta.href(link.resourceRef)),
        icon: meta.icon,
        name: meta.name,
        tone: meta.tone,
        link,
      };
    });
    if (overtimeRoomId) {
      const meta = SERVICE_META.overtime;
      rows.push({
        key: "overtime",
        href: withFromMy(meta.href({})),
        icon: meta.icon,
        name: meta.name,
        tone: meta.tone,
      });
    }
    return rows;
  }, [supportedLinks, overtimeRoomId]);

  // 게이지 띠: 달 단위 목표가 있는 서비스만, 최대 6칸(넘치면 아래 줄로 접힌다)
  const gauges = useMemo(
    () =>
      serviceRows
        .map((row) => summaries[row.key]?.data?.gauge)
        .filter((gauge): gauge is GaugeItem => Boolean(gauge))
        .slice(0, 6),
    [serviceRows, summaries],
  );

  // 게이지가 될 수 있는 서비스가 아직 로딩 중이면 자리만 잡아 둔다(화면 튐 방지)
  const gaugePending = serviceRows.filter(
    (row) =>
      row.key !== "diet" && (summaries[row.key]?.status ?? "loading") === "loading",
  ).length;

  // 날짜가 있는 방(약속·테니스) — 달력 칩과 다가오는 일정이 함께 쓴다
  const datedRooms = useMemo<DatedItem[]>(
    () =>
      rooms
        .map((room): DatedItem | null => {
          const date =
            room.service === "meeting"
              ? room.confirmedDate
              : room.service === "tennis"
                ? room.eventDate
                : undefined;
          if (!date) return null;
          const meta = ROOM_SERVICE_META[room.service];
          return {
            id: room.id,
            date,
            kind: room.service === "meeting" ? "약속" : "테니스",
            tone: room.service === "meeting" ? "indigo" : "green",
            label: room.label || meta.name,
            href: withFromMy(meta.href(room.roomId)),
            upcoming: true,
          };
        })
        .filter((item): item is DatedItem => item !== null),
    [rooms],
  );

  // 서비스 요약이 만들어 준 날짜 항목(업무 할 일 마감일·야근 기록일)
  const serviceDatedItems = useMemo<DatedItem[]>(() => {
    const items: DatedItem[] = [];
    for (const state of Object.values(summaries)) {
      if (state.data?.calendarItems) items.push(...state.data.calendarItems);
    }
    return items;
  }, [summaries]);

  // 달력·다가오는 일정이 함께 보는 하나의 목록
  const datedItems = useMemo<DatedItem[]>(
    () =>
      [...datedRooms, ...serviceDatedItems].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    [datedRooms, serviceDatedItems],
  );

  // 운동한 날 목록 — 매 렌더마다 새 배열이 되지 않게 고정해 둔다(달력 useMemo가 헛돌지 않도록)
  const workoutDates = useMemo(
    () => summaries.workout?.data?.calendarDates ?? [],
    [summaries],
  );

  const monthPrefix = format(calendarMonth, "yyyy-MM");

  const calendarEvents = useMemo<MonthCalendarEvent[]>(() => {
    const events: MonthCalendarEvent[] = datedItems
      .filter((item) => item.date.startsWith(monthPrefix))
      .map((item) => ({
        date: item.date,
        label: `${item.kind} · ${item.label}`,
        tone: item.tone,
        href: item.href,
      }));
    workoutDates
      .filter((date) => date.startsWith(monthPrefix))
      .forEach((date) => {
        events.push({
          date,
          label: "운동",
          tone: "blue",
          href: withFromMy("/workout"),
        });
      });
    return events;
  }, [datedItems, workoutDates, monthPrefix]);

  // 다가오는 일정: 오늘 이후로 가장 가까운 3건 (지난 기록인 야근은 빠진다)
  const upcoming = useMemo(() => {
    const today = format(new Date(), DAY_FORMAT);
    return datedItems
      .filter((item) => item.upcoming && item.date >= today)
      .slice(0, 3);
  }, [datedItems]);

  const hasCalendarSource =
    datedItems.length > 0 ||
    rooms.some(
      (room) =>
        room.service === "meeting" ||
        room.service === "tennis" ||
        room.service === "overtime",
    ) ||
    supportedLinks.some(
      (link) => link.service === "workout" || link.service === "schedule",
    );

  const monthWorkoutDays = workoutDates.filter((date) =>
    date.startsWith(monthPrefix),
  ).length;
  // 이번 달 칩 = 일정(약속·테니스·업무) + 야근 기록일 + 운동한 날
  const monthItems = datedItems.filter((item) =>
    item.date.startsWith(monthPrefix),
  );
  const monthOvertimeDays = monthItems.filter(
    (item) => item.kind === "야근",
  ).length;
  const monthPlanCount = monthItems.length - monthOvertimeDays;
  const hasScheduleItems = datedItems.some((item) => item.kind === "업무");
  const hasOvertimeItems = datedItems.some((item) => item.kind === "야근");

  // 인증 확인 중에도 자리를 잡아 두어, 요약이 도착할 때 화면이 튀지 않게 한다.
  if (loading) {
    return (
      <StSection $wide={wide}>
        <StBoard>
          <StBoardHead>
            <SkeletonBlock width="7rem" height="0.95rem" radius="0.5rem" />
          </StBoardHead>
          <SkeletonCard height="12rem" lines={2} />
        </StBoard>
        <StBoard>
          <StBoardHead>
            <SkeletonBlock width="6rem" height="0.95rem" radius="0.5rem" />
          </StBoardHead>
          <SkeletonCard height="7rem" lines={2} />
        </StBoard>
      </StSection>
    );
  }

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
          <SkeletonCard height="12rem" lines={3} />
        </StBoard>
      </StSection>
    );
  }

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

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const basisLine = `기준 ${format(now, "M월 d일 (EEE)", { locale: ko })} · 이번 주 ${format(
    weekStart,
    "M/d",
  )}~${format(weekEnd, "M/d")}`;

  return (
    <StSection $wide={wide}>
      {/* ① 이번 달 게이지 띠 — 달 단위 목표가 있는 서비스만 */}
      {gauges.length > 0 || gaugePending > 0 ? (
        <StBoard>
          <StBoardHead>
            <StBoardTitleWrap>
              <StBoardTitle>🎯 이번 달</StBoardTitle>
            </StBoardTitleWrap>
            <StBoardNote>{format(now, "yyyy년 M월", { locale: ko })}</StBoardNote>
          </StBoardHead>
          <StGaugeStrip>
            {gauges.length > 0
              ? gauges.map((gauge) => (
                  <GaugeRing key={gauge.caption} gauge={gauge} />
                ))
              : Array.from({ length: Math.min(gaugePending, 6) }, (_, index) => (
                  <StGaugeSkeleton key={index}>
                    <SkeletonBlock width="5rem" height="5rem" radius="999px" />
                    <SkeletonBlock width="3.2rem" height="0.8rem" radius="0.4rem" />
                  </StGaugeSkeleton>
                ))}
          </StGaugeStrip>
        </StBoard>
      ) : null}

      {/* ② 이번 달 달력 + 다가오는 일정 */}
      {hasCalendarSource ? (
        <StBoard>
          <StBoardHead>
            <StBoardTitleWrap>
              <StBoardTitle>🗓️ 이번 달 달력</StBoardTitle>
            </StBoardTitleWrap>
            <StBoardNote>이번 달 일정·기록을 한곳에 모았어요</StBoardNote>
          </StBoardHead>
          <StCalendarLayout>
            <StCalendarPane>
              <MonthCalendar
                month={calendarMonth}
                events={calendarEvents}
                onMonthChange={setCalendarMonth}
                summary={
                  <StCalSummaryRow>
                    <StCalSummaryItem>
                      <b>{monthPlanCount}</b>건 일정
                    </StCalSummaryItem>
                    {workoutDates.length > 0 ? (
                      <StCalSummaryItem>
                        <b>{monthWorkoutDays}</b>일 운동
                      </StCalSummaryItem>
                    ) : null}
                    {hasOvertimeItems ? (
                      <StCalSummaryItem>
                        <b>{monthOvertimeDays}</b>일 야근
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
                    {workoutDates.length > 0 ? (
                      <StLegendItem $tone="blue">
                        <StLegendDot $tone="blue" />
                        운동
                      </StLegendItem>
                    ) : null}
                    {hasScheduleItems ? (
                      <StLegendItem $tone="teal">
                        <StLegendDot $tone="teal" />
                        업무
                      </StLegendItem>
                    ) : null}
                    {hasOvertimeItems ? (
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
                  아직 잡힌 약속이 없어요. 약속방에서 날짜를 확정하면 여기에
                  떠요.
                </StUpcomingEmpty>
              )}
            </StUpcomingPane>
          </StCalendarLayout>
        </StBoard>
      ) : null}

      {/* ③ 서비스 현황 — 한 줄에 하나씩 넓게 */}
      {serviceRows.length > 0 ? (
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
                        <li>
                          연결한 서비스의 오늘·이번 주 요약을 한눈에 볼 수 있어요.
                        </li>
                        <li>줄을 누르면 해당 서비스로 바로 이동해요.</li>
                        <li>
                          ‘연결 관리’에서 서비스를 계정에 연결하거나 해제할 수
                          있어요.
                        </li>
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
          <StBoardNote>{basisLine}</StBoardNote>
          <StServiceList>
            {serviceRows.map((row) => {
              const state = summaries[row.key] ?? {
                status: "loading" as WidgetStatus,
                data: null,
              };
              if (state.status === "error") return null;
              const link = row.link;
              return (
                <WidgetShell
                  key={row.key}
                  href={row.href}
                  icon={row.icon}
                  name={row.name}
                  tone={row.tone}
                  view={state.data?.view ?? null}
                  status={state.status}
                  onContextMenu={
                    link ? (event) => openQuickMenu(event, link) : undefined
                  }
                />
              );
            })}
          </StServiceList>
        </StBoard>
      ) : null}

      {/* ④ 내 방 */}
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

// ── 톤 팔레트 (아이콘 배지·게이지·범례가 함께 쓴다) ──
const toneBg = (tone: WidgetTone) => (theme: { colors: Record<string, string> }) =>
  ({
    blue: theme.colors.blue50,
    amber: theme.colors.amber50,
    green: theme.colors.green50,
    teal: theme.colors.teal50,
    indigo: theme.colors.indigo50,
    rose: theme.colors.rose50,
    orange: theme.colors.orange50,
  })[tone];

const toneFg = (tone: WidgetTone) => (theme: { colors: Record<string, string> }) =>
  ({
    blue: theme.colors.blue600,
    amber: theme.colors.amber600,
    green: theme.colors.green600,
    teal: theme.colors.teal600,
    indigo: theme.colors.indigo600,
    rose: theme.colors.rose600,
    orange: theme.colors.orange600,
  })[tone];

const StSection = styled.section<{ $wide?: boolean }>`
  width: 100%;
  max-width: ${({ $wide }) => ($wide ? "100%" : "600px")};
  margin-bottom: 3rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

// 대시보드 스타일: 회색 배경 위에 섹션 라벨 + 흰 판 (홈 메뉴와 같은 결)
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
  white-space: nowrap;
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray700};
`;

// 섹션 제목 아래(또는 옆)의 작은 설명 한 줄
const StBoardNote = styled.p`
  padding: 0 0.25rem;
  font-size: 0.76rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray400};
  text-align: right;

  @media ${({ theme }) => theme.media.mobile} {
    text-align: left;
  }
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

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.primary};
    outline-offset: 2px;
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

// ── ① 이번 달 게이지 띠 ──
const StGaugeStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;

  /* 칸이 늘어나도 한 줄에 욱여넣지 않고, 좁아지면 아랫줄로 접힌다 */
  @media (min-width: 640px) {
    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
    gap: 0.85rem;
  }
`;

const StGauge = styled(Link)`
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

const StGaugeSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.6rem 0.9rem;
  border-radius: 1.25rem;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
`;

const StGaugeRingWrap = styled.div`
  position: relative;
  width: 5rem;
  height: 5rem;
`;

const StGaugeSvg = styled.svg`
  width: 100%;
  height: 100%;
  display: block;
`;

const StGaugeTrack = styled.circle`
  fill: none;
  stroke: ${({ theme }) => theme.colors.gray100};
  stroke-width: 8;
`;

const StGaugeFill = styled.circle<{ $tone: WidgetTone; $over: boolean }>`
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

const StGaugeValue = styled.strong<{ $over: boolean }>`
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
const StGaugeText = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  min-width: 0;

  @media (min-width: 640px) {
    align-items: flex-start;
  }
`;

const StGaugeCaption = styled.span`
  margin-top: 0.2rem;
  font-size: 0.88rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};

  @media (min-width: 640px) {
    margin-top: 0;
  }
`;

const StGaugeLabel = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray400};
  text-align: center;

  @media (min-width: 640px) {
    text-align: left;
  }
`;

// ── ② 달력 + 다가오는 일정 ──
const StCalendarLayout = styled.div`
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

const StCalendarPane = styled.div`
  min-width: 0;
`;

const StCalSummaryRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem 1.2rem;
`;

const StCalSummaryItem = styled.span`
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

const StLegendItem = styled.span<{ $tone: WidgetTone }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray600};
`;

const StLegendDot = styled.span<{ $tone: WidgetTone }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $tone, theme }) => toneFg($tone)(theme)};
`;

const StUpcomingPane = styled.div`
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

const StUpcomingTitle = styled.p`
  font-size: 0.8rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray700};
`;

const StUpcomingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const StUpcomingRow = styled(Link)`
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

const StUpcomingDday = styled.span<{ $tone: WidgetTone }>`
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

const StUpcomingBody = styled.div`
  min-width: 0;
`;

const StUpcomingLabel = styled.p`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StUpcomingDate = styled.p`
  margin-top: 0.1rem;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StUpcomingEmpty = styled.p`
  font-size: 0.78rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.gray400};
`;

// ── ③ 서비스 현황: 카드 대신 구분선으로 나눈 넓은 줄 ──
const StServiceList = styled.div`
  width: 100%;
  border-radius: 1.25rem;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const StWidgetIcon = styled.div<{ $tone: WidgetTone }>`
  width: 2.6rem;
  height: 2.6rem;
  background-color: ${({ $tone, theme }) => toneBg($tone)(theme)};
  color: ${({ $tone, theme }) => toneFg($tone)(theme)};
  border-radius: 0.8rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.35rem;
  transition: transform 0.2s;
  flex-shrink: 0;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const StRowHead = styled.div`
  grid-area: head;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
`;

const StRowName = styled.span`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};
  white-space: nowrap;
`;

const StRowBody = styled.div`
  grid-area: main;
  min-width: 0;
`;

const StRowValue = styled.strong<{ $muted?: boolean }>`
  display: block;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.3;
  color: ${({ $muted, theme }) =>
    $muted ? theme.colors.gray400 : theme.colors.gray900};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StRowSub = styled.p`
  margin-top: 0.2rem;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.gray400};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StRowBar = styled.div`
  margin-top: 0.45rem;
  max-width: 18rem;
  height: 0.4rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.gray100};
  overflow: hidden;
`;

const StRowFill = styled.div<{ $tone: WidgetTone; $over?: boolean }>`
  height: 100%;
  border-radius: inherit;
  background: ${({ $tone, $over, theme }) =>
    $over ? theme.colors.rose600 : toneFg($tone)(theme)};
  transition: width 0.2s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const StRowOpen = styled.span`
  grid-area: open;
  align-self: center;
  flex-shrink: 0;
  font-size: 0.8rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.primary};
  white-space: nowrap;
`;

const StServiceRow = styled(Link)`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    "head open"
    "main main";
  align-items: center;
  gap: 0.5rem 0.9rem;
  padding: 1rem 1.1rem;
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
    grid-template-columns: 11rem minmax(0, 1fr) auto;
    grid-template-areas: "head main open";
    gap: 0.9rem 1.2rem;
    padding: 1.15rem 1.3rem;
  }
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

  @media (prefers-reduced-motion: reduce) {
    transition: none;
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

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.primary};
    outline-offset: 2px;
  }
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
