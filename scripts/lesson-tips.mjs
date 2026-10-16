#!/usr/bin/env node
// 테니스 레슨 일지 팁 채우기 도구 (클로드용, 커밋됨).
// 주인이 /lesson 에 적은 날것 메모(raw)를 클로드가 읽고, 주제별 팁(tips)으로 정리해 넣는다 (주인 결정 2026-10-16 — AI 연동 대신 이 방식).
// 표 tennis_lessons 는 운동 기록 표들처럼 anon 키로 읽고 쓸 수 있어 비밀번호가 필요 없다.
//
// 사용법 (프로젝트 폴더에서):
//   node scripts/lesson-tips.mjs list            # 팁 정리가 필요한 일지(정리 전·메모 고친 뒤)를 JSON 으로
//   node scripts/lesson-tips.mjs list --all      # 전부
//   node scripts/lesson-tips.mjs set <id> <<'EOF'
//   [{ "topic": "백핸드 스텝", "points": ["오른발만 바로 내민다", "..."] }]
//   EOF
//   (set 에 --dry 를 붙이면 저장하지 않고 읽은 팁만 보여 준다)
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

const [cmd, ...rest] = process.argv.slice(2);
const COLS = "id,date,parts,raw,tips,tips_at,raw_at";

async function list(all) {
  const res = await fetch(`${URL_}/rest/v1/tennis_lessons?select=${COLS}&order=date.desc`, { headers });
  if (!res.ok) throw new Error(`읽기 실패 (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const rows = await res.json();
  const pending = (r) =>
    !r.tips?.length || (r.tips_at && new Date(r.raw_at).getTime() > new Date(r.tips_at).getTime());
  // 이미 쓰는 주제 이름 — 새 팁도 같은 이름으로 맞추라고 함께 보여 준다
  const topics = [...new Set(rows.flatMap((r) => (r.tips ?? []).map((t) => t.topic)))];
  console.log(JSON.stringify({ topics, lessons: all ? rows : rows.filter(pending) }, null, 2));
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
  if (!/^[0-9a-f-]{36}$/i.test(id ?? "")) throw new Error("일지 id(uuid)를 넣어 주세요");
  const tips = validate(JSON.parse(readFileSync(0, "utf8")));
  if (dry) { console.log(JSON.stringify(tips, null, 2)); return; }
  const res = await fetch(`${URL_}/rest/v1/tennis_lessons?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({ tips, tips_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`저장 실패 (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const rows = await res.json();
  if (!rows.length) throw new Error("그 id 의 일지가 없어요");
  console.log(`✓ ${rows[0].date} 일지에 팁 ${tips.length}묶음을 넣었어요`);
}

try {
  if (cmd === "list") await list(rest.includes("--all"));
  else if (cmd === "set") await set(rest.find((a) => !a.startsWith("--")), rest.includes("--dry"));
  else { console.error("사용법: node scripts/lesson-tips.mjs list [--all] | set <id> [--dry] < tips.json"); process.exit(1); }
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
