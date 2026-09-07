#!/usr/bin/env node
// 가계부 빠른 입력 도구 (사용자 전용, 커밋됨).
// 앱 화면이 쓰는 것과 똑같은 서버 함수(account_book_user_login → account_book_upsert_entry)를 부른다.
// 비밀번호는 터미널 프롬프트에서만 입력하고 어디에도 저장·출력하지 않는다.
//
// 사용법 (프로젝트 폴더에서):
//   node scripts/ledger-add.mjs --user 황냥 <<'EOF'
//   2026-09-07 점심 김밥천국 8500 카드 식비
//   2026-09-07 커피 스타벅스 5600 카드 카페
//   2026-09-06 택시 12300 카드 교통
//   EOF
// 한 줄 형식: 날짜(YYYY-MM-DD, 생략 시 오늘)  항목  [상호]  금액  [결제: 카드|체크|현금]  [분류]  [메모…]
//   - 금액은 숫자만(콤마 가능). 수입은 금액 앞에 + 를 붙인다: "+ 2026-09-25 월급 3000000 현금 급여"
//   - 결제 기본값은 카드, 분류 기본값은 "기타".
// 옵션: --user 닉네임(필수) · --workspace 워크스페이스id(기본: 개인 가계부) · --card 카드사(기본 빈칸) · --dry (저장 없이 미리보기)

import { createInterface } from "node:readline";
import { readFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";

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

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : dflt; };
const userName = opt("user"); const dry = args.includes("--dry");
const defaultCard = opt("card", "");
if (!userName) { console.error("--user 닉네임을 넣어 주세요. 예) --user 황냥"); process.exit(1); }

async function rpc(fn, body) {
  const res = await fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const text = await res.text(); let data = null; try { data = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(`${fn} 실패 (${res.status}): ${(data && data.message) || text.slice(0, 160)}`);
  return data;
}

async function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr, terminal: true });
    process.stderr.write(question);
    const onData = (ch) => { const c = String(ch); if (c === "\n" || c === "\r") { process.stdin.removeListener("data", onData); } };
    rl._writeToOutput = () => {}; // 입력 글자를 화면에 안 보이게
    rl.question("", (ans) => { rl.close(); process.stderr.write("\n"); resolve(ans); });
    process.stdin.on("data", onData);
  });
}

function parseLine(line, defaults) {
  const raw = line.trim(); if (!raw || raw.startsWith("#")) return null;
  let type = "expense"; let s = raw;
  if (s.startsWith("+")) { type = "income"; s = s.slice(1).trim(); }
  const tokens = s.split(/\s+/);
  let date = new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(tokens[0])) date = tokens.shift();
  const amtIdx = tokens.findIndex((t) => /^[\d,]+원?$/.test(t));
  if (amtIdx < 1) return { error: `금액을 못 찾았어요: "${raw}"` };
  const amount = Number(tokens[amtIdx].replace(/[,원]/g, ""));
  const before = tokens.slice(0, amtIdx); const after = tokens.slice(amtIdx + 1);
  const item = before[0]; const merchant = before.slice(1).join(" ") || undefined;
  let payment = "card"; let category = defaults.category; const memoParts = [];
  for (const t of after) {
    if (["카드", "card"].includes(t)) payment = "card";
    else if (["체크", "체크카드", "check"].includes(t)) payment = "check_card";
    else if (["현금", "cash"].includes(t)) payment = "cash";
    else if (category === defaults.category) category = t; // 첫 미지정 토큰은 분류
    else memoParts.push(t);
  }
  return { date, type, item, merchant, amount, payment, category, memo: memoParts.join(" ") };
}

const input = readFileSync(0, "utf8");
const parsed = input.split("\n").map((l) => parseLine(l, { category: "기타" })).filter(Boolean);
const bad = parsed.filter((p) => p.error); if (bad.length) { bad.forEach((b) => console.error(b.error)); process.exit(1); }
if (parsed.length === 0) { console.error("입력된 줄이 없어요."); process.exit(1); }

const users = await rpc("account_book_list_users", {});
const user = users.find((u) => u.name === userName);
if (!user) { console.error(`"${userName}" 사용자를 찾지 못했어요. 목록: ${users.map((u) => u.name).join(", ")}`); process.exit(1); }
const workspaceId = opt("workspace", user.personalWorkspaceId);

console.error(`\n${userName} · 워크스페이스 ${workspaceId} 에 ${parsed.length}건 ${dry ? "(미리보기)" : "저장"}:`);
for (const p of parsed) console.error(`  ${p.date}  ${p.type === "income" ? "+" : "-"}${p.amount.toLocaleString()}원  ${p.item}${p.merchant ? " @" + p.merchant : ""}  [${p.category} · ${p.payment}]${p.memo ? "  " + p.memo : ""}`);
if (dry) process.exit(0);

const password = await askHidden(`${userName} 가계부 비밀번호 (화면에 안 보임): `);
const login = await rpc("account_book_user_login", { p_user_id: user.id, p_password: password });
if (!login || !login.ok) { console.error("비밀번호가 맞지 않아요."); process.exit(1); }
// 출입증은 로그인 확인용으로만 쓰고 저장 함수는 앱과 같은 인자로 호출한다
let ok = 0;
for (const p of parsed) {
  const entry = { id: `entry-${randomUUID().slice(0, 8)}`, date: p.date, workspaceId, createdByUserId: user.id, member: userName, type: p.type, category: p.category, subCategory: "", merchant: p.merchant ?? "", item: p.item, amount: p.amount, cardCompany: p.payment === "cash" ? "" : defaultCard, payment: p.payment, memo: p.memo, rawText: p.memo };
  await rpc("account_book_upsert_entry", { p_entry: entry, p_actor_user_id: user.id }); ok += 1;
}
await rpc("account_book_logout", { p_token: login.token }).catch(() => {});
console.error(`완료: ${ok}건 저장했어요. 가계부 화면을 새로고침하면 보여요.`);
