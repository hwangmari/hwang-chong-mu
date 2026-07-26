// GET /api/auth/me → 현재 로그인 사용자 { user } 또는 { user: null }
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { readAppSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await readAppSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }
    const { data, error } = await supabase.rpc("hwang_get_user", {
      p_user_id: session.userId,
    });
    if (error || !data) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({ user: data });
  } catch (err) {
    console.error("[auth/me]", err);
    return NextResponse.json({ user: null });
  }
}
