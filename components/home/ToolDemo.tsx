"use client";

import styled, { css, keyframes } from "styled-components";

// 첫 화면 오른쪽 미니 데모: 지금 보이는 상황의 도구가 실제로 어떻게 움직이는지 4초짜리 장면으로 보여준다.
// 장면은 순수 CSS 애니메이션이라 가볍고, '움직임 줄이기' 설정에서는 마지막 장면으로 바로 간다.
export type DemoScene = "meeting" | "overtime" | "calc" | "tennis" | "gift";

type Props = { scene: DemoScene };

export default function ToolDemo({ scene }: Props) {
  return (
    <StFrame aria-hidden="true" key={scene}>
      <StTitleBar>
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
        <StTitleText>{SCENE_TITLE[scene]}</StTitleText>
      </StTitleBar>
      {scene === "meeting" && <MeetingScene />}
      {scene === "overtime" && <OvertimeScene />}
      {scene === "calc" && <CalcScene />}
      {scene === "tennis" && <TennisScene />}
      {scene === "gift" && <GiftScene />}
    </StFrame>
  );
}

const SCENE_TITLE: Record<DemoScene, string> = {
  meeting: "약속 잡기 · 안 되는 날 찍기",
  overtime: "야근 계산기 · 밤 10시 넘으면 2배",
  calc: "여행 경비 계산기 · 송금 횟수 줄이기",
  tennis: "테니스 · 대진표 자동 배정",
  gift: "경조사비 장부 · 이름으로 찾기",
};

/* ---------- 1. 약속 잡기: 달력에 X가 차례로 찍히고, 남은 날이 파랗게 ---------- */
const MEETING_BLOCKED = [1, 4, 5, 8, 9, 10, 13, 16, 17, 20, 23, 24, 26, 27];
const MEETING_FREE = 18;

function MeetingScene() {
  return (
    <StCalendar>
      {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
        <StDayName key={d}>{d}</StDayName>
      ))}
      {Array.from({ length: 28 }, (_, i) => {
        const blockedOrder = MEETING_BLOCKED.indexOf(i);
        return (
          <StDay key={i} $blocked={blockedOrder >= 0} $free={i === MEETING_FREE} $delay={blockedOrder >= 0 ? 0.35 + blockedOrder * 0.14 : 3.1}>
            {i + 1}
            {blockedOrder >= 0 ? <span className="x">✕</span> : null}
            {i === MEETING_FREE ? <span className="ok">되는 날</span> : null}
          </StDay>
        );
      })}
    </StCalendar>
  );
}

/* ---------- 2. 야근: 시간 막대가 자라다 밤 10시를 넘기면 색이 바뀜 ---------- */
function OvertimeScene() {
  return (
    <StOvertime>
      <StTimeRow>
        <span>18:00</span>
        <span>20:00</span>
        <span className="ten">22:00</span>
        <span>24:00</span>
      </StTimeRow>
      <StTrack>
        <StFill />
        <StFillNight />
        <StTenMark />
      </StTrack>
      <StOvertimeSum>
        <span className="a">연장 4시간 × 1.5</span>
        <span className="b">+ 야간 2시간 × 2</span>
        <strong className="c">보상휴가 1일 적립</strong>
      </StOvertimeSum>
    </StOvertime>
  );
}

/* ---------- 3. 정산: 화살표 6개가 2개로 줄어듦 ---------- */
function CalcScene() {
  // 넷이 여행: 민준·서연이 6만 원씩 냄 → 1인당 3만 원 → 송금은 2번이면 끝 (서로 주고받으면 최대 6번)
  return (
    <StCalc>
      <StPeopleRow>
        <StPerson $tone="paid">
          민준 <b>냈어요 60,000</b>
        </StPerson>
        <StPerson $tone="paid">
          서연 <b>냈어요 60,000</b>
        </StPerson>
        <StPerson>
          도윤 <b>0</b>
        </StPerson>
        <StPerson>
          하은 <b>0</b>
        </StPerson>
      </StPeopleRow>
      <StTransfer $delay={1.2}>
        <span>도윤</span>
        <em>→</em>
        <span>민준</span>
        <b>30,000</b>
      </StTransfer>
      <StTransfer $delay={1.7}>
        <span>하은</span>
        <em>→</em>
        <span>서연</span>
        <b>30,000</b>
      </StTransfer>
      <StCalcResult>
        <span className="before">서로 주고받으면 6번</span>
        <span className="after">→ 송금 2번이면 끝</span>
      </StCalcResult>
    </StCalc>
  );
}

/* ---------- 4. 테니스: 명단이 코트 A/B로 들어가고 출전 횟수 배지 ---------- */
const TENNIS_ROWS = [
  { court: "A", pair: "민준 · 서연", vs: "도윤 · 하은" },
  { court: "B", pair: "지호 · 유진", vs: "시우 · 수아" },
  { court: "A", pair: "민준 · 하은", vs: "지호 · 수아" },
  { court: "B", pair: "서연 · 도윤", vs: "유진 · 시우" },
];

function TennisScene() {
  return (
    <StTennis>
      {TENNIS_ROWS.map((r, i) => (
        <StCourtRow key={i} $delay={0.4 + i * 0.55}>
          <StCourtTag>{r.court}</StCourtTag>
          <span>{r.pair}</span>
          <em>vs</em>
          <span>{r.vs}</span>
        </StCourtRow>
      ))}
      <StTennisBadge>모두 2경기씩 · 출전 공평</StTennisBadge>
    </StTennis>
  );
}

/* ---------- 5. 경조사비: 이름을 치면 내역이 나옴 ---------- */
function GiftScene() {
  return (
    <StGift>
      <StSearchBox>
        <span className="icon">🔍</span>
        <StTyping>김민준</StTyping>
      </StSearchBox>
      <StGiftRow $delay={1.9}>
        <span className="date">2025.05</span>
        <span>결혼 · 냈어요</span>
        <b>100,000</b>
      </StGiftRow>
      <StGiftRow $delay={2.3}>
        <span className="date">2024.11</span>
        <span>돌잔치 · 받았어요</span>
        <b>50,000</b>
      </StGiftRow>
      <StGiftHint>이번엔 10만 원이면 딱 맞아요</StGiftHint>
    </StGift>
  );
}

/* ===== 공통 프레임 ===== */
const StFrame = styled.div`
  position: relative;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.white};
  box-shadow: 0 18px 40px -28px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  min-height: 15.5rem;
  display: flex;
  flex-direction: column;

  /* 장면은 남는 세로 공간의 가운데에 */
  > *:not(:first-child) {
    flex: 1;
    justify-content: center;
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01s !important;
      animation-delay: 0s !important;
    }
  }
`;

const StTitleBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.55rem 0.8rem;
  border-bottom: 1px solid ${({ theme }) => theme.semantic.border};
  background: ${({ theme }) => theme.semantic.bg};
  .dot {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.gray300};
  }
`;

const StTitleText = styled.span`
  margin-left: 0.4rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
`;

const pop = keyframes`
  from { opacity: 0; transform: scale(0.6); }
  60% { transform: scale(1.15); }
  to { opacity: 1; transform: scale(1); }
`;
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;
const appear = css<{ $delay: number }>`
  opacity: 0;
  animation: ${fadeUp} 0.4s ease-out ${({ $delay }) => $delay}s forwards;
`;
/* 안쪽 선택자용: 지연은 각자 animation-delay로 준다 */
const appearBase = css`
  opacity: 0;
  animation: ${fadeUp} 0.4s ease-out 0s forwards;
`;

/* ===== 1. 달력 ===== */
const StCalendar = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  padding: 0.75rem;
`;
const StDayName = styled.span`
  font-size: 0.62rem;
  text-align: center;
  color: ${({ theme }) => theme.semantic.subText};
`;
const StDay = styled.span<{ $blocked: boolean; $free: boolean; $delay: number }>`
  position: relative;
  aspect-ratio: 1.15;
  border-radius: 0.4rem;
  display: grid;
  place-items: center;
  font-size: 0.68rem;
  font-weight: 600;
  color: ${({ theme }) => theme.semantic.text};
  background: ${({ theme }) => theme.semantic.bg};

  .x {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 0.85rem;
    font-weight: 900;
    color: ${({ theme }) => theme.colors.rose500};
    background: ${({ theme }) => theme.colors.rose50};
    border-radius: inherit;
    opacity: 0;
    animation: ${pop} 0.3s ease-out ${({ $delay }) => $delay}s forwards;
  }
  .ok {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 0.55rem;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.white};
    background: ${({ theme }) => theme.semantic.primary};
    border-radius: inherit;
    opacity: 0;
    animation: ${pop} 0.4s ease-out ${({ $delay }) => $delay}s forwards;
  }
`;

/* ===== 2. 야근 ===== */
const grow = keyframes`
  from { width: 0; }
  to { width: 66.6%; }
`;
const growNight = keyframes`
  from { width: 0; }
  to { width: 33.3%; }
`;
const StOvertime = styled.div`
  padding: 1.1rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;
const StTimeRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.66rem;
  color: ${({ theme }) => theme.semantic.subText};
  .ten {
    color: ${({ theme }) => theme.colors.rose500};
    font-weight: 800;
  }
`;
const StTrack = styled.div`
  position: relative;
  height: 1.4rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.semantic.bg};
  overflow: hidden;
`;
const StFill = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background: ${({ theme }) => theme.semantic.primary};
  animation: ${grow} 1.6s ease-out 0.3s forwards;
`;
const StFillNight = styled.div`
  position: absolute;
  left: 66.6%;
  top: 0;
  bottom: 0;
  width: 0;
  background: ${({ theme }) => theme.colors.rose500};
  animation: ${growNight} 0.9s ease-out 1.9s forwards;
`;
const StTenMark = styled.div`
  position: absolute;
  left: 66.6%;
  top: -0.2rem;
  bottom: -0.2rem;
  width: 2px;
  background: ${({ theme }) => theme.colors.rose500};
`;
const StOvertimeSum = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.semantic.subText};
  .a {
    ${appearBase};
    animation-delay: 1.2s;
  }
  .b {
    ${appearBase};
    animation-delay: 2.5s;
    color: ${({ theme }) => theme.colors.rose500};
    font-weight: 700;
  }
  .c {
    ${appearBase};
    animation-delay: 3.2s;
    color: ${({ theme }) => theme.semantic.text};
    font-size: 0.95rem;
  }
`;

/* ===== 3. 정산 ===== */
const StCalc = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;
const StPeopleRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
`;
const StPerson = styled.div<{ $tone?: "paid" }>`
  text-align: center;
  font-size: 0.72rem;
  padding: 0.45rem 0.2rem;
  border-radius: 0.6rem;
  background: ${({ $tone, theme }) => ($tone === "paid" ? theme.colors.teal50 : theme.semantic.bg)};
  color: ${({ theme }) => theme.semantic.text};
  b {
    display: block;
    font-size: 0.7rem;
    color: ${({ $tone, theme }) => ($tone === "paid" ? theme.colors.teal600 : theme.semantic.subText)};
  }
`;
const StTransfer = styled.div<{ $delay: number }>`
  ${appear};
  display: grid;
  grid-template-columns: auto auto auto minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.7rem;
  border-radius: 0.6rem;
  background: ${({ theme }) => theme.semantic.primaryLight};
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.text};
  em {
    font-style: normal;
    color: ${({ theme }) => theme.semantic.primary};
  }
  b {
    text-align: right;
    color: ${({ theme }) => theme.semantic.primary};
  }
`;
const StCalcResult = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  font-size: 0.85rem;
  .before {
    color: ${({ theme }) => theme.semantic.subText};
    text-decoration: line-through;
  }
  .after {
    ${appearBase};
    animation-delay: 2.9s;
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.primary};
  }
`;

/* ===== 4. 테니스 ===== */
const StTennis = styled.div`
  padding: 0.9rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;
const StCourtRow = styled.div<{ $delay: number }>`
  ${appear};
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
  font-size: 0.74rem;
  color: ${({ theme }) => theme.semantic.text};
  padding: 0.35rem 0.5rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.semantic.bg};
  em {
    font-style: normal;
    color: ${({ theme }) => theme.semantic.subText};
    font-size: 0.65rem;
  }
  span:last-child {
    text-align: right;
  }
`;
const StCourtTag = styled.span`
  font-size: 0.62rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.white};
  background: ${({ theme }) => theme.colors.green600};
  border-radius: 0.3rem;
  padding: 0.1rem 0.35rem;
`;
const StTennisBadge = styled.div`
  ${appearBase};
  animation-delay: 2.9s;
  align-self: flex-end;
  font-size: 0.72rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.teal600};
  background: ${({ theme }) => theme.colors.teal50};
  border-radius: 999px;
  padding: 0.25rem 0.6rem;
`;

/* ===== 5. 경조사비 ===== */
const typing = keyframes`
  from { width: 0; }
  to { width: 3.3em; }
`;
const StGift = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;
const StSearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.7rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.6rem;
  font-size: 0.85rem;
  .icon {
    font-size: 0.8rem;
  }
`;
const StTyping = styled.span`
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  width: 0;
  border-right: 2px solid ${({ theme }) => theme.semantic.primary};
  animation: ${typing} 1.1s steps(3) 0.5s forwards;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.text};
`;
const StGiftRow = styled.div<{ $delay: number }>`
  ${appear};
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.5rem;
  font-size: 0.76rem;
  padding: 0.45rem 0.6rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.semantic.bg};
  color: ${({ theme }) => theme.semantic.text};
  .date {
    color: ${({ theme }) => theme.semantic.subText};
  }
  b {
    color: ${({ theme }) => theme.colors.teal600};
  }
`;
const StGiftHint = styled.div`
  ${appearBase};
  animation-delay: 3s;
  font-size: 0.78rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.primary};
`;
