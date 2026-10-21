#!/usr/bin/env node
// 테니스 레슨 일지 팁 채우기 도구 (클로드용, 커밋됨).
// 주인이 /lesson 에 적은 날것 메모(raw)를 클로드가 읽고, 주제별 팁(tips)으로 정리해 넣는다 (주인 결정 2026-10-16 — AI 연동 대신 이 방식).
// 일지는 황총무 계정별로 잠긴 표(tennis_lesson_entries)에 있어서, anon 키로 tennis_lesson_list / tennis_lesson_set_tips 함수를 부른다
// (supabase/20261016_tennis_lessons_by_account.sql). 그래서 누구의 일지인지 계정 id 가 필요하다.
//
// 계정 id 찾기: 사이트에 로그인한 채로 /api/auth/me 를 열면 나오는 user.id.
//   → .env.local 에 LESSON_USER_ID=<그 id> 를 직접 한 줄 더해 두거나, 매번 --user <id> 로 넘긴다.
//
// 사용법 (프로젝트 폴더에서):
//   node scripts/lesson-tips.mjs list            # 팁 정리가 필요한 일지(정리 전·메모 고친 뒤)를 JSON 으로
//   node scripts/lesson-tips.mjs list --all      # 전부
//   node scripts/lesson-tips.mjs set <id> <<'EOF'
//   [{ "topic": "백핸드 스텝", "points": ["오른발만 바로 내민다", "..."] }]
//   EOF
//   (set 에 --dry 를 붙이면 저장하지 않고 읽은 팁만 보여 준다. 어느 명령이든 --user <계정 id> 를 붙일 수 있다)
//
// 팁 쓰는 법: topic 은 기술 이름(포핸드·백핸드 스텝·서브 토스…), points 는 한 줄짜리 실천 항목.
// 주인이 쓴 말을 살리고, 꼭 기억할 부분만 **굵게**. 같은 주제는 이전 일지와 같은 이름을 쓴다(팁 모아보기에서 묶인다).

import { readFileSync, existsSync } from "node:fs";

function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}
loadEnv();
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL_ || !KEY) { console.error("환경변수(.env.local)를 찾지 못했어요."); process.exit(1); }
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const argv = process.argv.slice(2);
// --user <id> 는 어디에 붙여도 되고, 나머지 인자에서는 뺀다
const userFlag = argv.indexOf("--user");
const USER_ID = userFlag >= 0 ? argv[userFlag + 1] : process.env.LESSON_USER_ID;
if (userFlag >= 0) argv.splice(userFlag, 2);
const [cmd, ...rest] = argv;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function rpc(name, body) {
  const res = await fetch(`${URL_}/rest/v1/rpc/${name}`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${name} 실패 (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

function needUser() {
  if (!UUID_RE.test(USER_ID ?? "")) {
    throw new Error("계정 id 가 필요해요. --user <id> 를 붙이거나 .env.local 에 LESSON_USER_ID 를 넣어 주세요 (로그인한 채 /api/auth/me 에서 확인).");
  }
  return USER_ID;
}

async function list(all) {
  const rows = await rpc("tennis_lesson_list", { p_user_id: needUser() });
  const pending = (r) =>
    !r.tips?.length || (r.tipsAt && new Date(r.rawAt).getTime() > new Date(r.tipsAt).getTime());
  // 이미 쓰는 주제 이름 — 새 팁도 같은 이름으로 맞추라고 함께 보여 준다
  const topics = [...new Set(rows.flatMap((r) => (r.tips ?? []).map((t) => t.topic)))];
  // 예전 출력 모양(tips_at·raw_at)을 그대로 유지한다
  const out = rows.map((r) => ({ id: r.id, date: r.date, parts: r.parts, raw: r.raw, tips: r.tips, tips_at: r.tipsAt, raw_at: r.rawAt }));
  console.log(JSON.stringify({ topics, lessons: all ? out : out.filter((r, i) => pending(rows[i])) }, null, 2));
}

function validate(tips) {
  if (!Array.isArray(tips)) throw new Error("팁은 배열이어야 해요: [{ topic, points: [...] }]");
  for (const t of tips) {
    if (typeof t?.topic !== "string" || !t.topic.trim()) throw new Error("topic 이 비어 있는 팁이 있어요");
    if (!Array.isArray(t.points) || t.points.some((p) => typeof p !== "string" || !p.trim()))
      throw new Error(`"${t.topic}" 의 points 는 글자 배열이어야 해요`);
  }
  return tips.map((t) => ({ topic: t.topic.trim(), points: t.points.map((p) => p.trim()) }));
}

async function set(id, dry) {
  if (!UUID_RE.test(id ?? "")) throw new Error("일지 id(uuid)를 넣어 주세요");
  const tips = validate(JSON.parse(readFileSync(0, "utf8")));
  if (dry) { console.log(JSON.stringify(tips, null, 2)); return; }
  let row;
  try {
    row = await rpc("tennis_lesson_set_tips", { p_user_id: needUser(), p_id: id, p_tips: tips });
  } catch (e) {
    if (/NOT_FOUND/.test(e.message)) throw new Error("그 id 의 일지가 없어요 (다른 계정의 일지일 수도 있어요)");
    throw e;
  }
  console.log(`✓ ${row.date} 일지에 팁 ${tips.length}묶음을 넣었어요`);
}

try {
  if (cmd === "list") await list(rest.includes("--all"));
  else if (cmd === "set") await set(rest.find((a) => !a.startsWith("--")), rest.includes("--dry"));
  else { console.error("사용법: node scripts/lesson-tips.mjs list [--all] | set <id> [--dry] < tips.json  (--user <계정 id> 또는 LESSON_USER_ID)"); process.exit(1); }
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
