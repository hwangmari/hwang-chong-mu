#!/usr/bin/env node
// 운동 기록 빠른 입력 도구 (사용자 전용, 커밋됨).
// 앱 화면과 같은 순서로 동작한다: 운동방 로그인(workout_room_login) → 기록 표에 저장.
// 방 비밀번호는 터미널 프롬프트에서만 입력하고 어디에도 저장·출력하지 않는다.
//
// 사용법 (프로젝트 폴더에서):
//   node scripts/workout-add.mjs --room 방이름 <<'EOF'
//   2026-09-02 러닝 zone2 실외 5.2km 32:10 심박 145
//   2026-09-03 헬스 가슴 60분 | 벤치프레스 60x10x3, 인클라인 덤벨프레스 20x12x3, 플랭크 60초x3 | 컨디션 좋음
//   2026-09-05 활동 테니스 90분
//   EOF
//
// 한 줄 형식 (날짜는 YYYY-MM-DD, 생략하면 오늘):
//   러닝  → 날짜 러닝 [종류] [실외|실내] 거리km 시간 [심박 N] [칼로리 N] [메모…]
//            종류: zone2 | 인터벌 | LSD | 템포 | 이지 | 대회 | 기타 (기본 이지)   시간: 32:10 또는 1:02:30
//   헬스  → 날짜 헬스 [부위] [N분] [심박 N] | 운동명 무게x횟수x세트, 운동명 무게x횟수x세트 … [| 메모]
//            부위: 가슴 | 등 | 어깨 | 하체 | 팔 | 복근 | 전신 | 기타
//            세트: 60x10x3 (60kg 10회 3세트) · 60x10/60x8 (세트마다 다르면 / 로) · 플랭크 60초x3 (시간 운동)
//   활동  → 날짜 활동 종목 [N분] [심박 N] [칼로리 N] [메모…]   예) 활동 테니스 90분
// 옵션: --room 방이름(없으면 물어봄) · --dry (저장 없이 미리보기)

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
const dry = args.includes("--dry");

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
async function rpc(fn, body) {
  const res = await fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: "POST", headers, body: JSON.stringify(body) });
  const text = await res.text(); let data = null; try { data = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(`${fn} 실패 (${res.status}): ${(data && data.message) || text.slice(0, 160)}`);
  return data;
}
async function upsert(table, row) {
  const res = await fetch(`${URL_}/rest/v1/${table}?on_conflict=id`, {
    method: "POST", headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`${table} 저장 실패 (${res.status}): ${(await res.text()).slice(0, 160)}`);
}
async function ask(question, hidden) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr, terminal: true });
    process.stderr.write(question);
    if (hidden) rl._writeToOutput = () => {}; // 입력 글자를 화면에 안 보이게
    rl.question("", (ans) => { rl.close(); process.stderr.write("\n"); resolve(ans.trim()); });
  });
}

// ---------- 파서 ----------
const RUN_TYPE = { zone2: "zone2", "zone2런": "zone2", 인터벌: "interval", lsd: "lsd", 장거리: "lsd", 템포: "tempo", 이지: "easy", 대회: "race", 레이스: "race", 기타: "other" };
const BODY = { 가슴: "chest", 등: "back", 어깨: "shoulder", 하체: "leg", 다리: "leg", 팔: "arm", 복근: "abs", 전신: "fullbody", 기타: "other" };

function toSec(t) {
  const p = t.split(":").map(Number);
  if (p.some((n) => Number.isNaN(n))) return null;
  return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p.length === 2 ? p[0] * 60 + p[1] : null;
}
function takeNumberAfter(tokens, label) {
  const i = tokens.indexOf(label);
  if (i < 0 || !/^\d+$/.test(tokens[i + 1] ?? "")) return { rest: tokens, value: undefined };
  const value = Number(tokens[i + 1]);
  return { rest: [...tokens.slice(0, i), ...tokens.slice(i + 2)], value };
}

function parseRunning(date, tokens) {
  let runType = "easy", environment = "outdoor", distanceKm, durationSec;
  const rest = [];
  for (const t of tokens) {
    const low = t.toLowerCase();
    if (RUN_TYPE[low]) runType = RUN_TYPE[low];
    else if (t === "실외") environment = "outdoor";
    else if (t === "실내" || t === "러닝머신") environment = "indoor";
    else if (/^[\d.]+km$/i.test(t)) distanceKm = Number(t.replace(/km/i, ""));
    else if (/^\d+:\d{2}(:\d{2})?$/.test(t) && durationSec === undefined) durationSec = toSec(t);
    else rest.push(t);
  }
  if (distanceKm === undefined || durationSec === null || durationSec === undefined) return { error: "러닝은 거리(예 5.2km)와 시간(예 32:10)이 필요해요" };
  let r = takeNumberAfter(rest, "심박"); const avgHeartRate = r.value;
  r = takeNumberAfter(r.rest, "칼로리"); const calories = r.value;
  const memo = r.rest.join(" ") || undefined;
  const avgPaceSec = distanceKm > 0 ? Math.round(durationSec / distanceKm) : undefined;
  return { kind: "running", date, runType, environment, distanceKm, durationSec, avgPaceSec, avgHeartRate, calories, memo };
}

function parseSets(spec) {
  // "60x10x3" | "60x10/60x8" | "60초x3" | "45초"
  const sets = [];
  let measure = "weightReps";
  for (const part of spec.split("/")) {
    const s = part.trim(); if (!s) continue;
    const time = s.match(/^(\d+)초(?:x(\d+))?$/);
    if (time) { measure = "time"; const n = Number(time[2] ?? 1); for (let i = 0; i < n; i += 1) sets.push({ id: randomUUID(), weight: 0, reps: 0, durationSec: Number(time[1]), type: "normal" }); continue; }
    const m = s.match(/^([\d.]+)x(\d+)(?:x(\d+))?$/i);
    if (!m) return { error: `세트 표기를 못 읽었어요: "${s}" (예 60x10x3)` };
    const n = Number(m[3] ?? 1);
    for (let i = 0; i < n; i += 1) sets.push({ id: randomUUID(), weight: Number(m[1]), reps: Number(m[2]), type: "normal" });
  }
  return { sets, measure };
}

function parseGym(date, headTokens, exerciseText, memoText) {
  let bodyPart, durationMin;
  const rest = [];
  for (const t of headTokens) {
    if (BODY[t]) bodyPart = BODY[t];
    else if (/^\d+분$/.test(t)) durationMin = Number(t.replace("분", ""));
    else rest.push(t);
  }
  const r = takeNumberAfter(rest, "심박"); const avgHeartRate = r.value;
  const exercises = [];
  for (const chunk of (exerciseText ?? "").split(",").map((c) => c.trim()).filter(Boolean)) {
    // 마지막 토큰이 세트 표기, 그 앞이 운동명
    const m = chunk.match(/^(.+?)\s+((?:[\d.]+x\d+(?:x\d+)?|\d+초(?:x\d+)?)(?:\/(?:[\d.]+x\d+(?:x\d+)?|\d+초(?:x\d+)?))*)$/i);
    if (!m) { exercises.push({ id: randomUUID(), name: chunk, sets: [], note: undefined }); continue; }
    const parsed = parseSets(m[2]); if (parsed.error) return parsed;
    exercises.push({ id: randomUUID(), name: m[1].trim(), measure: parsed.measure, sets: parsed.sets });
  }
  if (exercises.length === 0) return { error: "헬스는 '|' 뒤에 운동을 하나 이상 적어 주세요 (예 | 벤치프레스 60x10x3)" };
  return { kind: "gym", date, bodyPart, durationMin, avgHeartRate, exercises, memo: (memoText ?? "").trim() || (r.rest.join(" ") || undefined) };
}

function parseActivity(date, tokens) {
  if (tokens.length === 0) return { error: "활동은 종목 이름이 필요해요 (예 활동 테니스 90분)" };
  const activityName = tokens[0]; let durationMin; const rest = [];
  for (const t of tokens.slice(1)) { if (/^\d+분$/.test(t)) durationMin = Number(t.replace("분", "")); else rest.push(t); }
  let r = takeNumberAfter(rest, "심박"); const avgHeartRate = r.value;
  r = takeNumberAfter(r.rest, "칼로리"); const calories = r.value;
  return { kind: "activity", date, activityName, durationMin, avgHeartRate, calories, memo: r.rest.join(" ") || undefined };
}

function parseLine(line) {
  const raw = line.trim(); if (!raw || raw.startsWith("#")) return null;
  const [head, exerciseText, memoText] = raw.split("|");
  const tokens = head.trim().split(/\s+/);
  let date = new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(tokens[0])) date = tokens.shift();
  const kind = tokens.shift();
  if (kind === "러닝") return parseRunning(date, tokens);
  if (kind === "헬스") return parseGym(date, tokens, exerciseText, memoText);
  if (kind === "활동") return parseActivity(date, tokens);
  return { error: `종류를 못 알아봤어요: "${raw}" (러닝 | 헬스 | 활동 중 하나로 시작)` };
}

// ---------- 실행 ----------
const parsed = readFileSync(0, "utf8").split("\n").map(parseLine).filter(Boolean);
const bad = parsed.filter((p) => p.error); if (bad.length) { bad.forEach((b) => console.error("✗ " + b.error)); process.exit(1); }
if (parsed.length === 0) { console.error("입력된 줄이 없어요."); process.exit(1); }

const fmtSec = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
console.error(`\n${parsed.length}건 ${dry ? "(미리보기)" : "저장 예정"}:`);
for (const p of parsed) {
  if (p.kind === "running") console.error(`  ${p.date}  러닝 ${p.runType}/${p.environment}  ${p.distanceKm}km  ${fmtSec(p.durationSec)}  페이스 ${p.avgPaceSec ? fmtSec(p.avgPaceSec) + "/km" : "-"}${p.avgHeartRate ? "  심박 " + p.avgHeartRate : ""}${p.memo ? "  " + p.memo : ""}`);
  else if (p.kind === "gym") console.error(`  ${p.date}  헬스 ${p.bodyPart ?? "-"}${p.durationMin ? " " + p.durationMin + "분" : ""}  ${p.exercises.map((e) => `${e.name}(${e.sets.length}세트)`).join(", ")}${p.memo ? "  " + p.memo : ""}`);
  else console.error(`  ${p.date}  활동 ${p.activityName}${p.durationMin ? " " + p.durationMin + "분" : ""}${p.memo ? "  " + p.memo : ""}`);
}
if (dry) process.exit(0);

const roomName = opt("room") || (await ask("운동방 이름: ", false));
const password = await ask(`"${roomName}" 방 비밀번호 (화면에 안 보임): `, true);
const login = await rpc("workout_room_login", { p_name: roomName, p_password: password });
if (!login || !login.roomId) { console.error("방 이름 또는 비밀번호가 맞지 않아요."); process.exit(1); }
const roomId = login.roomId;

let ok = 0;
for (const p of parsed) {
  if (p.kind === "running") {
    await upsert("workout_running_records", { id: randomUUID(), room_id: roomId, date: p.date, run_type: p.runType, environment: p.environment, distance_km: p.distanceKm, duration_sec: p.durationSec, avg_pace_sec: p.avgPaceSec ?? null, avg_heart_rate: p.avgHeartRate ?? null, avg_cadence: null, calories: p.calories ?? null, intervals: null, memo: p.memo ?? null });
  } else if (p.kind === "gym") {
    await upsert("workout_gym_records", { id: randomUUID(), room_id: roomId, date: p.date, body_part: p.bodyPart ?? null, duration_min: p.durationMin ?? null, calories: null, avg_heart_rate: p.avgHeartRate ?? null, exercises: p.exercises, memo: p.memo ?? null });
  } else {
    await upsert("workout_activity_records", { id: randomUUID(), room_id: roomId, date: p.date, activity_name: p.activityName, duration_min: p.durationMin ?? null, calories: p.calories ?? null, avg_heart_rate: p.avgHeartRate ?? null, memo: p.memo ?? null });
  }
  ok += 1;
}
console.error(`완료: ${ok}건 저장했어요. 운동 기록 화면을 새로고침하면 보여요.`);
