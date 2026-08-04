// 통합 계정의 "내 방": 약속(meeting)·정산(calc)처럼 여러 개일 수 있는 방을 계정에 등록.
// user_id는 항상 세션 쿠키에서 확정한다(클라 위조 불가).
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { readAppSession } from "@/lib/auth/session";

const SERVICES = ["meeting", "calc"];

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
