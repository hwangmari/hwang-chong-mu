// 서버 라우트 공통 가드: 세션 쿠키 검증 + 워크스페이스 일치 여부 + role 반환.
// 각 라우트에서 await requireScheduleSession()로 호출하면 검증된 payload 또는 401/403 응답이 나온다.

import { NextResponse } from "next/server";
import {
  readScheduleSession,
  type ScheduleSessionPayload,
} from "./schedule-session";

type GuardResult =
  | { ok: true; session: ScheduleSessionPayload }
  | { ok: false; response: NextResponse };

export async function requireScheduleSession(): Promise<GuardResult> {
  const session = await readScheduleSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "세션이 없습니다. 다시 입장해 주세요." },
        { status: 401 },
      ),
    };
  }
  return { ok: true, session };
}

export function assertWorkspaceMatch(
  session: ScheduleSessionPayload,
  workspaceId: string,
): NextResponse | null {
  if (session.workspaceId !== workspaceId) {
    return NextResponse.json(
      { error: "현재 세션의 워크스페이스와 일치하지 않습니다." },
      { status: 403 },
    );
  }
  return null;
}

export function assertOwner(
  session: ScheduleSessionPayload,
): NextResponse | null {
  if (session.role !== "owner") {
    return NextResponse.json(
      { error: "소유자만 수행할 수 있는 작업입니다." },
      { status: 403 },
    );
  }
  return null;
}

// 서비스(board) → 워크스페이스 체크 + 수정 권한(owner OR 본인 소유 서비스)
export type ServiceContext = {
  id: string;
  workspaceId: string;
  memberId: string | null;
};

export function assertServiceMutation(
  session: ScheduleSessionPayload,
  service: ServiceContext,
): NextResponse | null {
  if (service.workspaceId !== session.workspaceId) {
    return NextResponse.json(
      { error: "다른 워크스페이스의 서비스입니다." },
      { status: 403 },
    );
  }
  if (session.role !== "owner" && service.memberId !== session.userId) {
    return NextResponse.json(
      { error: "수정 권한이 없습니다." },
      { status: 403 },
    );
  }
  return null;
}
