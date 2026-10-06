/**
 * 63OPEN 대회 연습용 데이터 넣기·지우기.
 *
 * 대회 전에 "다 끝나면 화면이 어떻게 보이는지" 미리 보려고 만들었다.
 * 참가자 30명의 표와 비번, 그리고 16경기 결과를 가짜로 채운다.
 *
 * 쓰는 법
 *   npx tsx scripts/tennis-63-demo.mts            → 지금 들어 있는 연습용 자료 보기
 *   npx tsx scripts/tennis-63-demo.mts --넣기      → 연습용 자료 채우기
 *   npx tsx scripts/tennis-63-demo.mts --지우기    → 연습용 자료 모두 지우기
 *
 * ⚠️ 대회 당일 전에 반드시 --지우기 를 실행할 것. 남겨 두면 경기가 이미 끝난 것으로 보인다.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { OPEN_63 as E } from "../app/tennis/tournament/data";
import { DOUBLE_ELIM_8 } from "../app/tennis/tournament/template";

const FILL = process.argv.includes("--넣기") || process.argv.includes("--fill");
const WIPE = process.argv.includes("--지우기") || process.argv.includes("--wipe");

const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (name: string) =>
  raw.split("\n").find((l) => l.startsWith(`${name}=`))?.slice(name.length + 1).trim().replace(/^["']|["']$/g, "") ?? "";
const url = get("NEXT_PUBLIC_SUPABASE_URL");
const key = get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (!url || !key) throw new Error(".env.local 에서 저장 공간 주소/열쇠를 찾지 못했어요.");
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" };

async function api(path: string, method = "GET", body?: unknown) {
  const res = await fetch(`${url}/rest/v1/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(`${method} ${path} 실패 (${res.status}) ${await res.text()}`);
  return (await res.json()) as unknown[];
}

const where = `event_id=eq.${E.id}`;

async function count() {
  const [votes, pins, scores] = await Promise.all([
    api(`tennis_votes?${where}&select=kind`),
    api(`tennis_vote_pins?${where}&select=name`),
    api(`tennis_scores?${where}&select=match_no`),
  ]);
  return { votes: votes.length, pins: pins.length, scores: scores.length };
}

async function wipe() {
  await api(`tennis_votes?${where}`, "DELETE");
  await api(`tennis_vote_pins?${where}`, "DELETE");
  await api(`tennis_scores?${where}`, "DELETE");
}

const before = await count();
console.log(`지금 — 표 ${before.votes}개 · 비번 ${before.pins}개 · 경기 결과 ${before.scores}개`);

if (WIPE) {
  await wipe();
  const after = await count();
  console.log(`\n지웠어요. 표 ${after.votes}개 · 비번 ${after.pins}개 · 경기 결과 ${after.scores}개`);
} else if (FILL) {
  await wipe(); // 겹치지 않게 먼저 비운다

  const all = E.roster.map((r) => r.name);
  // 본인은 빼고 세 명씩 고른다. 표가 고르게 퍼지면 전원 동점이 되어 연습이 되지 않으므로
  // 앞쪽 몇 명에게 표가 몰리도록 섞는다 (실제 투표도 이렇게 쏠린다)
  const picksFor = (i: number) => {
    const hot = [all[0], all[1], all[2], all[3]]; // 인기 후보 네 명
    const want = [hot[i % 2], hot[2 + (i % 2)], all[(i * 7 + 5) % all.length]];
    return [...new Set(want)].filter((n) => n !== all[i]).slice(0, 3);
  };
  // 비번은 명단 순서대로 1000부터. 연습용이라 규칙을 그대로 적어 둔다
  const pinOf = (i: number) => String(1000 + i);

  await api("tennis_vote_pins", "POST", E.roster.map((r, i) => ({
    event_id: E.id, name: r.name,
    pin_hash: createHash("sha256").update(`${E.id}|${r.name}|${pinOf(i)}`).digest("hex"),
  })));
  await api("tennis_votes", "POST", E.roster.flatMap((r, i) => [
    { event_id: E.id, kind: "champion", voter_key: `player-${r.name}`, choice: String((i % E.teams.length) + 1) },
    { event_id: E.id, kind: "dresser", voter_key: `player-${r.name}`, choice: picksFor(i).join("|") },
  ]));
  await api("tennis_scores", "POST", DOUBLE_ELIM_8.map((m) => {
    const upset = m.no % 4 === 3; // 몇 경기는 뒤집어 대진이 섞이게
    return {
      event_id: E.id, match_no: m.no,
      score_a: upset ? E.gamesToWin - 2 : E.gamesToWin,
      score_b: upset ? E.gamesToWin : E.gamesToWin - 2,
      court: m.court, started_at: `${E.date}T04:00:00Z`, finished_at: `${E.date}T04:40:00Z`,
    };
  }));

  const after = await count();
  console.log(`\n채웠어요. 표 ${after.votes}개 · 비번 ${after.pins}개 · 경기 결과 ${after.scores}개`);
  console.log(`\n  👉 /tennis/${E.id} 의 "투표" 탭에서 보세요.`);
  console.log("  비번은 명단 순서대로 1000부터예요:");
  for (const [i, r] of E.roster.slice(0, 3).entries()) console.log(`    ${r.name} → ${pinOf(i)}`);
  console.log(`    … ${E.roster.at(-1)!.name} → ${pinOf(E.roster.length - 1)}`);
  console.log("\n  ⚠️ 대회 전에 꼭 지우세요:  npx tsx scripts/tennis-63-demo.mts --지우기");
} else {
  console.log("\n채우려면  npx tsx scripts/tennis-63-demo.mts --넣기");
  console.log("지우려면  npx tsx scripts/tennis-63-demo.mts --지우기");
}
