// 경조사비 장부: 통합 계정 소유 데이터.
// user_id는 항상 세션 쿠키에서 확정한다(클라 위조 불가).
// 표는 anon에서 잠겨 있고 gift_log_* SECURITY DEFINER 함수로만 접근한다.
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { readAppSession } from "@/lib/auth/session";

const EVENT_TYPES = ["wedding", "funeral", "firstBirthday", "birthday", "etc"];
const DIRECTIONS = ["given", "received"];
const RELATIONS = ["company", "friend", "relative", "school", "neighbor", "etc"];

const UNAUTHORIZED = { error: "로그인이 필요해요." };

export async function GET() {
  const session = await readAppSession();
  if (!session) return NextResponse.json({ entries: [] });

  const { data, error } = await supabase.rpc("gift_log_list", {
    p_user_id: session.userId,
  });
  if (error) {
    console.error("[gift-log GET]", error);
    return NextResponse.json({ entries: [] }, { status: 500 });
  }
  return NextResponse.json({ entries: data ?? [] });
}

export async function POST(req: Request) {
  const session = await readAppSession();
  if (!session) return NextResponse.json(UNAUTHORIZED, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" && body.id ? body.id : null;
  const date = typeof body?.date === "string" ? body.date : "";
  const eventType = typeof body?.eventType === "string" ? body.eventType : "";
  const direction = typeof body?.direction === "string" ? body.direction : "";
  const relation = typeof body?.relation === "string" ? body.relation : "etc";
  const relationDetail =
    typeof body?.relationDetail === "string"
      ? body.relationDetail.trim().slice(0, 40)
      : "";
  const personName =
    typeof body?.personName === "string" ? body.personName.trim() : "";
  const amount = Number(body?.amount);
  const memo = typeof body?.memo === "string" ? body.memo : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "날짜를 확인해 주세요." }, { status: 400 });
  }
  if (!EVENT_TYPES.includes(eventType) || !DIRECTIONS.includes(direction)) {
    return NextResponse.json({ error: "알 수 없는 항목입니다." }, { status: 400 });
  }
  if (!RELATIONS.includes(relation)) {
    return NextResponse.json({ error: "알 수 없는 관계입니다." }, { status: 400 });
  }
  if (!personName) {
    return NextResponse.json(
      { error: "상대방 이름을 입력해 주세요." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "금액을 0보다 크게 입력해 주세요." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.rpc("gift_log_upsert", {
    p_user_id: session.userId,
    p_id: id,
    p_date: date,
    p_event_type: eventType,
    p_direction: direction,
    p_person_name: personName,
    p_relation: relation,
    p_relation_detail: relationDetail,
    p_amount: Math.round(amount),
    p_memo: memo,
  });
  if (error) {
    console.error("[gift-log POST]", error);
    return NextResponse.json({ error: "저장에 실패했어요." }, { status: 500 });
  }
  return NextResponse.json({ entries: data ?? [] });
}

// PATCH { ids: string[], returned: boolean } → "냈음" 표시만 바꾼다
export async function PATCH(req: Request) {
  const session = await readAppSession();
  if (!session) return NextResponse.json(UNAUTHORIZED, { status: 401 });

  const body = await req.json().catch(() => null);
  const ids = Array.isArray(body?.ids)
    ? body.ids.filter((v: unknown): v is string => typeof v === "string" && v.length > 0)
    : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "대상 기록이 없어요." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("gift_log_set_returned", {
    p_user_id: session.userId,
    p_ids: ids,
    p_returned: body?.returned === true,
  });
  if (error) {
    console.error("[gift-log PATCH]", error);
    return NextResponse.json({ error: "표시를 바꾸지 못했어요." }, { status: 500 });
  }
  return NextResponse.json({ entries: data ?? [] });
}

export async function DELETE(req: Request) {
  const session = await readAppSession();
  if (!session) return NextResponse.json(UNAUTHORIZED, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  if (!id) {
    return NextResponse.json({ error: "삭제할 기록이 없어요." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("gift_log_delete", {
    p_user_id: session.userId,
    p_id: id,
  });
  if (error) {
    console.error("[gift-log DELETE]", error);
    return NextResponse.json({ error: "삭제에 실패했어요." }, { status: 500 });
  }
  return NextResponse.json({ entries: data ?? [] });
}
