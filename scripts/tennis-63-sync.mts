/**
 * 63OPEN 팀 배정을 저장 공간(Supabase tennis_events)에 넣는 명령.
 *
 * 왜 필요한가 — 대회 페이지는 저장된 사본이 있으면 그것을 코드보다 먼저 쓴다.
 * 그래서 app/tennis/tournament/data.ts 를 고쳐도 화면에는 옛 사본이 그대로 보인다.
 * 이 명령이 코드의 최종본을 읽어 사본의 팀 배정과 대회 설정(시간·규칙 안내)을 덮어쓴다.
 * 점수·경기 기록(tennis_scores)은 건드리지 않는다.
 *
 * 쓰는 법
 *   미리보기(아무것도 안 바꿈):  npx tsx scripts/tennis-63-sync.mts
 *   실제로 넣기:                npx tsx scripts/tennis-63-sync.mts --적용
 */
import { readFileSync } from "node:fs";
import { OPEN_63 } from "../app/tennis/tournament/data";

const APPLY = process.argv.includes("--적용") || process.argv.includes("--apply");
const EVENT_ID = OPEN_63.id;

function readEnv(): { url: string; key: string } {
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const get = (name: string) => {
    const line = raw.split("\n").find((l) => l.startsWith(`${name}=`));
    return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "") : "";
  };
  const url = get("NEXT_PUBLIC_SUPABASE_URL");
  const key = get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !key) throw new Error(".env.local 에서 저장 공간 주소/열쇠를 찾지 못했어요.");
  return { url, key };
}

const { url, key } = readEnv();
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

type Row = {
  id: string;
  title: string;
  place?: string;
  courts?: number;
  start_time?: string;
  minutes_per_match?: number;
  after_note?: string;
  teams?: { seed: number; name: string; players: { name: string; seed: number }[] }[];
  config?: Record<string, unknown> & { roster?: { name: string }[]; beforeNote?: string };
};

function describe(teams: Row["teams"]): string {
  if (!teams?.length) return "    (없음)";
  return teams
    .map((t) => {
      const names = t.players.map((p) => p.name?.trim()).filter(Boolean);
      return `    ${t.seed}팀 ${String(names.length).padStart(2)}명  ${names.join(" · ") || "(빈칸)"}`;
    })
    .join("\n");
}

const res = await fetch(
  `${url}/rest/v1/tennis_events?id=eq.${EVENT_ID}&select=id,title,place,courts,start_time,minutes_per_match,after_note,teams,config`,
  { headers },
);
if (!res.ok) throw new Error(`저장 공간을 읽지 못했어요 (${res.status})`);
const rows = (await res.json()) as Row[];

if (rows.length === 0) {
  console.log(`저장된 사본이 없어요 (${EVENT_ID}).`);
  console.log("사본이 없으면 화면은 코드의 최종본을 그대로 보여 주니, 할 일이 없습니다.");
  process.exit(0);
}

const before = rows[0];
const beforeCount =
  before.teams?.reduce((n, t) => n + t.players.filter((p) => p.name?.trim()).length, 0) ?? 0;
const afterCount = OPEN_63.teams.reduce((n, t) => n + t.players.length, 0);

console.log(`대회: ${before.title} (${EVENT_ID})\n`);
console.log(`  지금 저장된 것 — 배정 ${beforeCount}명`);
console.log(describe(before.teams));
console.log(`\n  넣을 것 — 배정 ${afterCount}명`);
console.log(describe(OPEN_63.teams));
console.log(
  `\n  명단: ${before.config?.roster?.length ?? 0}명 → ${OPEN_63.roster.length}명`,
);

// 대회 설정 — 규칙을 바꾸면 여기도 같이 넣어야 화면에 반영된다
const settings: [string, unknown, unknown][] = [
  ["장소", before.place, OPEN_63.place],
  ["코트", `${before.courts}면`, `${OPEN_63.courts}면`],
  ["첫 경기", before.start_time, OPEN_63.startTime],
  ["한 타임", `${before.minutes_per_match}분`, `${OPEN_63.minutesPerMatch}분`],
  ["시작 안내", before.config?.beforeNote ?? "", OPEN_63.beforeNote],
  ["마무리 안내", before.after_note ?? "", OPEN_63.afterNote],
];
console.log("\n  대회 설정");
for (const [label, was, now] of settings) {
  const same = String(was) === String(now);
  console.log(`    ${label}: ${was}${same ? "  (그대로)" : `  →  ${now}`}`);
}

if (!APPLY) {
  console.log("\n미리보기만 했어요. 실제로 넣으려면 아래를 실행하세요:");
  console.log("  npx tsx scripts/tennis-63-sync.mts --적용");
  process.exit(0);
}

// 팀 배정과 대회 설정을 코드의 최종본으로 맞춘다. 점수(tennis_scores)는 다른 표라 영향 없다.
const patch = {
  teams: OPEN_63.teams,
  place: OPEN_63.place,
  courts: OPEN_63.courts,
  start_time: OPEN_63.startTime,
  minutes_per_match: OPEN_63.minutesPerMatch,
  after_note: OPEN_63.afterNote,
  config: {
    ...(before.config ?? {}),
    roster: OPEN_63.roster,
    gamesToWin: OPEN_63.gamesToWin,
    timeTbd: OPEN_63.timeTbd,
    beforeNote: OPEN_63.beforeNote,
  },
  updated_at: new Date().toISOString(),
};

const put = await fetch(`${url}/rest/v1/tennis_events?id=eq.${EVENT_ID}`, {
  method: "PATCH",
  headers: { ...headers, Prefer: "return=representation" },
  body: JSON.stringify(patch),
});
if (!put.ok) {
  throw new Error(`저장하지 못했어요 (${put.status}) ${await put.text()}`);
}

const [after] = (await put.json()) as Row[];
const nowCount =
  after.teams?.reduce((n, t) => n + t.players.filter((p) => p.name?.trim()).length, 0) ?? 0;
console.log(`\n넣었어요. 저장 공간 기준 배정 ${nowCount}명`);
console.log(describe(after.teams));
console.log("\n대회 페이지를 새로고침하면 보입니다.");
