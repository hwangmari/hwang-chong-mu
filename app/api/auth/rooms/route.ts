// 통합 계정의 "내 방": 약속·정산·장소·테니스·게임·야근·일일기록처럼 여러 개일 수 있는 방을 계정에 등록.
// room_id에는 주소에 드러나는 공개 식별자만 담는다(방 비밀번호·접근 코드는 저장하지 않는다).
// 예외: 야근 계산기의 방 코드(roomRef)는 주소이자 열쇠라 저장하면 곧 입장 권한이 된다. 이 표는 세션 쿠키 뒤에 있어
// 본인만 읽을 수 있으므로 허용하되, 야근 방을 다른 사람과 공유할 때는 코드가 곧 비밀번호임을 사용자에게 안내한다.
// user_id는 항상 세션 쿠키에서 확정한다(클라 위조 불가).
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { readAppSession } from "@/lib/auth/session";
import { ROOM_SERVICES } from "@/lib/roomServices";

// 허용 서비스는 lib/roomServices.ts 한곳에서 관리한다(SQL의 체크 제약과 같은 목록).
const SERVICES: readonly string[] = ROOM_SERVICES;

export async function GET() {
  const session = await readAppSession();
  if (!session) return NextResponse.json({ rooms: [] });
  const { data, error } = await supabase.rpc("hwang_rooms_list", {
    p_user_id: session.userId,
  });
  if (error) {
    console.error("[auth/rooms GET]", error);
    return NextResponse.json({ rooms: [] }, { status: 500 });
  }
  return NextResponse.json({ rooms: data ?? [] });
}

export async function POST(req: Request) {
  const session = await readAppSession();
  if (!session)
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const service = typeof body?.service === "string" ? body.service : "";
  if (!SERVICES.includes(service)) {
    return NextResponse.json(
      { error: "알 수 없는 서비스입니다." },
      { status: 400 },
    );
  }
  const roomId = typeof body?.roomId === "string" ? body.roomId : "";
  const label = typeof body?.label === "string" ? body.label : "";
  const { data, error } = await supabase.rpc("hwang_rooms_add", {
    p_user_id: session.userId,
    p_service: service,
    p_room_id: roomId,
    p_label: label,
  });
  if (error) {
    console.error("[auth/rooms POST]", error);
    return NextResponse.json({ error: "등록에 실패했어요." }, { status: 500 });
  }
  return NextResponse.json({ rooms: data ?? [] });
}

export async function DELETE(req: Request) {
  const session = await readAppSession();
  if (!session)
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const service = searchParams.get("service") || "";
  if (!SERVICES.includes(service)) {
    return NextResponse.json(
      { error: "알 수 없는 서비스입니다." },
      { status: 400 },
    );
  }
  const roomId = searchParams.get("roomId") || "";
  const { data, error } = await supabase.rpc("hwang_rooms_delete", {
    p_user_id: session.userId,
    p_service: service,
    p_room_id: roomId,
  });
  if (error) {
    console.error("[auth/rooms DELETE]", error);
    return NextResponse.json({ error: "해제에 실패했어요." }, { status: 500 });
  }
  return NextResponse.json({ rooms: data ?? [] });
}
