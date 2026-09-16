"use client";

// 포트폴리오 "토이 프로젝트" 줄의 오른쪽 미리보기에 놓이는 작은 장면들.
//
// 첫 화면(components/home/ToolDemo.tsx)에 이미 다섯 장면이 있는데,
// 나머지 열 줄은 스크린샷이나 아이콘만 있어서 심심했다. 그래서 같은 말투로 열 개를 더 만들었다.
// - 나타나는 느낌(fadeUp·pop)은 ToolDemo에서 가져다 쓴다. 두 벌로 갈라지지 않게.
// - 한 장면은 3~4초 안에 한 번 흐르고 마지막 모습에서 멈춘다(무한 반복 없음).
// - 나중에 나타나는 것도 자리는 처음부터 차지한다(opacity 0). 그래야 줄 높이가 안 흔들린다.
// - '움직임 줄이기' 설정이면 ToyPreview의 프레임이 전부 마지막 모습으로 건너뛴다.
//
// 값은 전부 지어낸 예시다. 실제 사람 이름·기록이 아니다.

import type { CSSProperties, ReactElement } from "react";
import styled, { keyframes, type DefaultTheme } from "styled-components";
import { appear, appearBase, pop } from "@/components/home/ToolDemo";

export type ToyScene =
  | "my"
  | "place"
  | "accountBook"
  | "daily"
  | "workout"
  | "inbody"
  | "game"
  | "schedule"
  | "habit"
  | "diet"
  | "travel";

/* ===== 색 이름 한 벌 ===== */
type Tone = "primary" | "success" | "warning" | "danger" | "sub";

function toneColor(t: Tone, theme: DefaultTheme) {
  if (t === "success") return theme.semantic.success;
  if (t === "warning") return theme.colors.amber500;
  if (t === "danger") return theme.semantic.danger;
  if (t === "sub") return theme.colors.gray400;
  return theme.semantic.primary;
}

function toneBg(t: Tone, theme: DefaultTheme) {
  if (t === "success") return theme.semantic.successBg;
  if (t === "warning") return theme.colors.amber50;
  if (t === "danger") return theme.semantic.dangerBg;
  if (t === "sub") return theme.semantic.bg;
  return theme.semantic.primaryLight;
}

/* ===== 움직임 ===== */
const growX = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;
/* 막대가 한 번 자란 뒤 한 번 더 살짝 밀려 올라간다(가계부 이번 달 합계) */
const growNudge = keyframes`
  0% { transform: scaleX(0); }
  55% { transform: scaleX(0.82); }
  70% { transform: scaleX(0.82); }
  100% { transform: scaleX(1); }
`;
const growY = keyframes`
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
`;
const drop = keyframes`
  from { opacity: 0; transform: translateY(-14px); }
  70% { transform: translateY(3px); }
  to { opacity: 1; transform: translateY(0); }
`;
const drawRing = keyframes`
  from { stroke-dashoffset: 100.5; }
  to { stroke-dashoffset: var(--ring-to); }
`;
const drawLine = keyframes`
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
`;
const spin = keyframes`
  from { transform: rotate(0deg) scale(0.9); }
  70% { transform: rotate(1020deg) scale(1.06); }
  to { transform: rotate(1080deg) scale(1); }
`;
const roll = keyframes`
  from { transform: translateY(0); }
  to { transform: translateY(calc(-1.25em * var(--roll-n))); }
`;
const typing = keyframes`
  from { width: 0; }
  to { width: var(--type-w); }
`;

/* ===== 공통 뼈대 ===== */
/** 장면 한 칸. ToyPreview 프레임 안을 꽉 채우고 내용은 세로 가운데에 둔다. */
export const StScene = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.9rem 1rem;
`;

/** 알약 모양 꼬리표. 늦게 떠오른다 */
const StChip = styled.span<{ $delay: number; $tone?: Tone }>`
  ${appear};
  align-self: flex-start;
  max-width: 100%;
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${({ $tone = "primary", theme }) => toneColor($tone, theme)};
  background: ${({ $tone = "primary", theme }) => toneBg($tone, theme)};
`;

/** 위에서 툭 떨어지는 꼬리표 */
const StDropChip = styled(StChip)`
  animation-name: ${drop};
  animation-duration: 0.55s;
`;

/** 가로 막대: 껍데기 + 자라는 속 */
const StTrack = styled.div`
  position: relative;
  height: 0.5rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.semantic.border};
  overflow: hidden;
`;
const StFill = styled.div<{ $w: number; $delay: number; $tone?: Tone; $nudge?: boolean }>`
  height: 100%;
  width: ${({ $w }) => $w}%;
  border-radius: inherit;
  transform: scaleX(0);
  transform-origin: left;
  background: ${({ $tone = "primary", theme }) => toneColor($tone, theme)};
  animation: ${({ $nudge }) => ($nudge ? growNudge : growX)}
    ${({ $nudge }) => ($nudge ? "2.6s" : "0.7s")} cubic-bezier(0.22, 0.61, 0.36, 1)
    ${({ $delay }) => $delay}s forwards;
`;

/** 작은 동그라미 하나 (연속 기록 점) */
const StDot = styled.span<{ $delay: number; $tone?: Tone }>`
  width: 1.05rem;
  height: 1.05rem;
  border-radius: 50%;
  background: ${({ theme }) => theme.semantic.bg};
  border: 1px solid ${({ theme }) => theme.semantic.border};
  position: relative;

  &::after {
    content: "";
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    background: ${({ $tone = "primary", theme }) => toneColor($tone, theme)};
    opacity: 0;
    animation: ${pop} 0.3s ease-out ${({ $delay }) => $delay}s forwards;
  }
`;

/** 도넛 게이지. r=16 → 둘레 100.5라 퍼센트를 거의 그대로 쓴다 */
const RING_C = 100.5;

const StRing = styled.svg<{ $tone: Tone; $delay: number }>`
  width: 100%;
  height: auto;
  transform: rotate(-90deg);

  circle {
    fill: none;
    stroke-width: 4.5;
  }
  .track {
    stroke: ${({ theme }) => theme.semantic.border};
  }
  .bar {
    stroke: ${({ $tone, theme }) => toneColor($tone, theme)};
    stroke-linecap: round;
    stroke-dasharray: ${RING_C};
    stroke-dashoffset: ${RING_C};
    animation: ${drawRing} 1.1s cubic-bezier(0.22, 0.61, 0.36, 1)
      ${({ $delay }) => $delay}s forwards;
  }
`;

function Ring({ pct, tone, delay }: { pct: number; tone: Tone; delay: number }) {
  const to = { "--ring-to": String(RING_C * (1 - pct / 100)) } as CSSProperties;
  return (
    <StRing viewBox="0 0 40 40" $tone={tone} $delay={delay} style={to}>
      <circle className="track" cx="20" cy="20" r="16" />
      <circle className="bar" cx="20" cy="20" r="16" />
    </StRing>
  );
}

/** 숫자가 또르르 올라가며 마지막 값에서 멈춘다 */
const StCount = styled.span<{ $delay: number }>`
  display: inline-block;
  height: 1.25em;
  line-height: 1.25em;
  overflow: hidden;
  vertical-align: bottom;

  > span {
    display: block;
    animation: ${roll} 1.2s steps(var(--roll-n)) ${({ $delay }) => $delay}s forwards;
  }
  em {
    display: block;
    font-style: normal;
  }
`;

function Count({ values, delay }: { values: string[]; delay: number }) {
  const n = { "--roll-n": String(values.length - 1) } as CSSProperties;
  return (
    <StCount $delay={delay} style={n}>
      <span>
        {values.map((v) => (
          <em key={v}>{v}</em>
        ))}
      </span>
    </StCount>
  );
}

/** 뒤늦게 한 줄 떠오르는 설명 */
const StCaption = styled.p<{ $delay: number }>`
  ${appear};
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: ${({ theme }) => theme.semantic.subText};
`;

/* ===== 1. 내 서비스 요약: 게이지 셋이 차고 다음 일정이 툭 ===== */
const MY_GAUGES = [
  { pct: 70, value: "70%", label: "습관 달성", tone: "primary" as Tone },
  { pct: 60, value: "12일", label: "연속 기록", tone: "success" as Tone },
  { pct: 45, value: "6시간", label: "이번 주 야근", tone: "warning" as Tone },
];

function MyScene() {
  return (
    <StScene>
      <StGaugeRow>
        {MY_GAUGES.map((g, i) => (
          <StGauge key={g.label}>
            <div className="ring">
              <Ring pct={g.pct} tone={g.tone} delay={0.3 + i * 0.3} />
              <b>{g.value}</b>
            </div>
            <span>{g.label}</span>
          </StGauge>
        ))}
      </StGaugeRow>
      <StDropChip $delay={2.4}>📅 다음 모임 · 9월 20일 토요일</StDropChip>
    </StScene>
  );
}

const StGaugeRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
`;
const StGauge = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.28rem;

  .ring {
    position: relative;
    width: 3.2rem;
    max-width: 100%;
    display: grid;
    place-items: center;
  }
  .ring > b {
    position: absolute;
    font-size: 0.66rem;
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.text};
  }
  > span {
    font-size: 0.65rem;
    color: ${({ theme }) => theme.semantic.subText};
    text-align: center;
  }
`;

/* ===== 2. 장소 잡기: 핀이 떨어지고 후보에 표가 쌓인다 ===== */
const PLACE_CANDIDATES = [
  { name: "합정 삼겹살집", votes: 4, w: 55, win: false },
  { name: "성수 국밥집", votes: 3, w: 42, win: false },
  { name: "강남 파스타집", votes: 7, w: 92, win: true },
];

function PlaceScene() {
  return (
    <StScene>
      <StPin $delay={0.25} aria-hidden="true">
        📍
      </StPin>
      {PLACE_CANDIDATES.map((c, i) => (
        <StVoteRow key={c.name} $delay={0.9 + i * 0.3}>
          <span className="name">{c.name}</span>
          <StTrack>
            <StFill
              $w={c.w}
              $delay={1.6 + i * 0.25}
              $tone={c.win ? "primary" : "sub"}
            />
          </StTrack>
          <b className={c.win ? "win" : undefined}>
            {c.win ? "✓ " : ""}
            {c.votes}표
          </b>
        </StVoteRow>
      ))}
    </StScene>
  );
}

const StPin = styled.span<{ $delay: number }>`
  align-self: center;
  font-size: 1.35rem;
  line-height: 1;
  opacity: 0;
  animation: ${drop} 0.6s cubic-bezier(0.34, 1.3, 0.64, 1)
    ${({ $delay }) => $delay}s forwards;
`;
const StVoteRow = styled.div<{ $delay: number }>`
  ${appear};
  display: grid;
  /* 표 수 칸은 고정 폭 — 'auto'면 ✓가 붙는 줄만 칸이 넓어져 막대 시작점이 어긋난다 (2026-09-15) */
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr) 3.4rem;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.semantic.text};

  > b {
    text-align: right;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  b {
    font-size: 0.7rem;
    color: ${({ theme }) => theme.semantic.subText};
  }
  b.win {
    color: ${({ theme }) => theme.semantic.primary};
  }
`;

/* ===== 3. 가계부: 한 줄 적으면 분류가 붙고 이번 달 합계가 올라간다 ===== */
function AccountBookScene() {
  return (
    <StScene>
      <StInputBox>
        <StTyped style={{ "--type-w": "6.5em" } as CSSProperties}>점심 8,500원</StTyped>
      </StInputBox>
      <StChip $delay={1.7} $tone="warning">
        🍚 식비로 넣었어요
      </StChip>
      <StTrack>
        <StFill $w={62} $delay={0.4} $tone="warning" $nudge />
      </StTrack>
      <StCaption $delay={3.1}>이번 달 식비 248,500원 · 예산의 62%</StCaption>
    </StScene>
  );
}

const StInputBox = styled.div`
  display: flex;
  align-items: center;
  padding: 0.45rem 0.65rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.6rem;
  font-size: 0.8rem;
`;
const StTyped = styled.span`
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  width: 0;
  border-right: 2px solid ${({ theme }) => theme.semantic.primary};
  animation: ${typing} 1.1s steps(9) 0.4s forwards;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.text};
`;

/* ===== 4. 일일 기록: 할 일 셋을 차례로 체크하고 한 줄 일기 ===== */
const DAILY_TODOS = ["아침 스트레칭", "책 20쪽 읽기", "물 8잔 마시기"];

function DailyScene() {
  return (
    <StScene>
      {DAILY_TODOS.map((t, i) => (
        <StCheckRow key={t} $delay={0.4 + i * 0.6}>
          <i aria-hidden="true">
            <span className="tick">✓</span>
          </i>
          <span className="text">{t}</span>
        </StCheckRow>
      ))}
      <StCaption $delay={2.9}>“비 오는 날이라 커피가 유난히 맛있었다.”</StCaption>
    </StScene>
  );
}

const fadeText = keyframes`
  to { color: var(--done-color); }
`;
const StCheckRow = styled.div<{ $delay: number }>`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
  font-size: 0.76rem;
  color: ${({ theme }) => theme.semantic.text};

  i {
    position: relative;
    width: 1.05rem;
    height: 1.05rem;
    border-radius: 0.3rem;
    border: 1px solid ${({ theme }) => theme.semantic.border};
    background: ${({ theme }) => theme.semantic.bg};
  }
  .tick {
    position: absolute;
    inset: -1px;
    display: grid;
    place-items: center;
    border-radius: inherit;
    font-size: 0.68rem;
    font-weight: 900;
    color: ${({ theme }) => theme.colors.white};
    background: ${({ theme }) => theme.semantic.success};
    opacity: 0;
    animation: ${pop} 0.3s ease-out ${({ $delay }) => $delay}s forwards;
  }
  .text {
    --done-color: ${({ theme }) => theme.semantic.subText};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    animation: ${fadeText} 0.3s ease-out ${({ $delay }) => $delay}s forwards;
  }
`;

/* ===== 5. 운동 기록: 한 주 막대가 자라고 제일 높은 날에 PR ===== */
const WORKOUT_DAYS = [
  { day: "월", h: 42 },
  { day: "수", h: 64 },
  { day: "금", h: 50 },
  { day: "토", h: 92, pr: true },
];

function WorkoutScene() {
  return (
    <StScene>
      <StBarChart>
        {WORKOUT_DAYS.map((d, i) => (
          <StBarCol key={d.day}>
            {/* 배지 자리는 처음부터 비워 둔다 — 나중에 떠도 막대 높이가 안 흔들리게 */}
            <span className="badge-slot">
              {d.pr ? <StPrBadge $delay={2.9}>PR</StPrBadge> : null}
            </span>
            <span className="bar-area">
              <StVBar $h={d.h} $delay={0.4 + i * 0.35} $tone={d.pr ? "primary" : "sub"} />
            </span>
            <span className="day">{d.day}</span>
          </StBarCol>
        ))}
      </StBarChart>
      <StCaption $delay={3.2}>토요일 데드리프트 100kg · 이번 주 최고 기록</StCaption>
    </StScene>
  );
}

const StBarChart = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.7rem;
  height: 6.6rem;
`;
const StBarCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  gap: 0.2rem;

  .badge-slot {
    height: 1rem;
    display: flex;
    align-items: center;
  }
  .bar-area {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: flex-end;
  }
  .day {
    font-size: 0.65rem;
    color: ${({ theme }) => theme.semantic.subText};
  }
`;
const StVBar = styled.div<{ $h: number; $delay: number; $tone: Tone }>`
  width: 100%;
  height: ${({ $h }) => $h}%;
  border-radius: 0.3rem 0.3rem 0 0;
  transform: scaleY(0);
  transform-origin: bottom;
  background: ${({ $tone, theme }) => toneColor($tone, theme)};
  animation: ${growY} 0.6s cubic-bezier(0.22, 0.61, 0.36, 1)
    ${({ $delay }) => $delay}s forwards;
`;
const StPrBadge = styled.span<{ $delay: number }>`
  opacity: 0;
  font-size: 0.6rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.white};
  background: ${({ theme }) => theme.semantic.primary};
  border-radius: 999px;
  padding: 0.08rem 0.35rem;
  animation: ${pop} 0.35s ease-out ${({ $delay }) => $delay}s forwards;
`;

/* ===== 6. 인바디: 체성분 링이 그려지고 숫자가 올라간다 ===== */
function InbodyScene() {
  return (
    <StScene>
      <StInbody>
        <div className="ring">
          <Ring pct={78} tone="success" delay={0.4} />
          <b>78점</b>
        </div>
        <dl>
          <div>
            <dt>골격근량</dt>
            <dd>
              <Count values={["28.0", "29.6", "31.1", "32.4"]} delay={1.4} />
              kg
            </dd>
          </div>
          <div>
            <dt>체지방률</dt>
            <dd className="down">
              <Count values={["24.0", "21.6", "19.4", "18.2"]} delay={2.1} />%
            </dd>
          </div>
        </dl>
      </StInbody>
      <StCaption $delay={3.2}>세 달 전보다 근육 +4.4kg · 체지방 -5.8%</StCaption>
    </StScene>
  );
}

const StInbody = styled.div`
  display: grid;
  grid-template-columns: 4.6rem minmax(0, 1fr);
  align-items: center;
  gap: 0.9rem;

  .ring {
    position: relative;
    display: grid;
    place-items: center;
  }
  .ring > b {
    position: absolute;
    font-size: 0.78rem;
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.text};
  }
  dl {
    margin: 0;
    max-width: 13rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  dl > div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }
  dt {
    font-size: 0.72rem;
    color: ${({ theme }) => theme.semantic.subText};
  }
  dd {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.primary};
  }
  dd.down {
    color: ${({ theme }) => theme.semantic.success};
  }
`;

/* ===== 7. 게임방: 주사위가 세 바퀴 돌고 멈추면 한 사람이 뽑힌다 ===== */
const GAME_NAMES = ["민준", "서연", "도윤", "하은"];

function GameScene() {
  return (
    <StScene>
      <StDie $delay={0.3} aria-hidden="true">
        <i />
        <i />
        <i />
      </StDie>
      <StNameRow>
        {GAME_NAMES.map((n, i) => (
          <StName key={n}>
            {n}
            {i === 2 ? <span className="win">{n}</span> : null}
          </StName>
        ))}
      </StNameRow>
      <StCaption $delay={3.1}>3번 나왔어요 · 오늘 총무는 도윤</StCaption>
    </StScene>
  );
}

/* 주사위 3의 눈. 글꼴에 없는 글자(⚂)가 네모로 깨지는 일이 없게 직접 그린다 */
const StDie = styled.span<{ $delay: number }>`
  align-self: center;
  width: 2.5rem;
  height: 2.5rem;
  display: grid;
  grid-template: repeat(3, 1fr) / repeat(3, 1fr);
  padding: 0.3rem;
  border-radius: 0.55rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  background: ${({ theme }) => theme.semantic.bg};
  animation: ${spin} 1.8s cubic-bezier(0.18, 0.72, 0.2, 1)
    ${({ $delay }) => $delay}s forwards;

  i {
    width: 0.4rem;
    height: 0.4rem;
    border-radius: 50%;
    place-self: center;
    background: ${({ theme }) => theme.semantic.text};
  }
  i:nth-child(1) {
    grid-area: 1 / 1;
  }
  i:nth-child(2) {
    grid-area: 2 / 2;
  }
  i:nth-child(3) {
    grid-area: 3 / 3;
  }
`;
const StNameRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
`;
const StName = styled.span`
  position: relative;
  text-align: center;
  padding: 0.3rem 0.2rem;
  border-radius: 0.5rem;
  font-size: 0.74rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.text};
  background: ${({ theme }) => theme.semantic.bg};

  .win {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    border-radius: inherit;
    color: ${({ theme }) => theme.colors.white};
    background: ${({ theme }) => theme.semantic.primary};
    opacity: 0;
    animation: ${pop} 0.4s ease-out 2.5s forwards;
  }
`;

/* ===== 8. 업무 캘린더: 한 주 일감이 밀려 들어오고 하나가 끝난다 ===== */
const SCHEDULE_BARS = [
  { label: "기획서 초안", left: 2, width: 46, done: false },
  { label: "디자인 검토", left: 24, width: 52, done: true },
  { label: "배포 준비", left: 52, width: 44, done: false },
];
const WEEK = ["월", "화", "수", "목", "금"];

function ScheduleScene() {
  return (
    <StScene>
      <StWeekHead>
        {WEEK.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </StWeekHead>
      {SCHEDULE_BARS.map((b, i) => (
        <StLane key={b.label}>
          <StTask $left={b.left} $width={b.width} $delay={0.5 + i * 0.45}>
            <span className="label">{b.label}</span>
            {b.done ? <span className="done">{b.label} 완료 ✓</span> : null}
          </StTask>
        </StLane>
      ))}
    </StScene>
  );
}

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-14px); }
  to { opacity: 1; transform: translateX(0); }
`;
const StWeekHead = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  font-size: 0.62rem;
  color: ${({ theme }) => theme.semantic.subText};
  text-align: center;
  padding-bottom: 0.1rem;
  border-bottom: 1px solid ${({ theme }) => theme.semantic.border};
`;
const StLane = styled.div`
  position: relative;
  height: 1.5rem;
`;
const StTask = styled.div<{ $left: number; $width: number; $delay: number }>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: ${({ $left }) => $left}%;
  width: ${({ $width }) => $width}%;
  display: flex;
  align-items: center;
  padding: 0 0.45rem;
  border-radius: 0.4rem;
  font-size: 0.68rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.primary};
  background: ${({ theme }) => theme.semantic.primaryLight};
  opacity: 0;
  animation: ${slideIn} 0.45s ease-out ${({ $delay }) => $delay}s forwards;

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .done {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0 0.45rem;
    white-space: nowrap;
    overflow: hidden;
    border-radius: inherit;
    color: ${({ theme }) => theme.colors.white};
    background: ${({ theme }) => theme.semantic.success};
    opacity: 0;
    animation: ${pop} 0.4s ease-out 3s forwards;
  }
`;

/* ===== 9. 습관: 일곱 칸이 왼쪽부터 차고 불꽃이 붙는다 ===== */
function HabitScene() {
  return (
    <StScene>
      <StHabitName>아침 스트레칭</StHabitName>
      <StDotRow>
        {["월", "화", "수", "목", "금", "토", "일"].map((d, i) => (
          <StDotCell key={d}>
            <StDot $delay={0.4 + i * 0.28} $tone="warning" />
            <span>{d}</span>
          </StDotCell>
        ))}
      </StDotRow>
      <StChip $delay={2.8} $tone="warning">
        🔥 7일 연속 성공
      </StChip>
    </StScene>
  );
}

const StHabitName = styled.p`
  ${appearBase};
  animation-delay: 0.2s;
  margin: 0;
  font-size: 0.82rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
`;
const StDotRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.35rem;
`;
const StDotCell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.22rem;

  > span {
    font-size: 0.6rem;
    color: ${({ theme }) => theme.semantic.subText};
  }
`;

/* ===== 10. 체중: 다섯 점을 따라 선이 내려가고 줄어든 무게가 붙는다 ===== */
// viewBox 비율을 그대로 쓰고(가로로 늘리지 않는다) 점도 SVG 안에 둔다.
// 늘리면 선 굵기와 점이 찌그러지고, 점을 바깥 div로 빼면 선 끝과 어긋난다.
const DIET_POINTS = [
  [5, 5],
  [36, 8.5],
  [67, 13],
  [98, 17.5],
  [127, 21],
] as const;

function DietScene() {
  return (
    <StScene>
      <StLineChart viewBox="0 0 132 26" aria-hidden="true">
        <polyline
          className="line"
          pathLength={100}
          points={DIET_POINTS.map(([x, y]) => `${x},${y}`).join(" ")}
        />
        {DIET_POINTS.map(([x, y], i) => (
          <circle
            key={x}
            className="dot"
            cx={x}
            cy={y}
            r="1.9"
            style={{ animationDelay: `${0.7 + i * 0.4}s` }}
          />
        ))}
      </StLineChart>
      <StDietFoot>
        <span>6월 68.4kg</span>
        <StChip $delay={3.1} $tone="success">
          −2.4kg
        </StChip>
        <span>9월 66.0kg</span>
      </StDietFoot>
    </StScene>
  );
}

const StLineChart = styled.svg`
  width: 100%;
  height: auto;

  .line {
    fill: none;
    stroke: ${({ theme }) => theme.semantic.success};
    stroke-width: 1.1;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    animation: ${drawLine} 2s ease-in-out 0.4s forwards;
  }
  .dot {
    fill: ${({ theme }) => theme.semantic.success};
    opacity: 0;
    transform-box: fill-box;
    transform-origin: center;
    animation: ${pop} 0.3s ease-out forwards;
  }
`;
const StDietFoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: ${({ theme }) => theme.semantic.subText};

  /* 가운데 꼬리표는 스스로 위로 붙지 않게 */
  ${StChip} {
    align-self: center;
  }
`;

/* ===== 11. 여행 플랜: 핀 셋이 차례로 찍히고 그 사이를 점선이 한 번 잇는다 ===== */
// 점선은 자라는 네모(clipPath)로 왼쪽부터 드러낸다.
// 점선은 stroke-dasharray로 모양을 만들고 있어, 체중 그래프처럼 dashoffset으로 그릴 수 없다.
const TRAVEL_PINS = [
  { n: "1", x: 18, y: 36 },
  { n: "2", x: 70, y: 15 },
  { n: "3", x: 122, y: 40 },
] as const;

const TRAVEL_WIPE_ID = "toy-travel-wipe";

function TravelScene() {
  return (
    <StScene>
      <StTravelCard>
        <StTravelMap viewBox="0 0 140 52" aria-hidden="true">
          <defs>
            <clipPath id={TRAVEL_WIPE_ID}>
              <rect className="wipe" x="0" y="0" width="140" height="52" />
            </clipPath>
          </defs>
          <polyline
            className="route"
            clipPath={`url(#${TRAVEL_WIPE_ID})`}
            points={TRAVEL_PINS.map((p) => `${p.x},${p.y}`).join(" ")}
          />
          {TRAVEL_PINS.map((p, i) => (
            <g
              key={p.n}
              className="pin"
              style={{ animationDelay: `${0.35 + i * 0.4}s` }}
            >
              <circle cx={p.x} cy={p.y} r="8.5" />
              <text x={p.x} y={p.y}>
                {p.n}
              </text>
            </g>
          ))}
        </StTravelMap>
      </StTravelCard>
      <StChip $delay={2.9}>🚶 12분</StChip>
    </StScene>
  );
}

const StTravelCard = styled.div`
  ${appearBase};
  animation-delay: 0.15s;
  padding: 0.6rem 0.7rem;
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.semantic.primaryLight};
`;
const StTravelMap = styled.svg`
  display: block;
  width: 100%;
  height: auto;

  .route {
    fill: none;
    stroke: ${({ theme }) => theme.semantic.primary};
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 4 3.5;
  }
  /* 점선을 왼쪽부터 드러내는 네모. 핀이 다 찍힌 뒤 한 번만 자란다 */
  .wipe {
    transform: scaleX(0);
    transform-box: fill-box;
    transform-origin: left;
    animation: ${growX} 1.1s cubic-bezier(0.22, 0.61, 0.36, 1) 1.55s forwards;
  }
  .pin {
    opacity: 0;
    transform-box: fill-box;
    transform-origin: center;
    animation: ${pop} 0.36s ease-out forwards;
  }
  .pin circle {
    fill: ${({ theme }) => theme.semantic.primary};
  }
  .pin text {
    fill: ${({ theme }) => theme.colors.white};
    font-size: 9px;
    font-weight: 800;
    text-anchor: middle;
    dominant-baseline: central;
  }
`;

/* 앵커 → 장면을 이어 주는 표. ToyPreview가 여기서 꺼내 쓴다. */
export const TOY_SCENES = {
  my: MyScene,
  place: PlaceScene,
  accountBook: AccountBookScene,
  daily: DailyScene,
  workout: WorkoutScene,
  inbody: InbodyScene,
  game: GameScene,
  schedule: ScheduleScene,
  habit: HabitScene,
  diet: DietScene,
  travel: TravelScene,
} as const satisfies Record<ToyScene, () => ReactElement>;
