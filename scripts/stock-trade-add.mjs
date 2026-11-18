#!/usr/bin/env node
// 주식 매매 기록 빠른 입력 도구 (사용자 전용). ledger-add.mjs 와 같은 방식.
// 앱 투자 화면이 쓰는 것과 같은 서버 함수(account_book_upsert_stock_trade)를 부른다.
// 비밀번호는 터미널 프롬프트에서만 입력하고 어디에도 저장·출력하지 않는다.
//
// 사용법 (프로젝트 폴더에서):
//   node scripts/stock-trade-add.mjs --user 황냥 --account asset-account-6ab53044 --file 매매.txt
// 한 줄 형식: 날짜(YYYY-MM-DD)  매수|매도  종목명[(종목코드)]  수량  체결가  [수수료=숫자]  [메모…]
//   예) 2026-09-18 매도 SK하이닉스 1 1845000 수수료=3749 신한
//   - 체결가는 수수료·세금을 빼기 전 1주 가격. 수수료에는 매도 세금까지 합쳐 넣는다.
//   - 종목코드를 안 쓰면 이 가계부에 이미 있는 같은 이름 종목의 코드를 쓴다.
// 옵션: --user 닉네임(필수) · --account 투자 통장 id(필수) · --file 내역 파일 · --workspace id(기본: 개인 가계부) · --dry (저장 없이 미리보기)

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
const userName = opt("user"); const accountId = opt("account"); const dry = args.includes("--dry");
if (!userName) { console.error("--user 닉네임을 넣어 주세요. 예) --user 황냥"); process.exit(1); }
if (!accountId) { console.error("--account 투자 통장 id를 넣어 주세요. (투자 화면 주소의 account= 값)"); process.exit(1); }

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
    rl._writeToOutput = () => {}; // 입력 글자를 화면에 안 보이게
    rl.question("", (ans) => { rl.close(); process.stderr.write("\n"); resolve(ans); });
  });
}

const num = (t) => Number(String(t).replace(/[,원주]/g, ""));

function parseLine(line) {
  const raw = line.trim(); if (!raw || raw.startsWith("#")) return null;
  const t = raw.split(/\s+/);
  if (t.length < 5) return { error: `칸이 모자라요(날짜 매수/매도 종목 수량 체결가): "${raw}"` };
  const [date, sideWord, nameToken, qtyToken, priceToken, ...rest] = t;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: `날짜는 YYYY-MM-DD: "${raw}"` };
  const side = { 매수: "buy", 구매: "buy", buy: "buy", 매도: "sell", 판매: "sell", sell: "sell" }[sideWord];
  if (!side) return { error: `매수/매도를 못 읽었어요: "${raw}"` };
  const m = nameToken.match(/^(.+?)(?:\((\d{6})\))?$/);
  const quantity = num(qtyToken); const price = num(priceToken);
  if (!Number.isInteger(quantity) || quantity <= 0 || !Number.isInteger(price) || price <= 0) return { error: `수량·체결가는 양의 정수: "${raw}"` };
  let fee = 0; const memo = [];
  for (const r of rest) { const f = r.match(/^수수료=([\d,]+)$/); if (f) fee = num(f[1]); else memo.push(r); }
  return { date, side, stockName: m[1], stockCode: m[2] || "", quantity, price, fee, memo: memo.join(" ") };
}

const inputFile = opt("file");
const input = readFileSync(inputFile ?? 0, "utf8");
const parsed = input.split("\n").map(parseLine).filter(Boolean);
const bad = parsed.filter((p) => p.error); if (bad.length) { bad.forEach((b) => console.error(b.error)); process.exit(1); }
if (parsed.length === 0) { console.error("입력된 줄이 없어요."); process.exit(1); }

const users = await rpc("account_book_list_users", {});
const user = users.find((u) => u.name === userName);
if (!user) { console.error(`"${userName}" 사용자를 찾지 못했어요. 목록: ${users.map((u) => u.name).join(", ")}`); process.exit(1); }
const workspaceId = opt("workspace", user.personalWorkspaceId);

// 종목코드 채우기 + 같은 거래 중복 확인용으로 기존 기록을 읽는다
const existing = (await rpc("account_book_get_stock_trades", { p_workspace_id: workspaceId })) || [];
for (const p of parsed) {
  if (!p.stockCode) {
    const known = existing.find((e) => e.stock_name === p.stockName);
    if (!known) { console.error(`"${p.stockName}" 종목코드를 몰라요. 종목명(000000) 처럼 적어 주세요.`); process.exit(1); }
    p.stockCode = known.stock_code;
  }
  p.duplicate = existing.some((e) => e.account_id === accountId && e.date === p.date && e.side === p.side && e.stock_code === p.stockCode && e.quantity === p.quantity && e.price === p.price);
}

console.error(`\n${userName} · 통장 ${accountId} 에 ${parsed.length}건 ${dry ? "(미리보기)" : "저장"}:`);
for (const p of parsed) console.error(`  ${p.date}  ${p.side === "buy" ? "매수" : "매도"}  ${p.stockName}(${p.stockCode})  ${p.quantity}주 × ${p.price.toLocaleString()}원  수수료 ${p.fee.toLocaleString()}원${p.memo ? "  " + p.memo : ""}${p.duplicate ? "  ⚠️ 이미 같은 기록 있음 → 건너뜀" : ""}`);
if (dry) process.exit(0);

const toSave = parsed.filter((p) => !p.duplicate);
if (toSave.length === 0) { console.error("새로 저장할 기록이 없어요."); process.exit(0); }
if (!process.stdin.isTTY) { console.error("비밀번호를 칠 터미널이 없어요. 내역은 --file 파일로 넘기고, 터미널 앱에서 직접 실행해 주세요."); process.exit(1); }
const password = await askHidden(`${userName} 가계부 비밀번호 (화면에 안 보임): `);
const login = await rpc("account_book_user_login", { p_user_id: user.id, p_password: password });
if (!login || !login.ok) { console.error("비밀번호가 맞지 않아요."); process.exit(1); }
let ok = 0;
for (const p of toSave) {
  const trade = { id: `stock-trade-${randomUUID().replace(/-/g, "").slice(0, 12)}`, workspaceId, accountId, date: p.date, side: p.side, stockCode: p.stockCode, stockName: p.stockName, quantity: p.quantity, price: p.price, fee: p.fee, memo: p.memo, createdByUserId: user.id };
  await rpc("account_book_upsert_stock_trade", { p_trade: trade, p_actor_user_id: user.id }); ok += 1;
}
await rpc("account_book_logout", { p_token: login.token }).catch(() => {});
console.error(`완료: ${ok}건 저장했어요. 투자 화면을 새로고침하면 보여요.`);
