/**
 * 63OPEN 밴드 공지용 카드 묶음을 HTML로 뽑는 명령.
 *
 * 형식은 2025년 공지를 그대로 따른다 — 번호 붙은 섹션 카드를 한 장씩 넘겨 보는 구성.
 * 색만 2026년 코트(아식스 테니스 아카데미)에 맞춰 보라·파랑으로 바꿨다.
 *
 * 왜 만들었나 — 선수 30명과 대진·일정을 손으로 옮겨 적으면 오타가 난다.
 * 이 명령은 app/tennis/tournament 의 실제 대회 데이터를 그대로 읽어 그리므로
 * 앱에서 팀 배정을 고치고 다시 돌리면 공지도 같이 바뀐다.
 *
 * 쓰는 법
 *   npx tsx scripts/tennis-63-poster.mts            → ~/Downloads 에 HTML 생성
 *   npx tsx scripts/tennis-63-poster.mts <파일경로>  → 원하는 곳에 생성
 */
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { OPEN_63 } from "../app/tennis/tournament/data";
import { DOUBLE_ELIM_8 } from "../app/tennis/tournament/template";
import { PAIR_ROTATION } from "../app/tennis/tournament/types";
import type { TemplateMatch } from "../app/tennis/tournament/types";
import { scheduleBlocks } from "../app/tennis/tournament/resolve";
import { GENDER_LABEL } from "../app/tennis/types";

const E = OPEN_63;
// 대회 페이지 주소와 그 QR. QR 그림은 scripts/assets 에 두고 그대로 끼워 넣는다
// (주소가 바뀌면 그 파일 맨 위 주석대로 다시 만든다)
const EVENT_URL = "https://www.hwang-lab.kr/tennis/63open-2026-10-31";
const QR_SVG = readFileSync(new URL("./assets/63open-qr.svg", import.meta.url), "utf8").replace(
  /^<!--[\s\S]*?-->\s*/,
  "",
);

const OUT = process.argv[2] ?? join(homedir(), "Downloads", "63OPEN-2026-공지.html");

// 포스터에 적는 전체 시간대. 개회식은 beforeNote, 마무리는 afterNote 에 적혀 있다.
const POSTER_TIME = "12:00~18:00";
const WEEKDAY_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const COURTS = ["A", "B", "C", "D"] as const;

// 타임별 시각은 앱과 똑같은 계산을 쓴다 (휴식 시간까지 반영된다)
const SCHEDULE = scheduleBlocks(E);

// 표지 아래쪽 장소 글자는 오른쪽 끝(805)에 맞춘다. 이름 길이가 달라져도 잘리지 않게
// 시작 위치를 뒤에서 계산한다 (한글 한 글자는 글자 크기 23px, 공백은 11px쯤 차지한다).
const PLACE_WIDTH = [...E.place].reduce((w, ch) => w + (ch === " " ? 11 : /[\x21-\x7e]/.test(ch) ? 12 : 23), 0);
const PLACE_X = Math.max(430, 805 - PLACE_WIDTH - 36);

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
const genderOf = (name: string) => E.roster.find((r) => r.name === name)?.gender;
const nameCell = (name: string) => {
  const g = genderOf(name);
  return `${esc(name)}${g ? `<i class="g ${g}">${GENDER_LABEL[g]}</i>` : ""}`;
};

const men = E.roster.filter((r) => r.gender === "M").length;
const women = E.roster.filter((r) => r.gender === "F").length;
const assigned = E.teams.reduce((n, t) => n + t.players.filter((p) => p.name.trim()).length, 0);
const realMatches = DOUBLE_ELIM_8;

/** 카드 한 장 — 보라 바탕 위 흰 종이, 머리(번호·제목) + 내용 + 꼬리 안내 */
function card(no: string, title: string, sub: string, body: string, foot: string) {
  return `<div class="card"><div class="paper">
    <div class="head">
      <div class="rule"><span></span><b>${E.date.slice(0, 4)} 63 open</b><span></span></div>
      <svg class="badge" viewBox="0 0 92 92" aria-hidden="true">
        <circle cx="46" cy="46" r="46" fill="#5b4f85"/>
        <path d="M18 9.5 Q -6 46 18 82.5" stroke="#fff" stroke-width="3.2" fill="none" opacity=".9"/>
        <path d="M74 9.5 Q 98 46 74 82.5" stroke="#fff" stroke-width="3.2" fill="none" opacity=".9"/>
        <text x="46" y="58" text-anchor="middle" fill="#fff" font-size="30" font-weight="900" font-family="Noto Sans KR">${no}</text>
      </svg>
      <h1>${title}</h1>
      <p class="sub">${sub}</p>
    </div>
    <div class="content">${body}</div>
    <p class="foot">${foot}</p>
  </div></div>`;
}

/* ===== 01 팀편성 — 2025처럼 시드가 세로, 팀이 가로. 8팀이라 4팀씩 두 묶음 ===== */
function teamBlock(teams: typeof E.teams) {
  const heads = teams.map((t) => `<th>TEAM. ${t.seed}</th>`).join("");
  const rows = [1, 2, 3, 4]
    .map((seed) => {
      const cells = teams
        .map((team) => {
          const player = team.players.find((p) => p.seed === seed);
          if (!player?.name) {
            return `<td class="empty">${team.players.length === 3 ? "3번이 겸함" : "미정"}</td>`;
          }
          return `<td>${nameCell(player.name)}</td>`;
        })
        .join("");
      return `<tr><th class="slot">${seed}번시드</th>${cells}</tr>`;
    })
    .join("");
  return `<table class="teams"><thead><tr><th class="slot">시드</th>${heads}</tr></thead><tbody>${rows}</tbody></table>`;
}

/* ===== 04 대진 순서 — 타임마다 어느 코트에서 무슨 경기인지 ===== */
const slotLabel = (s: TemplateMatch["a"]) =>
  s.kind === "seed" ? `${s.seed}팀` : s.kind === "winner" ? `${s.of}경기 승자` : `${s.of}경기 패자`;

function drawRows() {
  return SCHEDULE.map((b) => {
    const time = b.time.split(" — ")[0];
    const cells = COURTS.map((court) => {
      const m = DOUBLE_ELIM_8.find((x) => x.block === b.no && x.court === court);
      if (!m) return `<td class="empty">—</td>`;
      return `<td><b>${esc(m.label)}</b><span class="note">${slotLabel(m.a)} vs ${slotLabel(m.b)}</span></td>`;
    }).join("");
    return `<tr><th class="slot">${b.no}타임<span class="note">${time}</span></th>${cells}</tr>`;
  }).join("");
}

/* ===== 05 대회일정 ===== */
type Row = { what: string; when: string; lead: boolean };
const rows: Row[] = [{ what: "개회식 · 몸풀기", when: "12:00~13:00", lead: true }];
let prevEnd = "";
for (const b of SCHEDULE) {
  const [start, end] = b.time.split(" — ");
  if (b.breakBefore) rows.push({ what: "☕ 다 같이 휴식", when: `${prevEnd}~${start}`, lead: false });
  rows.push({ what: `${b.no}타임 · ${b.title}`, when: `${start}~${end}`, lead: false });
  prevEnd = end;
}
rows.push({ what: "시상식 · 폐회식", when: `${SCHEDULE[SCHEDULE.length - 1].time.split(" — ")[1]}~${POSTER_TIME.split("~")[1]}`, lead: true });

const scheduleRows = rows
  .map(
    ({ what, when, lead }) =>
      `<tr class="${lead ? "lead" : ""}"><th>${esc(what)}</th><td class="time">${esc(when)}</td></tr>`,
  )
  .join("");

const cards = [
  /* ---------- 표지 ---------- */
  `<div class="card cover">
    <svg viewBox="0 0 860 1100" preserveAspectRatio="xMidYMid slice">
      <rect class="bg" width="860" height="1100"/>
      <polygon class="corner" points="0,0 846,0 0,468"/>
      <line class="ln" x1="-20" y1="479" x2="880" y2="-21" stroke-width="16"/>
      <line class="ln" x1="118" y1="-12" x2="-4" y2="414" stroke-width="9"/>
      <line class="ln" x1="-20" y1="809" x2="880" y2="330" stroke-width="16"/>
      <line class="ln" x1="658" y1="450" x2="872" y2="777" stroke-width="15"/>
      <text class="ser" x="182" y="352" font-size="72" transform="rotate(-29 182 352)"
            style="filter:drop-shadow(3px 4px 5px rgba(0,0,0,.2))">${E.date.slice(0, 4)}</text>
      <text class="ser" x="128" y="622" font-size="196" textLength="684" lengthAdjust="spacingAndGlyphs"
            transform="rotate(-29 128 622)" style="filter:drop-shadow(5px 7px 9px rgba(0,0,0,.24))">63 open</text>
      <g transform="translate(300 900)">
        <circle cx="31" cy="-16" r="31" fill="#ffe24a"/>
        <path d="M14 -42 Q -6 -16 14 10" stroke="#fff" stroke-width="3" fill="none"/>
        <path d="M48 -42 Q 68 -16 48 10" stroke="#fff" stroke-width="3" fill="none"/>
        <text class="ser" x="78" y="2" font-size="52">63 Tennis Club</text>
      </g>
      <g transform="translate(55 1002)">
        <circle class="mk" cx="13" cy="-8" r="11"/><path class="mk" d="M13 -14v6l4 2.5" stroke-linecap="round"/>
        <text class="mt" x="38" y="0">${E.date.replace(/-/g, ".")}(${WEEKDAY_EN[new Date(E.date).getDay()]}) ${POSTER_TIME}</text>
      </g>
      <g transform="translate(${PLACE_X} 1002)">
        <path class="mk" d="M13 3s8.5-7.4 8.5-13.4a8.5 8.5 0 1 0-17 0C4.5 -4.4 13 3 13 3z"/>
        <circle cx="13" cy="-11" r="3.2" fill="#cfe0ea"/>
        <text class="mt" x="36" y="0">${esc(E.place)}</text>
      </g>
    </svg>
  </div>`,

  card(
    "01",
    "대회일정",
    `${E.date.replace(/-/g, ". ")} (토) · ${POSTER_TIME}`,
    `<div class="sheet"><table class="when">${scheduleRows}</table></div>`,
    `한 타임 ${E.minutesPerMatch}분 (경기 30분 + 정리·이동 10분). 그랜드 파이널 앞에 30분 쉽니다.`,
  ),

  card(
    "02",
    "대회 방식",
    `더블 엘리미네이션 + 순위결정전 · 총 ${realMatches.length}경기`,
    `<div class="sheet"><ul class="big">
       <li><b>두 번 져야 탈락</b>이에요. 한 번 지면 패자조로 내려가 다시 올라올 수 있어요.</li>
       <li>1라운드는 <b>8팀 전원</b>이 뜁니다. 이긴 팀은 승자조, 진 팀은 패자조로 갈려요.</li>
       <li>승자조 1위와 패자조 1위가 <b>그랜드 파이널</b>에서 만납니다.</li>
       <li>그랜드 파이널 <b>한 판으로 1·2위</b>가 정해집니다. 다시 붙는 재경기는 없어요.</li>
       <li><b>3위는 패자조 결승에서 진 팀, 4위는 패자조 준결승에서 진 팀</b>이에요.</li>
       <li>5-6위전 · 7-8위전이 따로 있어 <b>8팀 순위가 모두 정해집니다</b>.</li>
     </ul></div>`,
    `한 타임 ${E.minutesPerMatch}분 · 코트 ${E.courts}면을 동시에 씁니다. 경기는 30분쯤 걸리고, 남는 시간은 코트 정리·이동 여유예요.`,
  ),

  card(
    "03",
    "경기 규칙",
    `${E.gamesToWin}게임 선취 · 4게임마다 선수 교체`,
    `<div class="sheet"><ul class="big">
       <li><b>${E.gamesToWin}게임 선취</b>로 한 경기가 끝나요.</li>
       <li>${E.gamesToWin - 1}:${E.gamesToWin - 1}이 되면 <b>7점 타이브레이크</b>로 가릅니다.</li>
     </ul></div>
     <div class="sheet">
       <h3>선수 교체 — 4게임마다 짝이 바뀝니다</h3>
       <table class="pairs">
         ${PAIR_ROTATION.map(
           (r) =>
             `<tr><th>${esc(r.games)}</th><td><b>페어 ${r.key}</b><span class="note">팀 내 ${r.seeds.join("번 + ")}번</span></td></tr>`,
         ).join("")}
       </table>
     </div>`,
    "2:6으로 끝나면 총 8게임이라 페어 A·B까지만 뜁니다. 팀원 모두가 코트에 서도록 짠 방식이에요.",
  ),

  card(
    "04",
    "팀편성",
    `4인 1팀 ${E.teams.length}개 팀 · 총 ${assigned}명 (남 ${men} · 여 ${women})`,
    `<div class="sheet">${teamBlock(E.teams.slice(0, 4))}</div>
     <div class="sheet">${teamBlock(E.teams.slice(4))}</div>`,
    "7·8팀은 3명이라 3번 시드가 4번 자리까지 맡습니다.",
  ),

  card(
    "05",
    "대진 순서",
    `타임마다 ${E.courts}코트를 동시에 씁니다`,
    `<div class="sheet"><table class="draw">
       <thead><tr><th class="slot">타임</th>${COURTS.map((c) => `<th>${c}코트</th>`).join("")}</tr></thead>
       <tbody>${drawRows()}</tbody>
     </table></div>`,
    "빈 코트는 그 타임에 남은 팀이 적어서예요. 더블 엘리미네이션은 뒤로 갈수록 경기가 줄어듭니다.",
  ),

  card(
    "06",
    "실시간 대진표",
    "폰으로 찍으면 바로 열려요",
    `<div class="sheet qrbox">
       ${QR_SVG}
       <p class="url">${esc(EVENT_URL.replace("https://", ""))}</p>
     </div>`,
    "대회 당일 점수가 들어오는 대로 대진표와 순위가 채워져요. 우리 팀이 몇 타임에 어느 코트인지도 여기서 봅니다.",
  ),
];

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
  :root { --purple:#5b4f85; --blue:#5287a3; --ink:#2a2740; --sub:#7b7691; --line:#e8e5f0; --band:#f6f5fa; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#ddd; font-family:"Noto Sans KR",sans-serif; color:var(--ink); }

  /* 카드 한 장 = 밴드에 올리는 그림 한 장. 보라 바탕 위에 흰 종이 한 장 (2025 공지 구조) */
  .card { width:1080px; height:1350px; background:var(--purple); overflow:hidden; padding:40px; }
  .paper { width:100%; height:100%; background:#fff; border-radius:22px;
           padding:44px 52px 38px; display:flex; flex-direction:column; align-items:center; }
  .card.cover { padding:0; }
  .card.cover svg { width:100%; height:100%; }
  .cover .bg { fill:var(--purple); } .cover .corner { fill:var(--blue); }
  .cover .ln { stroke:#fff; stroke-linecap:butt; }
  .cover .mk { stroke:#cfe0ea; stroke-width:1.6; fill:none; }
  .cover .ser { fill:#fff; font-family:"Playfair Display",Georgia,serif; font-weight:500; }
  .cover .mt { fill:#fff; font-size:23px; }

  .head { text-align:center; width:100%; }
  .rule { display:flex; align-items:center; gap:20px; margin-bottom:26px; }
  .rule span { flex:1; height:1px; background:var(--line); }
  .rule b { font-family:"Playfair Display",Georgia,serif; font-weight:500; font-size:29px;
            letter-spacing:.02em; color:var(--sub); }
  .badge { width:88px; height:88px; }
  h1 { font-size:66px; font-weight:900; letter-spacing:-.02em; margin:10px 0 8px; }
  .sub { font-size:26px; font-weight:700; color:var(--purple); margin-bottom:26px;
         word-break:keep-all; text-wrap:balance; }

  /* 종이 안에서는 선을 더 긋지 않는다 — 옅은 바탕 띠로만 묶는다 */
  .content { width:100%; flex:1; display:flex; flex-direction:column; justify-content:center; gap:16px; }
  .sheet { width:100%; background:var(--band); border-radius:16px; padding:26px 28px; }
  h3 { font-size:22px; font-weight:900; color:var(--purple); margin-bottom:14px; word-break:keep-all; }

  table { width:100%; border-collapse:collapse; }
  th, td { padding:12px 9px; font-size:25px; font-weight:700; text-align:center; }
  .slot { font-size:20px; font-weight:800; color:var(--sub); white-space:nowrap; }
  .g { font-style:normal; font-size:16px; font-weight:900; margin-left:5px; }
  .g.M { color:#1d4ed8; } .g.F { color:#be123c; }
  .empty { font-size:19px; font-weight:700; color:#aaa5bd; }
  .note { display:block; font-size:16px; font-weight:500; color:var(--sub); margin-top:4px;
          word-break:keep-all; line-height:1.4; }

  .teams thead th { font-size:25px; font-weight:900; color:#fff; background:var(--purple);
                    border-radius:10px; padding:11px 8px; }
  .teams thead th.slot { background:none; color:var(--sub); }
  .teams tbody tr + tr td, .teams tbody tr + tr th { border-top:1px solid var(--line); }

  .draw { table-layout:fixed; }
  .draw thead th { font-size:22px; font-weight:900; color:var(--purple); border-bottom:2px solid var(--line); }
  .draw tbody td, .draw tbody th { font-size:21px; padding:12px 6px; word-break:keep-all;
                                  border-bottom:1px solid var(--line); }
  .draw tbody tr:last-child td, .draw tbody tr:last-child th { border-bottom:none; }

  .pairs th { text-align:left; font-size:24px; color:var(--purple); width:40%; }
  .pairs td { text-align:left; word-break:keep-all; }
  .pairs tr + tr th, .pairs tr + tr td { border-top:1px solid var(--line); }

  .qrbox { display:flex; flex-direction:column; align-items:center; gap:18px; padding:34px 28px; }
  /* QR 둘레의 흰 여백은 장식이 아니라 필수다. 좁으면 카메라가 인식하지 못한다 */
  .qr { width:360px; height:360px; display:block; background:#fff; padding:26px;
        border-radius:14px; box-sizing:content-box; }
  .url { font-size:23px; font-weight:800; color:var(--purple); word-break:break-all; text-align:center; }

  .when { width:94%; }
  .when th { text-align:left; font-size:24px; font-weight:700; padding:15px 10px; word-break:keep-all; }
  .when td.time { text-align:right; font-size:24px; font-weight:800; color:var(--purple);
                  font-variant-numeric:tabular-nums; white-space:nowrap; }
  .when tr.lead th { font-size:27px; font-weight:900; }
  .when tr.lead td.time { font-size:26px; }
  .when tr + tr th, .when tr + tr td { border-top:1px solid var(--line); }

  ul.big { list-style:none; }
  ul.big li { position:relative; padding-left:30px; font-size:26px; font-weight:500;
              line-height:1.62; word-break:keep-all; }
  ul.big li + li { margin-top:16px; }
  ul.big li::before { content:""; position:absolute; left:6px; top:17px; width:9px; height:9px;
                      border-radius:50%; background:var(--purple); }
  ul.big b { font-weight:900; }

  /* ── 한 장으로 이어 붙일 때(body.one): 카드가 내용만큼만 높아지고 사이 여백도 좁아진다.
        낱장으로 뽑을 때는 이 규칙이 안 걸려서 1080x1350 그대로다. ── */
  body.one .card { height:auto; padding:18px 40px; }
  body.one .card + .card { padding-top:0; }
  body.one .card:last-child { padding-bottom:40px; }
  body.one .card.cover { height:1350px; padding:0; }
  body.one .paper { height:auto; padding:34px 52px 28px; }
  body.one .head .rule { margin-bottom:20px; }
  body.one h1 { font-size:58px; margin:8px 0 6px; }
  body.one .badge { width:76px; height:76px; }
  body.one .sub { margin-bottom:20px; }
  body.one .content { gap:14px; }
  body.one .foot { padding-top:18px; }

  /* 한글은 기본값이면 아무 데서나 줄이 바뀌어 "봅 / 니다"처럼 낱말이 쪼개진다.
     keep-all 로 낱말을 지키고, balance 로 두 줄 길이를 비슷하게 맞춘다. */
  .foot { width:92%; margin:0 auto; padding-top:22px; font-size:20px; font-weight:500;
          line-height:1.55; color:var(--sub); text-align:center;
          word-break:keep-all; text-wrap:balance; }
</style>
</head>
<body>
${cards.join("\n")}
</body>
</html>
`;

writeFileSync(OUT, html, "utf8");
console.log(`만들었어요: ${OUT}`);
console.log(`  카드 ${cards.length}장 · ${E.teams.length}팀 ${assigned}명 (남 ${men} · 여 ${women}) · ${SCHEDULE.length}타임`);
