// 테니스 레슨 일지: 통합 계정 소유 데이터 (경조사비 장부와 같은 방식).
// user_id는 항상 세션 쿠키에서 확정한다(클라 위조 불가).
// 표는 anon에서 잠겨 있고 tennis_lesson_* SECURITY DEFINER 함수로만 접근한다.
// (supabase/20261016_tennis_lessons_by_account.sql)
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { readAppSession } from "@/lib/auth/session";

const UNAUTHORIZED = { error: "로그인이 필요해요." };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Part = { name: string; minutes: number };
type Tip = { topic: string; points: string[] };

/** uuid 모양이면 그대로, 비었으면 null, 이상하면 undefined(잘못된 값) */
function uuidOrNull(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "string" && UUID_RE.test(value) ? value : undefined;
}

function parseParts(value: unknown): Part[] | null {
  if (!Array.isArray(value) || value.length > 10) return null;
  const parts: Part[] = [];
  for (const p of value) {
    const name = typeof p?.name === "string" ? p.name.trim() : null;
    const minutes = p?.minutes;
    if (name === null || name.length > 20) return null;
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 600) return null;
    parts.push({ name, minutes });
  }
  return parts;
}

function parseTips(value: unknown): Tip[] | null {
  if (!Array.isArray(value)) return null;
  const tips: Tip[] = [];
  for (const t of value) {
    const topic = typeof t?.topic === "string" ? t.topic.trim() : "";
    if (!topic || !Array.isArray(t.points)) return null;
    const points: string[] = [];
    for (const p of t.points) {
      if (typeof p !== "string" || !p.trim()) return null;
      points.push(p.trim());
    }
    if (points.length === 0) return null;
    tips.push({ topic, points });
  }
  return tips;
}

export async function GET() {
  const session = await readAppSession();
  if (!session) return NextResponse.json({ lessons: [] });

  const { data, error } = await supabase.rpc("tennis_lesson_list", {
    p_user_id: session.userId,
  });
  if (error) {
    console.error("[lesson GET]", error);
    // 표·함수가 아직 없을 때 화면이 어떤 SQL을 실행하라고 안내할 수 있게 이름을 담아 보낸다
    return NextResponse.json(
      { lessons: [], error: "일지를 불러오지 못했어요.", missing: /tennis_lesson/.test(error.message) },
      { status: 500 },
    );
  }
  return NextResponse.json({ lessons: data ?? [] });
}

export async function POST(req: Request) {
  const session = await readAppSession();
  if (!session) return NextResponse.json(UNAUTHORIZED, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = uuidOrNull(body?.id);
  const activityId = uuidOrNull(body?.activityId);
  const date = typeof body?.date === "string" ? body.date : "";
  const parts = parseParts(body?.parts);
  const raw = typeof body?.raw === "string" ? body.raw : null;
  const tips = body?.tips === undefined || body?.tips === null ? null : parseTips(body.tips);

  // 모양(YYYY-MM-DD)뿐 아니라 실제로 있는 날짜인지도 본다 (2026-13-45 같은 값은 400)
  const parsed = new Date(`${date}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    return NextResponse.json({ error: "날짜를 확인해 주세요." }, { status: 400 });
  }
  if (id === undefined || activityId === undefined) {
    return NextResponse.json({ error: "알 수 없는 일지예요." }, { status: 400 });
  }
  if (!parts) {
    return NextResponse.json(
      { error: "구성은 10줄까지, 이름은 20자·시간은 0~600분으로 적어 주세요." },
      { status: 400 },
    );
  }
  if (raw === null || raw.length > 5000) {
    return NextResponse.json({ error: "메모는 5000자까지 적을 수 있어요." }, { status: 400 });
  }
  if (body?.tips !== undefined && body?.tips !== null && !tips) {
    return NextResponse.json({ error: "팁 모양이 맞지 않아요." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("tennis_lesson_upsert", {
    p_user_id: session.userId,
    p_id: id,
    p_date: date,
    p_parts: parts,
    p_raw: raw,
    p_tips: tips,
    p_activity_id: activityId,
  });
  if (error) {
    console.error("[lesson POST]", error);
    const notFound = /NOT_FOUND/.test(error.message);
    return NextResponse.json(
      { error: notFound ? "고칠 일지를 찾지 못했어요." : "저장에 실패했어요." },
      { status: notFound ? 404 : 500 },
    );
  }
  return NextResponse.json({ lesson: data });
}

export async function DELETE(req: Request) {
  const session = await readAppSession();
  if (!session) return NextResponse.json(UNAUTHORIZED, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "지울 일지가 없어요." }, { status: 400 });
  }

  const { error } = await supabase.rpc("tennis_lesson_delete", {
    p_user_id: session.userId,
    p_id: id,
  });
  if (error) {
    console.error("[lesson DELETE]", error);
    return NextResponse.json({ error: "지우지 못했어요." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
