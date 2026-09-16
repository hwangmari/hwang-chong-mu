// 여행 플랜 저장 (travel_plans).
// 로그인 없이 링크만 있으면 누구나 같이 고치는 방 공유형 서비스라 표는 anon permissive 정책이다.
// 실제 통제는 "주소(<slug>-<코드>)를 아는 사람만"이라는 전제. (2026-09-16)
import { supabase } from "@/lib/supabase";
import { createShortCode, toSlug } from "@/lib/slug";
import { buildDays, normalizeDay } from "@/app/travel/lib/plan";
import type { TravelDay, TravelPlace, TravelPlan } from "@/app/travel/types";

type PlanRow = {
  id: string;
  slug: string;
  short_code: string;
  title: string;
  start_date: string;
  end_date: string;
  region: string;
  days: TravelDay[] | null;
  pool: TravelPlace[] | null;
  created_at: string;
  updated_at: string;
};

const PLAN_COLUMNS =
  "id, slug, short_code, title, start_date, end_date, region, days, pool, created_at, updated_at";

function toPlan(row: PlanRow): TravelPlan {
  return {
    id: row.id,
    slug: row.slug,
    shortCode: row.short_code,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    region: row.region ?? "",
    // 예전 저장본이나 다른 사람이 동시에 고친 결과라도 숙소 자리·id 규칙을 여기서 한 번 맞춰 둔다.
    // 저장본이 배열이 아닐 수도 있어(직접 고쳤거나 예전 모양) 먼저 배열인지 본다 (리뷰 반영 2026-09-16)
    days: (Array.isArray(row.days) ? row.days : []).map(normalizeDay),
    pool: Array.isArray(row.pool) ? row.pool : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 주소에 코드만 적어 온 경우(/travel/ABC234)를 가려내는 규칙. createShortCode 가 쓰는 글자와 같다.
const BARE_CODE = /^[A-Z2-9]{6}$/;

export type NewTravelPlan = Pick<TravelPlan, "title" | "startDate" | "endDate" | "region">;

// 새 여행 만들기: 주소에 그대로 쓰는 id("<slug>-<코드>")를 직접 만들어 넣는다.
// 코드가 겹치면(23505) 다른 코드로 최대 5번까지 다시 시도한다. (hooks/useCreateRoom.ts 와 같은 방식)
export async function createTravelPlan(input: NewTravelPlan): Promise<TravelPlan> {
  // toSlug 는 영어·숫자·한글이 하나도 없으면 "meeting"을 돌려준다 — 여행 주소에 그 이름이 붙으면 헷갈려서 "trip"으로 바꾼다
  const base = toSlug(input.title);
  const slug = base === "meeting" ? "trip" : base;
  const days = buildDays(input.startDate, input.endDate);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shortCode = createShortCode(6);
    const { data, error } = await supabase
      .from("travel_plans")
      .insert({
        id: `${slug}-${shortCode}`,
        slug,
        short_code: shortCode,
        title: input.title,
        start_date: input.startDate,
        end_date: input.endDate,
        region: input.region,
        days,
        pool: [],
      })
      .select(PLAN_COLUMNS)
      .single();

    if (error) {
      if (error.code === "23505") continue;
      throw error;
    }
    return toPlan(data as PlanRow);
  }

  throw new Error("여행 주소 만들기에 실패했습니다.");
}

// 주소로 여행 한 개 읽기. 코드 6자리만 온 경우도 받아 준다.
export async function fetchTravelPlan(id: string): Promise<TravelPlan | null> {
  const query = supabase.from("travel_plans").select(PLAN_COLUMNS);
  const { data, error } = await (BARE_CODE.test(id)
    ? query.eq("short_code", id)
    : query.eq("id", id)
  ).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return toPlan(data as PlanRow);
}

export type TravelMetaPatch = Partial<
  Pick<TravelPlan, "title" | "startDate" | "endDate" | "region" | "days" | "pool">
>;

// 제목·기간·나라, 그리고 날짜 칸 전체를 고친다. 넘긴 항목만 바뀐다.
export async function updateTravelMeta(
  id: string,
  patch: TravelMetaPatch,
): Promise<TravelPlan> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.startDate !== undefined) row.start_date = patch.startDate;
  if (patch.endDate !== undefined) row.end_date = patch.endDate;
  if (patch.region !== undefined) row.region = patch.region;
  if (patch.days !== undefined) row.days = patch.days;
  if (patch.pool !== undefined) row.pool = patch.pool;

  const { data, error } = await supabase
    .from("travel_plans")
    .update(row)
    .eq("id", id)
    .select(PLAN_COLUMNS)
    .single();
  if (error) throw error;
  return toPlan(data as PlanRow);
}

// 하루치만 저장한다. days 배열을 통째로 덮어쓰면 같은 시각에 다른 날을 고친 사람의 내용이 지워지므로
// 저장 공간 쪽 함수(travel_plans_set_day)가 그 칸만 바꾼다.
export async function setTravelDay(
  id: string,
  index: number,
  day: TravelDay,
): Promise<TravelDay[]> {
  const { data, error } = await supabase.rpc("travel_plans_set_day", {
    p_id: id,
    p_index: index,
    p_day: normalizeDay(day),
  });
  if (error) {
    // 저장 공간이 "그 날 칸이 없다"고 답한 경우 — 다른 사람이 기간을 줄인 것이라 화면이 알아볼 이름으로 바꿔 던진다 (리뷰 반영 2026-09-16)
    if (typeof error.message === "string" && error.message.includes("INDEX_OUT_OF_RANGE")) {
      throw new Error("RANGE_CHANGED");
    }
    throw error;
  }
  return ((data as TravelDay[] | null) ?? []).map(normalizeDay);
}
