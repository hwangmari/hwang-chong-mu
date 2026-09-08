"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { byId, chipName, type ServiceId } from "@/lib/services";
import {
  clamp01,
  toneFg,
  GAUGE_CIRCUMFERENCE,
  GAUGE_RADIUS,
  StBoard,
  StBoardHead,
  StBoardTitle,
  StGaugeCaption,
  StGaugeFill,
  StGaugeLabel,
  StGaugeRingWrap,
  StGaugeStrip,
  StGaugeSvg,
  StGaugeText,
  StGaugeTrack,
  StGaugeValue,
  StRowBar,
  StRowName,
  StRowSub,
  StRowValue,
  StSection,
  StWidgetIcon,
  type WidgetTone,
} from "@/components/home/HomeDashboard";

// 비로그인 방문자에게 "로그인하면 이 화면이 이렇게 채워진다"를 미리 보여 주는 판.
// 로그인 후 대시보드와 같은 부품(게이지 고리·아이콘 배지·수치 줄·진행바)을 그대로 써서,
// 실제로 보게 될 화면과 모양이 어긋나지 않게 한다.
// 여기 숫자·이름은 전부 지어낸 예시이며, 타일마다 '예시' 배지를 달아 실제 기록과 헷갈리지 않게 한다.

type Meter =
  | { kind: "bar"; ratio: number }
  | { kind: "chip"; text: string };

type PreviewTile = {
  id: ServiceId;
  tone: WidgetTone;
  /** 핵심 수치 한 줄 */
  main: string;
  /** 그 수치가 무엇인지 한 줄 */
  sub: string;
  meter: Meter;
  /** 연결하면 뭐가 좋아지는지 한 줄 (예시 숫자가 아니라 진짜 이득) */
  benefit: string;
};

// 로그인 후 대시보드의 순서(함께 쓰는 방 → 일과 시간 → 돈 → 몸과 습관)를 그대로 따른다.
const TILES: PreviewTile[] = [
  {
    id: "meeting",
    tone: "blue",
    main: "D-3 · 9월 11일 (목)",
    sub: "확정된 다음 약속",
    meter: { kind: "chip", text: "📅 저녁 7시 · 6명 참석" },
    benefit: "확정되면 달력에 자동으로",
  },
  {
    id: "calc",
    tone: "green",
    main: "받을 돈 12,000원",
    sub: "정산 1건 남음",
    meter: { kind: "bar", ratio: 0.75 },
    benefit: "남은 정산만 골라 보여줘요",
  },
  {
    id: "place",
    tone: "indigo",
    main: "1위 홍대 고기집",
    sub: "장소 투표 진행 중",
    meter: { kind: "chip", text: "🗳️ 3표 · 2일 남음" },
    benefit: "투표 결과가 바로바로 모여요",
  },
  {
    id: "tennis",
    tone: "teal",
    main: "9월 19일 교류전",
    sub: "다음 경기까지 D-11",
    meter: { kind: "chip", text: "🎾 참가 18명" },
    benefit: "다음 경기 D-day가 늘 보여요",
  },
  {
    id: "daily",
    tone: "rose",
    main: "이번 주 4일 기록",
    sub: "한 줄 일기와 체크리스트",
    meter: { kind: "bar", ratio: 0.57 },
    benefit: "며칠째 쓰고 있는지 이어져요",
  },
  {
    id: "overtime",
    tone: "orange",
    main: "보상휴가 1.25일",
    sub: "이번 달 야근 6시간 20분",
    meter: { kind: "bar", ratio: 0.63 },
    benefit: "보상휴가 며칠인지 바로 나와요",
  },
  {
    id: "schedule",
    tone: "teal",
    main: "이번 주 할 일 3건",
    sub: "오늘 마감 1건",
    meter: { kind: "bar", ratio: 0.4 },
    benefit: "오늘 마감인 일이 맨 위로 와요",
  },
  {
    id: "account-book",
    tone: "amber",
    main: "842,000원 / 1,200,000원",
    sub: "이번 달 예산 사용",
    meter: { kind: "bar", ratio: 0.7 },
    benefit: "예산 대비 얼마 썼는지 한 줄로",
  },
  {
    id: "gift-log",
    tone: "rose",
    main: "받은 돈 50,000원",
    sub: "김민준 · 결혼식",
    meter: { kind: "chip", text: "🎁 이번 달 3건" },
    benefit: "이름만 치면 주고받은 내역이 나와요",
  },
  {
    id: "habit",
    tone: "teal",
    main: "이번 주 3/5",
    sub: "물 2L 마시기",
    meter: { kind: "bar", ratio: 0.6 },
    benefit: "이번 주 몇 번 해냈는지 보여요",
  },
  {
    id: "diet",
    tone: "green",
    main: "-2.4kg",
    sub: "목표까지 3.6kg",
    meter: { kind: "bar", ratio: 0.4 },
    benefit: "목표까지 남은 만큼 채워져요",
  },
  {
    id: "workout",
    tone: "blue",
    main: "이번 주 3일",
    sub: "러닝 12.4km",
    meter: { kind: "bar", ratio: 0.6 },
    benefit: "폰에서 적고 PC에서 이어 봐요",
  },
];

// 로그인 후 맨 위에 뜨는 '이번 달' 게이지 띠의 예시 (실제 화면과 같은 고리 부품)
type PreviewGauge = {
  id: ServiceId;
  tone: WidgetTone;
  value: string;
  label: string;
  ratio: number;
};

// 실제 대시보드에서 고리로 나오는 서비스는 가계부·운동·야근 셋뿐이라, 예시도 그 셋만 둔다.
const GAUGES: PreviewGauge[] = [
  { id: "account-book", tone: "amber", value: "70%", label: "이달 예산 사용", ratio: 0.7 },
  { id: "workout", tone: "blue", value: "12일", label: "이달 30일 중", ratio: 0.4 },
  { id: "overtime", tone: "orange", value: "6시간", label: "이달 20시간 중", ratio: 0.32 },
];

// 연결하면 좋은 점 세 가지 — 예시 숫자를 보기 전에 왜 연결하는지부터 알려 준다
const BENEFITS = [
  {
    icon: "🔗",
    title: "한 계정으로 이어짐",
    text: "약속·정산·가계부·운동을 계정 하나에 연결해요.",
  },
  {
    icon: "⏱️",
    title: "오늘·이번 주가 먼저",
    text: "지난 기록보다 지금 챙길 것이 위로 올라와요.",
  },
  {
    icon: "🔓",
    title: "로그인 없이도 각 도구는 그대로",
    text: "각 도구는 로그인 안 해도 지금처럼 쓸 수 있어요.",
  },
];

// 한 장씩 올라오는 간격 — 혜택 띠 → 게이지 → 타일 → 버튼이 한 동작으로 이어진다 (60ms씩, 각 320ms)
const STEP_MS = 60;
const BENEFIT_COUNT = BENEFITS.length;
const GAUGE_COUNT = GAUGES.length;
const CTA_STEP = BENEFIT_COUNT + GAUGE_COUNT + TILES.length;

export default function GuestDashboardPreview({ wide = false }: { wide?: boolean }) {
  // 처음 그릴 때는 게이지 0 / 진행바 0에서 시작해, 화면에 붙은 다음 한 번만 실제 값으로 찬다.
  // (서버·클라이언트가 같은 값으로 시작하므로 하이드레이션 경고가 없다)
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <StSection $wide={wide}>
      <StIntro>
        <StIntroTitle>흩어진 약속·정산·기록을 한 화면에</StIntroTitle>
        <StIntroText>
          오늘 할 일이 먼저 보이고, 폰과 PC가 같은 화면이에요. 아래는 예시예요.
        </StIntroText>
      </StIntro>

      {/* 왜 연결하는지 먼저 — 한 줄에 셋, 같은 높이 */}
      <StBenefitRow>
        {BENEFITS.map((benefit, index) => (
          <StBenefitCard
            key={benefit.title}
            style={{ animationDelay: `${index * STEP_MS}ms` }}
          >
            <StBenefitHead>
              <StBenefitIcon aria-hidden="true">{benefit.icon}</StBenefitIcon>
              <StBenefitTitle>{benefit.title}</StBenefitTitle>
            </StBenefitHead>
            <StBenefitText>{benefit.text}</StBenefitText>
          </StBenefitCard>
        ))}
      </StBenefitRow>

      {/* ① 이번 달 게이지 띠 — 로그인 후 화면의 맨 위와 같은 고리 */}
      <StBoard>
        <StBoardHead>
          <StBoardTitle>🎯 이번 달</StBoardTitle>
          <StSampleNote>예시 화면</StSampleNote>
        </StBoardHead>
        <StGaugeStrip>
          {GAUGES.map((gauge, index) => {
            const service = byId(gauge.id);
            const step = BENEFIT_COUNT + index;
            const delay = `${step * STEP_MS}ms`;
            return (
              <StPvGaugeCard key={gauge.id} style={{ animationDelay: delay }}>
                <StGaugeRingWrap>
                  <StGaugeSvg viewBox="0 0 80 80" aria-hidden="true">
                    <StGaugeTrack cx="40" cy="40" r={GAUGE_RADIUS} />
                    <StGaugeFill
                      cx="40"
                      cy="40"
                      r={GAUGE_RADIUS}
                      $tone={gauge.tone}
                      $over={false}
                      strokeDasharray={GAUGE_CIRCUMFERENCE}
                      strokeDashoffset={
                        GAUGE_CIRCUMFERENCE *
                        (filled ? 1 - clamp01(gauge.ratio) : 1)
                      }
                      style={{ transitionDelay: `${step * STEP_MS + 220}ms` }}
                      transform="rotate(-90 40 40)"
                    />
                  </StGaugeSvg>
                  <StGaugeValue $over={false}>{gauge.value}</StGaugeValue>
                </StGaugeRingWrap>
                <StGaugeText>
                  <StGaugeCaption>
                    <span aria-hidden="true">{service.icon}</span>{" "}
                    {chipName(service)}
                  </StGaugeCaption>
                  <StGaugeLabel>{gauge.label}</StGaugeLabel>
                </StGaugeText>
              </StPvGaugeCard>
            );
          })}
        </StGaugeStrip>
      </StBoard>

      {/* ② 서비스 현황 — 서비스마다 한 장씩, 로그인 후 보게 될 수치 모양 그대로 */}
      <StBoard>
        <StBoardHead>
          <StBoardTitle>📊 서비스 현황</StBoardTitle>
          <StSampleNote>예시 화면</StSampleNote>
        </StBoardHead>
        <StTileGrid $wide={wide}>
          {TILES.map((tile, index) => {
            const service = byId(tile.id);
            const step = BENEFIT_COUNT + GAUGE_COUNT + index;
            return (
              <StTile
                key={tile.id}
                style={{ animationDelay: `${step * STEP_MS}ms` }}
              >
                <StSampleBadge>예시</StSampleBadge>
                <StTileHead>
                  <StWidgetIcon $tone={tile.tone} aria-hidden="true">
                    {service.icon}
                  </StWidgetIcon>
                  <StRowName>{chipName(service)}</StRowName>
                </StTileHead>
                <StTileBody>
                  <StRowValue>{tile.main}</StRowValue>
                  <StRowSub>{tile.sub}</StRowSub>
                </StTileBody>
                <StTileMeter>
                  {tile.meter.kind === "bar" ? (
                    <StBarSlot>
                      <StRowBar>
                        <StPvBarFill
                          $tone={tile.tone}
                          style={{
                            width: filled
                              ? `${clamp01(tile.meter.ratio) * 100}%`
                              : "0%",
                            transitionDelay: `${step * STEP_MS + 220}ms`,
                          }}
                        />
                      </StRowBar>
                    </StBarSlot>
                  ) : (
                    <StTileChip $tone={tile.tone}>{tile.meter.text}</StTileChip>
                  )}
                </StTileMeter>
                <StTileBenefit>
                  <span aria-hidden="true">✓</span> {tile.benefit}
                </StTileBenefit>
              </StTile>
            );
          })}
        </StTileGrid>
      </StBoard>

      <StCtaRow style={{ animationDelay: `${CTA_STEP * STEP_MS}ms` }}>
        <StCtaPrimary href="/login">로그인하고 내 화면 만들기</StCtaPrimary>
        <StCtaGhost href="/">먼저 둘러보기</StCtaGhost>
      </StCtaRow>
    </StSection>
  );
}

// ── 스타일 ──
// 타일 한 장이 아래에서 올라온다. 순서마다 animation-delay만 달라 한 동작처럼 이어진다.
const rise = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;


const StIntro = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0 0.25rem;
`;

const StIntroTitle = styled.h2`
  font-size: 1.35rem;
  line-height: 1.35;
  font-weight: 900;
  color: ${({ theme }) => theme.semantic.text};
  word-break: keep-all;
`;

const StIntroText = styled.p`
  font-size: 0.92rem;
  line-height: 1.55;
  color: ${({ theme }) => theme.semantic.subText};
  word-break: keep-all;
`;

// 연결하면 좋은 점 세 가지 — 한 줄에 셋(모바일 1열), 격자라 아래 선이 저절로 맞는다
const StBenefitRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.6rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }
`;

const StBenefitCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  background: ${({ theme }) => theme.semantic.primaryLight};
  border: 1px solid ${({ theme }) => theme.colors.blue100};
  animation: ${rise} 320ms cubic-bezier(0.2, 0.9, 0.3, 1) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const StBenefitHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
`;

const StBenefitIcon = styled.span`
  font-size: 1.05rem;
  line-height: 1;
  flex-shrink: 0;
`;

const StBenefitTitle = styled.strong`
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
  word-break: keep-all;
`;

const StBenefitText = styled.span`
  font-size: 0.8rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.semantic.subText};
  word-break: keep-all;
`;

// 예시 숫자 아래에 붙는 '연결하면 이게 좋아요' 한 줄
const StTileBenefit = styled.p`
  display: flex;
  align-items: flex-start;
  gap: 0.3rem;
  font-size: 0.78rem;
  line-height: 1.45;
  font-weight: 600;
  color: ${({ theme }) => theme.semantic.primary};
  word-break: keep-all;

  > span {
    flex-shrink: 0;
    font-weight: 900;
  }
`;
const StSampleNote = styled.span`
  flex-shrink: 0;
  font-size: 0.74rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StTileGrid = styled.div<{ $wide?: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.75rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
  }

  @media (min-width: 1024px) {
    grid-template-columns: ${({ $wide }) =>
      $wide ? "repeat(3, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))"};
  }
`;

// 로그인 후 현황 줄(StServiceRow)과 같은 결의 카드 — 격자에 놓이므로 테두리는 한 장에 하나만
const StTile = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1rem 1.1rem;
  border-radius: 1.25rem;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  animation: ${rise} 320ms cubic-bezier(0.2, 0.9, 0.3, 1) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const StPvGaugeCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 1rem 0.6rem 0.9rem;
  border-radius: 1.25rem;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  animation: ${rise} 320ms cubic-bezier(0.2, 0.9, 0.3, 1) both;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0 0.9rem;
    padding: 1.1rem 1rem;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const StSampleBadge = styled.span`
  position: absolute;
  top: 0.7rem;
  right: 0.8rem;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray400};
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.02em;
`;

const StTileHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
  padding-right: 2.2rem;
`;

const StTileBody = styled.div`
  min-width: 0;
`;

// 진행바든 칩이든 같은 높이를 차지해, 한 줄에 놓인 타일들이 같은 선에서 끝난다
const StTileMeter = styled.div`
  display: flex;
  align-items: center;
  min-height: 1.6rem;
`;

// 진행바는 자기 너비가 없어, 가로 한 칸을 차지하는 자리를 깔아 준다 (flex 안에서 0으로 접히지 않게)
const StBarSlot = styled.div`
  width: 100%;

  /* 현황 줄에서 오던 위쪽 여백은 여기선 자리 높이로 대신한다 */
  > div {
    margin-top: 0;
  }
`;

const StPvBarFill = styled.div<{ $tone: WidgetTone }>`
  height: 100%;
  border-radius: inherit;
  background: ${({ $tone, theme }) => toneFg($tone)(theme)};
  transition: width 900ms cubic-bezier(0.22, 1, 0.36, 1);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const StTileChip = styled.span<{ $tone: WidgetTone }>`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.gray50};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  color: ${({ $tone, theme }) => toneFg($tone)(theme)};
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const StCtaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  padding: 0 0.25rem;
  animation: ${rise} 320ms cubic-bezier(0.2, 0.9, 0.3, 1) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  /* 좁은 화면에서 글이 두 줄이 되는 버튼이 생겨도 두 버튼이 같은 높이로 끝나게 */
  @media ${({ theme }) => theme.media.mobile} {
    align-items: stretch;

    > a {
      flex: 1;
      justify-content: center;
      text-align: center;
    }
  }
`;

const StCtaPrimary = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 0.7rem 1.1rem;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.semantic.primary};
  color: ${({ theme }) => theme.colors.white};
  font-weight: 800;
  font-size: 0.92rem;
  text-decoration: none;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: 2px;
  }
`;

const StCtaGhost = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 0.7rem 1rem;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.semantic.primary};
  font-weight: 700;
  font-size: 0.92rem;
  text-decoration: none;
  border: 1px solid ${({ theme }) => theme.colors.blue100};

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: 2px;
  }
`;
