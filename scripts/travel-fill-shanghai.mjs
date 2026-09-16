#!/usr/bin/env node
// 상하이 3박 4일 여행(travel_plans "상하이3박4일-ZMM5QU")에 사용자가 준 일정표(shanghai-itinerary_5.html)를 날짜별로 넣는다.
// 사용법: node scripts/travel-fill-shanghai.mjs [여행 id]
// .env.local 의 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 읽는다(값은 출력하지 않음).
// 하루치는 travel_plans_set_day RPC(그날만 바꿈)로 넣고, 지역만 CN으로 바꾼다. 다른 여행은 손대지 않는다. (2026-09-16)
import { readFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL_ || !KEY) { console.error("환경변수(.env.local)를 찾지 못했어요."); process.exit(1); }
const ID = process.argv[2] || "상하이3박4일-ZMM5QU";
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const STAY = { name: "래디슨 블루 뉴 월드 (인민광장역 도보 2분)", category: "stay", address: "88 Nanjing W Rd, Huangpu, Shanghai", lat: 31.2347, lng: 121.4735 };
const pl = (name, category, lat, lng, memo, address) => ({ id: randomUUID(), name, category, ...(address ? { address } : {}), lat, lng, memo, transitToNext: null });

const DAYS = [
  { date: "2026-11-14", stayMemo: "⏰ 12:10 체크인 — 정식 체크인이 15시라 짐만 맡기고 나오는 게 나아. 20:30 첫날은 여기서 끊기(호텔까지 걸어서 20분 or 지하철 두 정거장).", places: [
    pl("푸동공항 도착 (OZ361 10:05)", "airport", 31.1443, 121.8083, "⏰ 10:05 · 입국심사 + 수하물 약 1시간. 도착층에서 유심/eSIM 개통하고 알리페이 교통카드부터 세팅. 🚄 11:15 자기부상열차 푸동공항→룽양루 7분 20초(편도 50元, 당일 항공권 보여주면 40元) → 🚇 11:35 2호선 룽양루→인민광장 약 25분(짐 많으면 디디 약 60元).", "Pudong International Airport"),
    pl("점심 · 꾸이만롱(桂满陇) 신세계백화점점", "food", 31.2340, 121.4750, "⏰ 12:40 · 동파육이 간판, 2인 150~200元. 대기 길면 길 건너 샤오양셩젠(小杨生煎)으로."),
    pl("난징동루 보행자거리", "outdoor", 31.2360, 121.4790, "⏰ 14:00 · 인민광장에서 와이탄까지 1.6km. M&M's 월드 · 레고 · 팝마트 · 미니소랜드 · 탑토이 · 산리오. 간식은 셴따청(沈大成) 떡."),
    pl("락번드 · 외백다리", "sight", 31.2448, 121.4895, "⏰ 16:00 · 1930년대 건물 구역. 샤메이빌딩 옥상이 와이탄 조감 포인트, 외백다리 위가 인생샷 자리. 🌇 16:55 일몰(11월 중순 약 17시) — 이 시간에 강변으로 내려가면 낮→야경 전환을 한 자리에서."),
    pl("와이탄 강변 산책", "sight", 31.2400, 121.4900, "⏰ 17:20 · 페닌슐라 호텔~와이탄18호 구간. 푸둥 스카이라인 정면. 사람 몰리기 전 사진 골든타임."),
    pl("저녁 · 와이탄 뒷골목", "food", 31.2380, 121.4860, "⏰ 19:00 · 가성비는 난징동루 뒷골목 동북요리(꿔바로우·토마토계란볶음, 2인 100~150元). 분위기는 와이탄3호·18호 다이닝."),
  ]},
  { date: "2026-11-15", stayMemo: "⏰ 08:30 호텔 조식. 🚇 09:20 10호선 인민광장→교통대학 약 15분, 3번 출구가 우캉맨션 방향. 21:30 복귀는 신천지역에서 10호선 3정거장.", places: [
    pl("우캉맨션(武康大楼)", "sight", 31.2069, 121.4363, "⏰ 09:45 · 삼각형 플랫아이언 빌딩. 건너편 횡단보도 코너가 정석 앵글, 오전 광선이 제일 예뻐."),
    pl("우캉루 · 안푸루 산책", "sight", 31.2110, 121.4380, "⏰ 10:15 · 플라타너스 가로수길 따라 편집숍·소품샵. 안푸루(安福路)까지 이어서 걸으면 1시간."),
    pl("카페 브레이크 (%아라비카 or 로컬 로스터리)", "cafe", 31.2120, 121.4400, "⏰ 11:30 · 이 동네 커피 수준이 상하이에서 제일 높아."),
    pl("점심 · 헝산루 일대", "food", 31.2075, 121.4425, "⏰ 12:30 · 우캉루~헝산루 사이 로컬 상하이 요리집. 무거우면 국수 한 그릇. 🚇 13:40 10호선 교통대학→샨시난루 2정거장 5분."),
    pl("화이하이중루 쇼핑 벨트", "outdoor", 31.2180, 121.4620, "⏰ 13:50 · 옷: MASONPRINCE · Basement FG Vintage · ONEMOMENT / 소품·문구: LOOKNOW · 淮海755 2층 / 젠틀몬스터, Songmont, PANE, 향수 관샤(观厦), ZARA 대형몰."),
    pl("양(YANG) 녹차라떼", "cafe", 31.2185, 121.4640, "⏰ 16:30 · 쇼핑 중간 당 충전. 이 동네 시그니처. 🚇 17:10 10호선 샨시난루→신천지 2정거장 5분."),
    pl("신천지(新天地)", "sight", 31.2196, 121.4756, "⏰ 17:30 · 석고문(石库门) 옛 건물 리노베이션 구역. 해질녘 조명 켜질 때가 제일 예뻐."),
    pl("저녁 · 신천지", "food", 31.2190, 121.4760, "⏰ 18:30 · 가격대는 있지만 분위기값. 로컬로 빠지려면 한 블록만 나가면 저렴."),
    pl("티엔즈팡 (선택)", "sight", 31.2102, 121.4667, "⏰ 20:00 · 🚇 9호선 따푸차오역 한 정거장. 좁은 골목 소품샵·바, 21시 넘어서까지. 체력 남으면 추가."),
  ]},
  { date: "2026-11-16", stayMemo: "🚇 08:40 10호선 인민광장→예원 3정거장 8분. 22:00 복귀 — 오늘이 제일 빡세. 내일 짐 싸는 것까지 미리.", places: [
    pl("예원(豫园)", "sight", 31.2272, 121.4921, "⏰ 09:00 · 개장 08:45, 입장 40元. 명대 정원, 한 바퀴 1시간. 개장 직후가 사람이 제일 적어."),
    pl("예원상성 · 성황묘", "outdoor", 31.2265, 121.4930, "⏰ 10:15 · 정원 밖 상가. 기념품·주전부리. 관광지 가격이라 흥정 감안."),
    pl("난샹만터우뎬(南翔馒头店)", "food", 31.2270, 121.4925, "⏰ 11:00 · 100년 넘은 샤오롱바오 본점. 1층 테이크아웃은 줄 김, 2층 착석이 편함. 11시 전에. 🚇 12:40 14호선→2호선 환승 1번, 약 15분 루자주이로."),
    pl("상하이타워 118층 전망대", "sight", 31.2336, 121.5055, "⏰ 13:10 · 미리 예약 필수(트립닷컴). 시야 흐리면 동방명주로 대체. 여권 실물 지참."),
    pl("루자주이 IFC몰 · 커피", "outdoor", 31.2385, 121.5040, "⏰ 15:00 · 야경 시간까지 실내에서 체력 보충. 시간 남으면 상하이 과학기술관도 근처."),
    pl("황푸강 유람선 (십육포 or 루자주이 부두)", "sight", 31.2290, 121.4960, "⏰ 17:30 · 🌇 16:40 일몰 맞춰 부두로 이동, 조명 켜지기 직전 도착. 약 50분, 120~150元. 조명 켜진 뒤 편을 예약해야 와이탄·푸둥 양쪽을 다 봐."),
    pl("저녁 (부두 근처 or 강 건너) · 훠궈 추천", "food", 31.2320, 121.4950, "⏰ 19:00 · 훠궈 한번 갈 거면 오늘이 딱."),
    pl("북와이탄(국제객운)", "sight", 31.2475, 121.4985, "⏰ 20:30 · 🚇 12호선. 와이탄 정면 뷰의 진짜 명당 — 와이탄 건물군과 루자주이 마천루를 한 프레임에, 사람은 훨씬 적어."),
  ]},
  { date: "2026-11-17", stayMemo: "⏰ 08:30 체크아웃·짐 보관(프런트에 캐리어 맡기고 몸만) → 12:40 짐 회수. 화요일이라 상하이박물관 동관 휴관 → 호텔 도보권 코스.", places: [
    pl("장위엔(张园)", "sight", 31.2270, 121.4560, "⏰ 09:00 · 난징시루역 바로 옆. 석고문 저택 구역, 신천지보다 사람이 적어 사진이 잘 나와."),
    pl("정안사(静安寺)", "sight", 31.2246, 121.4455, "⏰ 10:00 · 금빛 지붕 사찰, 입장 50元. 유리 마천루에 둘러싸인 대비. 30분이면 충분."),
    pl("난징시루 마무리 쇼핑 (지우광·케리센터)", "outdoor", 31.2230, 121.4470, "⏰ 11:00 · 못 산 기념품·간식(월병·차·과자) 정리."),
    pl("점심 · 몰 푸드코트", "food", 31.2235, 121.4475, "⏰ 12:00 · 가볍게. 시간 여유 두는 게 중요한 구간."),
    pl("푸동공항 · 인천행 OZ366 16:20", "airport", 31.1443, 121.8083, "🚇 13:00 2호선 인민광장→룽양루 25분 + 🚄 자기부상 7분 ≈ 45분(짐 많으면 디디 직행 약 50분, 180~250元). ⏰ 14:00 공항 도착 — 출발 2시간 20분 전, 택스리펀 받으려면 이 정도 필요. 16:20 출발.", "Pudong International Airport"),
  ]},
];

async function main() {
  const res = await fetch(`${URL_}/rest/v1/travel_plans?id=eq.${encodeURIComponent(ID)}&select=id,title,start_date,end_date,days,region`, { headers: H });
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length !== 1) { console.error("여행을 찾지 못했어요:", ID, res.status); process.exit(1); }
  const plan = rows[0];
  console.log(`대상: ${plan.title} (${plan.start_date}~${plan.end_date}) days=${Array.isArray(plan.days) ? plan.days.length : "?"} region=${plan.region}`);
  if (!Array.isArray(plan.days) || plan.days.length !== DAYS.length) { console.error("날짜 수가 4일이 아니에요. 중단."); process.exit(1); }
  for (let i = 0; i < DAYS.length; i += 1) {
    if (plan.days[i]?.date !== DAYS[i].date) { console.error(`${i + 1}일차 날짜가 달라요: ${plan.days[i]?.date} vs ${DAYS[i].date}. 중단.`); process.exit(1); }
    const stay = { id: randomUUID(), ...STAY, isStay: true, memo: DAYS[i].stayMemo, transitToNext: null };
    const day = { date: DAYS[i].date, stayInRoute: true, places: [stay, ...DAYS[i].places] };
    const r = await fetch(`${URL_}/rest/v1/rpc/travel_plans_set_day`, { method: "POST", headers: H, body: JSON.stringify({ p_id: ID, p_index: i, p_day: day }) });
    if (!r.ok) { console.error(`${i + 1}일차 저장 실패:`, r.status, (await r.text()).slice(0, 200)); process.exit(1); }
    console.log(`DAY ${String(i + 1).padStart(2, "0")} ${DAYS[i].date} 저장 · 숙소 1 + 장소 ${DAYS[i].places.length}곳`);
  }
  const r2 = await fetch(`${URL_}/rest/v1/travel_plans?id=eq.${encodeURIComponent(ID)}`, { method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify({ region: "CN", updated_at: new Date().toISOString() }) });
  console.log("지역 → CN:", r2.ok ? "완료" : `실패 ${r2.status}`);
}
main().catch((e) => { console.error("실패:", e.message); process.exit(1); });
