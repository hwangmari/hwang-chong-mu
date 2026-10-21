// 운동방(tennis_lessons)에 적어 둔 예전 레슨 일지를 내 계정으로 옮긴다.
// 이미 옮긴 줄은 건너뛰므로 여러 번 눌러도 안전하다 (tennis_lesson_import_room).
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { readAppSession } from "@/lib/auth/session";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const session = await readAppSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const roomId = typeof body?.roomId === "string" ? body.roomId : "";
  if (!UUID_RE.test(roomId)) {
    return NextResponse.json({ error: "운동방을 확인해 주세요." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("tennis_lesson_import_room", {
    p_user_id: session.userId,
    p_room_id: roomId,
  });
  if (error) {
    console.error("[lesson import POST]", error);
    return NextResponse.json({ error: "옮기지 못했어요." }, { status: 500 });
  }
  return NextResponse.json({ count: typeof data === "number" ? data : 0 });
}
