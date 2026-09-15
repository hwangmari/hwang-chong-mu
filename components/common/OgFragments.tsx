import React from "react";
import { TONES, type OgTone, type TonePalette } from "./OgTemplate";
import type { ServiceId } from "@/lib/services";

// 링크 미리보기 이미지의 타일 안, 이모지 아래에 들어가는 작은 장식 조각들.
//
// 목적은 딱 하나 — 이모지만 보고 "무슨 도구지?" 하지 않도록,
// 그 도구를 한눈에 알아볼 힌트를 하나 얹는 것이다.
// (예: 계산기는 금액 칩, 약속 잡기는 되는 날/안 되는 날 칸)
//
// 그리는 도구(satori)의 제약 때문에 전부 단색 네모·동그라미로만 만든다.
// 글자는 22px 아래로 내려가지 않게 한다 — 카카오톡에서 줄어들면 안 보인다.

const WHITE = "#FFFFFF";
const GHOST = "rgba(255,255,255,0.24)";
const GHOST_STRONG = "rgba(255,255,255,0.45)";

/** 흰 알약 — 값을 또렷하게 보여줄 때 */
function Chip({
  children,
  color,
  marginLeft = 0,
}: {
  children: React.ReactNode;
  color: string;
  marginLeft?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginLeft,
        padding: "10px 20px",
        borderRadius: 999,
        background: WHITE,
        color,
        fontSize: 24,
        fontWeight: 800,
        letterSpacing: "-0.02em",
      }}
    >
      {children}
    </div>
  );
}

/** 반투명 알약 — 배경에 한 겹 얹는 보조 정보 */
function GhostChip({
  children,
  marginLeft = 0,
}: {
  children: React.ReactNode;
  marginLeft?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginLeft,
        padding: "10px 20px",
        borderRadius: 999,
        background: GHOST,
        color: WHITE,
        fontSize: 24,
        fontWeight: 800,
        letterSpacing: "-0.02em",
      }}
    >
      {children}
    </div>
  );
}

function Row({
  children,
  marginTop = 0,
}: {
  children: React.ReactNode;
  marginTop?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop,
      }}
    >
      {children}
    </div>
  );
}

/** 막대 하나 (그래프·타임라인에 쓴다) */
function Bar({
  width,
  height = 16,
  background,
  marginLeft = 0,
  marginTop = 0,
}: {
  width: number;
  height?: number;
  background: string;
  marginLeft?: number;
  marginTop?: number;
}) {
  return (
    <div
      style={{
        width,
        height,
        marginLeft,
        marginTop,
        borderRadius: height / 2,
        background,
      }}
    />
  );
}

/** 달력 한 칸 */
function Cell({
  mark,
  filled,
  marginLeft = 0,
  color,
}: {
  mark?: string;
  filled?: boolean;
  marginLeft?: number;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 38,
        height: 38,
        marginLeft,
        borderRadius: 12,
        background: filled ? WHITE : GHOST,
        color: filled ? color : WHITE,
        fontSize: 24,
        fontWeight: 800,
      }}
    >
      {mark ?? ""}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 서비스별 조각
// ─────────────────────────────────────────────────────────────

/** 여행 경비 계산기 — 각자 낸 금액 두 개, 그리고 정산 끝 */
function CalcFragment(c: TonePalette) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Row>
        <Chip color={c.tileDeep}>12,000원</Chip>
        <Chip color={c.tileDeep} marginLeft={12}>
          8,000원
        </Chip>
      </Row>
      <Row marginTop={12}>
        <GhostChip>정산 완료 ✓</GhostChip>
      </Row>
    </div>
  );
}

/** 약속 잡기 — 되는 날/안 되는 날이 한 줄로 */
function MeetingFragment(c: TonePalette) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Row>
        <Cell color={c.tileDeep} />
        <Cell color={c.tileDeep} mark="✕" marginLeft={9} />
        <Cell color={c.tileDeep} marginLeft={9} />
        <Cell color={c.tileDeep} mark="✓" filled marginLeft={9} />
        <Cell color={c.tileDeep} mark="✕" marginLeft={9} />
        <Cell color={c.tileDeep} marginLeft={9} />
      </Row>
      <Row marginTop={14}>
        <GhostChip>6명 중 5명 가능</GhostChip>
      </Row>
    </div>
  );
}

/** 여행 플랜 — 1·2·3 순서로 이어지는 하루 동선, 그리고 다음 곳까지 걸리는 시간 */
function TravelFragment(c: TonePalette) {
  // 동그란 순서 표시. 이 파일의 다른 조각(습관·게임)처럼 조각 안에서만 쓰는 작은 도우미로 둔다.
  const step = (no: string, marginLeft = 0) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 38,
        height: 38,
        marginLeft,
        borderRadius: 19,
        background: WHITE,
        color: c.tileDeep,
        fontSize: 24,
        fontWeight: 800,
      }}
    >
      {no}
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Row>
        {step("1")}
        <Bar width={26} height={10} background={GHOST_STRONG} marginLeft={8} />
        {step("2", 8)}
        <Bar width={26} height={10} background={GHOST_STRONG} marginLeft={8} />
        {step("3", 8)}
      </Row>
      <Row marginTop={16}>
        <GhostChip>🚶 도보 12분</GhostChip>
      </Row>
    </div>
  );
}

/** 장소잡기 — 후보 두 곳의 득표 막대 */
function PlaceFragment(c: TonePalette) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Row>
        <Bar width={180} height={20} background={WHITE} />
        <Chip color={c.tileDeep} marginLeft={12}>
          7표
        </Chip>
      </Row>
      <Row marginTop={14}>
        <Bar width={104} height={20} background={GHOST_STRONG} />
        <GhostChip marginLeft={12}>3표</GhostChip>
      </Row>
    </div>
  );
}

/** 게임방 — 주사위 두 알 */
function GameFragment(c: TonePalette) {
  const pip = (background: string, marginLeft = 0) => (
    <div
      style={{
        width: 14,
        height: 14,
        marginLeft,
        borderRadius: 7,
        background,
      }}
    />
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Row>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 72,
            height: 72,
            borderRadius: 20,
            background: WHITE,
          }}
        >
          {pip(c.tileDeep)}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 72,
            height: 72,
            marginLeft: 14,
            borderRadius: 20,
            background: GHOST,
          }}
        >
          {pip(WHITE)}
          {pip(WHITE, 12)}
          {pip(WHITE, 12)}
        </div>
      </Row>
      <Row marginTop={14}>
        <GhostChip>랜덤 뽑기</GhostChip>
      </Row>
    </div>
  );
}

/** 테니스 대회 — 두 갈래가 하나로 합쳐지는 대진표 */
function TennisFragment(c: TonePalette) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Bar width={92} height={14} background={GHOST_STRONG} />
          <Bar width={92} height={14} background={WHITE} marginTop={34} />
        </div>
        <div
          style={{
            display: "flex",
            width: 14,
            height: 62,
            marginLeft: -2,
            borderRadius: 4,
            background: GHOST_STRONG,
          }}
        />
        <Bar width={40} height={14} background={GHOST_STRONG} marginLeft={-2} />
        <Chip color={c.tileDeep} marginLeft={8}>
          결승
        </Chip>
      </div>
      <Row marginTop={16}>
        <GhostChip>대진표 자동</GhostChip>
      </Row>
    </div>
  );
}

/** 야근 계산기 — 계산 결과 보상휴가 일수 */
function OvertimeFragment(c: TonePalette) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Row>
        <GhostChip>10시간</GhostChip>
        <div
          style={{
            display: "flex",
            marginLeft: 12,
            marginRight: 12,
            fontSize: 26,
            fontWeight: 800,
            color: WHITE,
          }}
        >
          →
        </div>
        <Chip color={c.tileDeep}>1.25일</Chip>
      </Row>
      <Row marginTop={14}>
        <GhostChip>보상휴가</GhostChip>
      </Row>
    </div>
  );
}

/** 업무 캘린더 — 기간이 다른 일정 막대 세 줄 */
function ScheduleFragment() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <Bar width={220} height={18} background={WHITE} />
      <Bar width={150} height={18} background={GHOST_STRONG} marginLeft={44} marginTop={14} />
      <Bar width={110} height={18} background={GHOST} marginLeft={96} marginTop={14} />
    </div>
  );
}

/** 가계부 — 영수증 한 줄, 그리고 이번 달 합계 */
function AccountBookFragment(c: TonePalette) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: 260,
          padding: "12px 18px",
          borderRadius: 16,
          background: WHITE,
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 400, color: c.tileDeep }}>점심</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: c.tileDeep }}>9,000원</div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: 260,
          marginTop: 12,
          padding: "12px 18px",
          borderRadius: 16,
          background: GHOST,
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 400, color: WHITE }}>이번 달</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: WHITE }}>82만원</div>
      </div>
    </div>
  );
}

/** 경조사비 장부 — 받은 것과 보낸 것 */
function GiftLogFragment(c: TonePalette) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Row>
        <GhostChip>받음</GhostChip>
        <Chip color={c.tileDeep} marginLeft={10}>
          10만원
        </Chip>
      </Row>
      <Row marginTop={12}>
        <GhostChip>보냄</GhostChip>
        <Chip color={c.tileDeep} marginLeft={10}>
          5만원
        </Chip>
      </Row>
    </div>
  );
}

/** 습관 관리 — 연속으로 채운 날들 */
function HabitFragment() {
  const dot = (filled: boolean, marginLeft: number) => (
    <div
      style={{
        width: 30,
        height: 30,
        marginLeft,
        borderRadius: 15,
        background: filled ? WHITE : GHOST,
      }}
    />
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Row>
        {dot(true, 0)}
        {dot(true, 12)}
        {dot(true, 12)}
        {dot(true, 12)}
        {dot(true, 12)}
        {dot(false, 12)}
      </Row>
      <Row marginTop={16}>
        <GhostChip>5일 연속</GhostChip>
      </Row>
    </div>
  );
}

/** 일일 기록 — 오늘 체크리스트 */
function DailyFragment(c: TonePalette) {
  const line = (done: boolean, width: number, marginTop: number) => (
    <div style={{ display: "flex", alignItems: "center", marginTop }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 34,
          height: 34,
          borderRadius: 10,
          background: done ? WHITE : GHOST,
          color: c.tileDeep,
          fontSize: 22,
          fontWeight: 800,
        }}
      >
        {done ? "✓" : ""}
      </div>
      <Bar
        width={width}
        height={14}
        background={done ? GHOST_STRONG : GHOST}
        marginLeft={14}
      />
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      {line(true, 170, 0)}
      {line(true, 130, 14)}
      {line(false, 150, 14)}
    </div>
  );
}

/** 체중 관리 — 저울 눈금 위 오늘 위치 */
function DietFragment(c: TonePalette) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <Bar width={10} height={22} background={GHOST} />
        <Bar width={10} height={34} background={GHOST} marginLeft={12} />
        <Bar width={10} height={46} background={GHOST_STRONG} marginLeft={12} />
        <Bar width={10} height={30} background={GHOST} marginLeft={12} />
        <Bar width={10} height={20} background={WHITE} marginLeft={12} />
      </div>
      <Bar width={250} height={8} background={GHOST_STRONG} marginTop={12} />
      <Row marginTop={14}>
        <Chip color={c.tileDeep}>-1.2kg</Chip>
      </Row>
    </div>
  );
}

/** 운동 기록 — 주차별로 올라가는 막대 */
function WorkoutFragment() {
  const bar = (height: number, background: string, marginLeft: number) => (
    <div
      style={{
        width: 44,
        height,
        marginLeft,
        borderRadius: 12,
        background,
      }}
    />
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        {bar(52, GHOST, 0)}
        {bar(82, GHOST_STRONG, 16)}
        {bar(112, WHITE, 16)}
      </div>
      <Row marginTop={16}>
        <GhostChip>3주째 증가</GhostChip>
      </Row>
    </div>
  );
}

/** 인바디 기록 — 반쯤 채워진 고리 */
function InbodyFragment(c: TonePalette) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          width: 108,
          height: 108,
          borderRadius: 54,
          borderWidth: 16,
          borderStyle: "solid",
          borderTopColor: WHITE,
          borderRightColor: WHITE,
          borderBottomColor: GHOST,
          borderLeftColor: GHOST,
          transform: "rotate(45deg)",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", marginLeft: 20 }}>
        <Chip color={c.tileDeep}>골격근 ↑</Chip>
        <div style={{ display: "flex", marginTop: 12 }}>
          <GhostChip>체지방 ↓</GhostChip>
        </div>
      </div>
    </div>
  );
}

const FRAGMENTS: Record<ServiceId, (c: TonePalette) => React.ReactNode> = {
  meeting: MeetingFragment,
  calc: CalcFragment,
  travel: TravelFragment,
  place: PlaceFragment,
  game: GameFragment,
  tennis: TennisFragment,
  overtime: OvertimeFragment,
  schedule: ScheduleFragment,
  "account-book": AccountBookFragment,
  "gift-log": GiftLogFragment,
  habit: HabitFragment,
  daily: DailyFragment,
  diet: DietFragment,
  workout: WorkoutFragment,
  inbody: InbodyFragment,
};

/** 서비스에 맞는 장식 조각을 그린다. */
export function fragmentFor(id: ServiceId, tone: OgTone): React.ReactNode {
  const draw = FRAGMENTS[id];
  if (!draw) return null;
  return draw(TONES[tone]);
}

/** 장식 조각 안에 들어가는 글자들 — 글꼴을 이 글자만 담아 받으려고 쓴다. */
export const FRAGMENT_TEXT: Record<ServiceId, string> = {
  meeting: "✓✕6명 중 5명 가능",
  calc: "12,000원 8,000원 정산 완료 ✓",
  travel: "123🚶 도보 12분",
  place: "7표 3표",
  game: "랜덤 뽑기",
  tennis: "결승 대진표 자동",
  overtime: "10시간 → 1.25일 보상휴가",
  schedule: "",
  "account-book": "점심 9,000원 이번 달 82만원",
  "gift-log": "받음 보냄 10만원 5만원",
  habit: "5일 연속",
  daily: "✓",
  diet: "-1.2kg",
  workout: "3주째 증가",
  inbody: "골격근 ↑ 체지방 ↓",
};
