// 통합 계정의 서비스 연결 관리.
// GET(list) / POST(upsert) / DELETE — user_id는 항상 세션 쿠키에서 확정한다(클라 위조 불가).
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { readAppSession } from "@/lib/auth/session";

const SERVICES = ["account-book", "workout", "habit", "diet", "schedule"];

export async function GET() {
  const session = await readAppSession();
  if (!session) return NextResponse.json({ links: [] }, { status: 401 });
  const { data, error } = await supabase.rpc("hwang_links_list", {
    p_user_id: session.userId,
  });
  if (error) {
    console.error("[auth/links GET]", error);
    return NextResponse.json({ links: [] }, { status: 500 });
  }
  return NextResponse.json({ links: data ?? [] });
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
  const resourceRef =
    body?.resourceRef && typeof body.resourceRef === "object"
      ? body.resourceRef
      : {};
  const label = typeof body?.label === "string" ? body.label : "";
  const { data, error } = await supabase.rpc("hwang_links_upsert", {
    p_user_id: session.userId,
    p_service: service,
    p_resource_ref: resourceRef,
    p_label: label,
  });
  if (error) {
    console.error("[auth/links POST]", error);
    return NextResponse.json({ error: "연결에 실패했어요." }, { status: 500 });
  }
  return NextResponse.json({ links: data ?? [] });
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
  const { data, error } = await supabase.rpc("hwang_links_delete", {
    p_user_id: session.userId,
    p_service: service,
  });
  if (error) {
    console.error("[auth/links DELETE]", error);
    return NextResponse.json({ error: "해제에 실패했어요." }, { status: 500 });
  }
  return NextResponse.json({ links: data ?? [] });
}
