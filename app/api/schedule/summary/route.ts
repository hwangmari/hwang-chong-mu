// GET /api/schedule/summary?workspaceId=... — 홈 대시보드(/my)용 할 일 요약.
// 접근 권한은 기존 라우트와 똑같이 hws-session 쿠키로만 판단한다(새 접근 경로를 만들지 않는다).
// 세션이 없거나 다른 워크스페이스면 401/403 — 대시보드는 그때 수치 대신 안내만 보여 준다.

import { NextResponse } from "next/server";
import { getScheduleAdminClient } from "@/lib/schedule-admin";
import {
  assertWorkspaceMatch,
  requireScheduleSession,
} from "@/lib/schedule-route-guard";

// 대시보드는 이번 달 앞뒤만 보므로 과거 90일보다 오래된 할 일은 가져오지 않는다.
const PAST_WINDOW_DAYS = 90;
const TASK_LIMIT = 500;

function isoDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId 쿼리 파라미터가 필요합니다." },
      { status: 400 },
    );
  }

  const guard = await requireScheduleSession();
  if (!guard.ok) return guard.response;
  const mismatch = assertWorkspaceMatch(guard.session, workspaceId);
  if (mismatch) return mismatch;

  const admin = getScheduleAdminClient();

  // 1) 이 워크스페이스의 서비스(보드)
  const { data: boards, error: boardError } = await admin
    .from("schedule_boards")
    .select("id, title")
    .eq("workspace_id", workspaceId);
  if (boardError) {
    console.error("[schedule/summary/boards]", boardError);
    return NextResponse.json(
      { error: "요약 조회에 실패했습니다." },
      { status: 500 },
    );
  }

  const boardRows = (boards ?? []) as { id: string; title: string }[];
  if (boardRows.length === 0) {
    return NextResponse.json({ tasks: [] });
  }
  const boardTitles = new Map(boardRows.map((row) => [row.id, row.title]));

  // 2) 보드에 속한 단계(페이즈). 숨긴 단계는 화면에서도 안 보이므로 요약에서도 뺀다.
  const { data: phases, error: phaseError } = await admin
    .from("schedule_services")
    .select("id, board_id, is_hidden")
    .in("board_id", [...boardTitles.keys()]);
  if (phaseError) {
    console.error("[schedule/summary/phases]", phaseError);
    return NextResponse.json(
      { error: "요약 조회에 실패했습니다." },
      { status: 500 },
    );
  }

  const phaseRows = ((phases ?? []) as {
    id: string;
    board_id: string;
    is_hidden: boolean | null;
  }[]).filter((row) => !row.is_hidden);
  if (phaseRows.length === 0) {
    return NextResponse.json({ tasks: [] });
  }
  const phaseBoard = new Map(phaseRows.map((row) => [row.id, row.board_id]));

  // 3) 할 일 — 마감일 기준 최근 것만
  const { data: tasks, error: taskError } = await admin
    .from("schedule_tasks")
    .select("id, title, start_date, end_date, is_completed, service_id")
    .in("service_id", [...phaseBoard.keys()])
    .gte("end_date", isoDaysAgo(PAST_WINDOW_DAYS))
    .order("end_date", { ascending: true })
    .limit(TASK_LIMIT);
  if (taskError) {
    console.error("[schedule/summary/tasks]", taskError);
    return NextResponse.json(
      { error: "요약 조회에 실패했습니다." },
      { status: 500 },
    );
  }

  const taskRows = (tasks ?? []) as {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    is_completed: boolean | null;
    service_id: string;
  }[];

  return NextResponse.json({
    tasks: taskRows.map((task) => {
      const boardId = phaseBoard.get(task.service_id) ?? "";
      return {
        id: task.id,
        title: task.title,
        startDate: task.start_date,
        endDate: task.end_date,
        isCompleted: task.is_completed ?? false,
        boardId,
        boardTitle: boardTitles.get(boardId) ?? "",
      };
    }),
  });
}
