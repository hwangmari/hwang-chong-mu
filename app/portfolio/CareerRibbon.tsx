"use client";

// 이 페이지의 시그니처: 2012년부터 지금까지를 한 줄로 이어 붙인 커리어 리본.
// 처음 한 번 빛줄기가 좌→우로 풀리고, 그 선에서 회사 칸이 피어난다. 그 외 움직임은 없다.
// 읽기 쉬움이 먼저라 칸은 모두 무채색이고, 회사 색은 왼쪽 6px 띠로만 남긴다.
// 날짜는 칸 안에 함께 적는다. 따로 있던 연도 눈금 줄은 선이 분리돼 읽기 어려워서 없앴다 (2026-09-14).
import { useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { careerSpans, totalCareerMonths } from "./careerFacts";
import { companyColor } from "./companyColor";
import { useCareerFocus } from "./CareerFocusContext";
import { HERO_TIMING, OUT_EASE, bloomSegment, unrollLine } from "./heroChoreography";

/** 위에 붙은 리본에 카드 제목이 가리지 않도록 두는 여백 */
export const STICKY_RIBBON_OFFSET = "7rem";

/** 데스크톱 기준 칸 최소 폭(px). 재직 기간이 짧아도 회사명 + 날짜 + 기간 세 줄이 들어갈 만큼은 준다 (2026-09-14) */
const MIN_SEGMENT_PX = 124;
/** 폭 계산에 쓰는 기준 캔버스 (theme.layout.maxWidth 안쪽) */
const CANVAS_PX = 930;
/** 아래 설명 카드에 이름표로 내보일 프로젝트 수. 나머지는 "외 N개"로 줄인다 */
const MAX_CHIPS = 3;

/** 각 칸이 데스크톱에서 대략 몇 px을 차지하는지 미리 계산해 둔다 */
/* 띠 표시 순서: 최신 회사가 왼쪽 */
const ribbonSpans = [...careerSpans].reverse();
const flexible = careerSpans.filter((s) => (s.months / totalCareerMonths) * CANVAS_PX >= MIN_SEGMENT_PX);
const fixedCount = careerSpans.length - flexible.length;
const flexibleMonths = flexible.reduce((n, s) => n + s.months, 0);
const flexibleWidth = CANVAS_PX - fixedCount * MIN_SEGMENT_PX;

function estimatedWidth(months: number) {
  const share = (months / totalCareerMonths) * CANVAS_PX;
  if (share < MIN_SEGMENT_PX) return MIN_SEGMENT_PX;
  return (months / flexibleMonths) * flexibleWidth;
}

/** 좁은 칸은 회사 이름의 첫 낱말만 적고, 전체 이름은 title 속성으로 남긴다 */
function shortName(company: string) {
  return company.split(/[\s(]/)[0];
}

interface CareerRibbonProps {
  /** compact = 스크롤할 때 위에 붙는 한 줄짜리 */
  variant?: "full" | "compact";
}

export default function CareerRibbon({ variant = "full" }: CareerRibbonProps) {
  const {
    focused,
    scrollFocused,
    setFocused,
    scrollToCompany,
    careerInView,
    heroRibbonVisible,
    setHeroRibbonVisible,
  } = useCareerFocus();
  const wrapperRef = useRef<HTMLElement>(null);
  const slotRefs = useRef(new Map<string, HTMLDivElement | null>());
  const [caretX, setCaretX] = useState<number | null>(null);
  const compact = variant === "compact";

  // 첫 화면 리본이 화면 밖으로 나갔는지 알려 준다 (위쪽 고정 리본을 띄울 신호)
  useEffect(() => {
    if (compact) return;
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => setHeroRibbonVisible(entries[0]?.isIntersecting ?? false),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [compact, setHeroRibbonVisible]);

  const activeId = focused ?? scrollFocused;
  const active =
    careerSpans.find((span) => span.id === activeId) ?? careerSpans[careerSpans.length - 1];
  const shown = compact ? careerInView && !heroRibbonVisible : true;
  const activeKey = active?.id ?? "";

  // 지금 켜진 칸의 한가운데를 재서, 그 아래에 설명 카드로 이어지는 화살표를 놓는다.
  // 칸 폭은 화면 폭에 따라 달라지므로 계산이 아니라 실제 위치를 잰다.
  useEffect(() => {
    if (compact) return;
    const measure = () => {
      const el = slotRefs.current.get(activeKey);
      setCaretX(el ? el.offsetLeft + el.offsetWidth / 2 : null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [compact, activeKey]);

  return (
    <StWrapper
      ref={wrapperRef}
      $compact={compact}
      $shown={shown}
      aria-label={compact ? "경력 빠른 이동" : "커리어 타임라인"}
      aria-hidden={compact && !shown}
    >
      {compact && active && <StCompactName>{active.company}</StCompactName>}

      <StBarArea>
        {!compact && <StUnroll aria-hidden="true" />}

        <StBar $compact={compact}>
          {/* 아래 경력 카드가 최신순이라 띠도 최신→과거로 두어 스크롤 방향과 하이라이트 이동 방향을 맞춘다 (2026-09-15) */}
          {ribbonSpans.map((span, i) => {
            const width = estimatedWidth(span.months);
            const isActive = activeId === span.id;
            const label = width >= 110 ? span.company : shortName(span.company);
            return (
              <StSlot
                key={span.id}
                ref={(el) => {
                  slotRefs.current.set(span.id, el);
                }}
                $months={span.months}
                $delay={HERO_TIMING.ribbonBloom + i * 0.055}
                $compact={compact}
              >
                <StSegment
                  type="button"
                  $active={isActive}
                  $compact={compact}
                  aria-current={isActive ? "true" : undefined}
                  title={`${span.company} · ${span.period}`}
                  onMouseEnter={() => setFocused(span.id)}
                  onMouseLeave={() => setFocused(null)}
                  onFocus={() => setFocused(span.id)}
                  onBlur={() => setFocused(null)}
                  onClick={() => scrollToCompany(span.id)}
                  aria-label={`${span.company} ${span.period} 경력 보기`}
                >
                  <StBrandStripe
                    $colorClass={span.colorClass}
                    $compact={compact}
                    aria-hidden="true"
                  />
                  <span className="text">
                    <span className="name">{label}</span>
                    {!compact && (
                      <>
                        <span className="range">{span.rangeLabel}</span>
                        <span className="tenure">{span.tenureLabel}</span>
                      </>
                    )}
                  </span>
                </StSegment>
              </StSlot>
            );
          })}
        </StBar>
      </StBarArea>

      {!compact && active && (
        <StCaretRail aria-hidden="true">
          {caretX !== null && (
            <StCaret
              data-testid="ribbon-caret"
              $colorClass={active.colorClass}
              style={{ left: `${caretX}px` }}
            />
          )}
        </StCaretRail>
      )}

      {!compact && active && (
        <StCallout $colorClass={active.colorClass}>
          <StCalloutHead>
            <strong>{active.company}</strong>
            <span className="role">{active.role}</span>
          </StCalloutHead>

          {active.projectTitles.length > 0 && (
            <StChipRow data-testid="ribbon-chips">
              {active.projectTitles.slice(0, MAX_CHIPS).map((title) => (
                <StChip key={title}>{title}</StChip>
              ))}
              {active.projectTitles.length > MAX_CHIPS && (
                <StChipMore>외 {active.projectTitles.length - MAX_CHIPS}개</StChipMore>
              )}
            </StChipRow>
          )}

          <StCalloutMeta>
            <span className="range">{active.rangeLabel}</span>
            <span className="tenure">{active.tenureLabel}</span>
          </StCalloutMeta>
        </StCallout>
      )}
    </StWrapper>
  );
}

const StWrapper = styled.section<{ $compact: boolean; $shown: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;

  ${({ $compact, $shown, theme }) =>
    $compact &&
    css`
      max-width: ${theme.layout.maxWidth};
      margin: 0 auto;
      padding: 0.3rem 1.5rem;
      flex-direction: row;
      align-items: center;
      gap: 0.6rem;
      border-radius: 0.9rem;
      background: ${theme.colors.white};
      border: 1px solid ${theme.semantic.border};
      box-shadow: 0 6px 18px -14px rgba(15, 23, 42, 0.6);
      opacity: ${$shown ? 1 : 0};
      transform: translateY(${$shown ? "0" : "-6px"});
      visibility: ${$shown ? "visible" : "hidden"};
      transition:
        opacity 0.2s ease,
        transform 0.2s ease,
        visibility 0.2s;

      @media ${theme.media.mobile} {
        padding: 0.3rem 1.15rem;
      }

      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `}
`;

const StCompactName = styled.span`
  flex-shrink: 0;
  max-width: 8rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (min-width: 1024px) {
    display: none;
  }
`;

const StBarArea = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
`;

const StUnroll = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 4px;
  margin-top: -2px;
  border-radius: 999px;
  transform-origin: left center;
  pointer-events: none;
  z-index: 2;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.amber200},
    ${({ theme }) => theme.semantic.primary}
  );
  box-shadow: 0 0 18px 2px ${({ theme }) => theme.colors.amber200};
  animation: ${unrollLine} 0.9s ${OUT_EASE} ${HERO_TIMING.ribbonLine}s both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0;
  }
`;

const StBar = styled.div<{ $compact: boolean }>`
  display: flex;
  gap: ${({ $compact }) => ($compact ? "3px" : "4px")};
  width: 100%;
`;

const StSlot = styled.div<{ $months: number; $delay: number; $compact: boolean }>`
  flex: ${({ $months }) => $months} 1 0;
  min-width: ${MIN_SEGMENT_PX}px;
  display: flex;

  ${({ $compact, $delay }) =>
    !$compact &&
    css`
      animation: ${bloomSegment} 0.4s ${OUT_EASE} ${$delay}s both;
    `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  @media (max-width: 767px) {
    min-width: 1.9rem;
  }
`;

const StSegment = styled.button<{ $active: boolean; $compact: boolean }>`
  position: relative;
  flex: 1;
  min-width: 0;
  height: ${({ $compact }) => ($compact ? "2.15rem" : "4rem")};
  border-radius: 0.55rem;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: ${({ $compact }) => ($compact ? "0 0.6rem" : "0 0.35rem 0 0.72rem")};
  text-align: ${({ $compact }) => ($compact ? "center" : "left")};
  background: ${({ theme }) => theme.semantic.bg};
  border: 1px solid ${({ theme }) => theme.semantic.border};
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;

  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    width: 100%;
    line-height: 1.25;
    align-items: ${({ $compact }) => ($compact ? "center" : "flex-start")};
  }

  .name {
    font-size: ${({ $compact }) => ($compact ? "0.74rem" : "0.8rem")};
    font-weight: 700;
    color: ${({ theme }) => theme.semantic.text};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  /* 날짜 구간과 재직 기간. 좁은 칸(더존 124px)에도 들어가도록 숫자를 조금 좁힌다 */
  .range {
    margin-top: 0.12rem;
    font-size: 0.66rem;
    color: ${({ theme }) => theme.colors.gray600};
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  .tenure {
    margin-top: 0.05rem;
    font-size: 0.66rem;
    color: ${({ theme }) => theme.semantic.subText};
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  ${({ $active, theme }) =>
    $active &&
    css`
      background: ${theme.colors.white};
      border: 2px solid ${theme.semantic.primary};
      transform: translateY(-2px);
      box-shadow: 0 8px 18px -12px ${theme.semantic.primary};

      .name {
        font-weight: 800;
      }
    `}

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    transform: none;
  }

  /* 폰에서는 이름이 들어갈 자리가 없어 색 띠만 남긴다 */
  @media (max-width: 767px) {
    height: ${({ $compact }) => ($compact ? "1.9rem" : "2.4rem")};
    padding: 0;

    .text {
      display: none;
    }
  }
`;

const StBrandStripe = styled.span<{ $colorClass: string; $compact: boolean }>`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: ${({ theme, $colorClass }) => companyColor(theme, $colorClass)};

  /* 따라다니는 바는 순수한 이동 바라 회사 색 띠를 두지 않는다 */
  ${({ $compact }) => $compact && "display: none;"}

  /* 폰에서는 이름이 들어갈 자리가 없어, 이 띠가 곧 색 막대가 된다 */
  @media (max-width: 767px) {
    display: block;
    width: 100%;
  }
`;

/* 켜진 칸과 아래 설명 카드를 잇는 화살표가 사는 줄 */
const StCaretRail = styled.div`
  position: relative;
  height: 8px;
  margin-top: -0.15rem;
  pointer-events: none;
`;

const StCaret = styled.span<{ $colorClass: string }>`
  position: absolute;
  bottom: 0;
  width: 0;
  height: 0;
  margin-left: -7px;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 8px solid ${({ theme, $colorClass }) => companyColor(theme, $colorClass)};
  transition:
    left 0.15s ease,
    border-bottom-color 0.15s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const StCallout = styled.div<{ $colorClass: string }>`
  /* 좁은 화면: 회사·기간이 첫 줄, 프로젝트 이름표가 둘째 줄 */
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem 0.9rem;
  padding: 0.7rem 0.9rem;

  /* 데스크톱: 회사 | 프로젝트 이름표 | 기간을 한 줄 세 칸으로 고정한다 */
  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: minmax(0, max-content) minmax(0, 1fr) max-content;
    column-gap: 1rem;
    row-gap: 0;
  }

  border-radius: 0.75rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-top: 3px solid ${({ theme, $colorClass }) => companyColor(theme, $colorClass)};
  background: ${({ theme }) => theme.colors.white};
  transition: border-top-color 0.15s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const StCalloutHead = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  flex: 0 1 auto;

  strong {
    font-size: 0.95rem;
    color: ${({ theme }) => theme.semantic.text};
  }

  .role {
    font-size: 0.78rem;
    line-height: 1.4;
    color: ${({ theme }) => theme.colors.gray600};
    word-break: keep-all;
  }

  @media ${({ theme }) => theme.media.mobile} {
    .role {
      display: none;
    }
  }
`;

const StChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
  flex: 1 1 auto;
  min-width: 0;

  /* 좁은 화면에서는 이름표가 한 줄을 통째로 쓰며 두 번째 줄로 내려간다 */
  @media (max-width: 1023px) {
    flex: 1 1 100%;
    order: 3;
  }
`;

const StChip = styled.span`
  padding: 0.16rem 0.55rem;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  background: ${({ theme }) => theme.colors.gray50};
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.45;
  word-break: keep-all;
`;

const StChipMore = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  color: ${({ theme }) => theme.semantic.subText};
`;

const StCalloutMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.05rem;
  flex: 0 0 auto;
  margin-left: auto;
  font-variant-numeric: tabular-nums;

  @media (min-width: 1024px) {
    margin-left: 0;
  }

  .range {
    font-size: 0.8rem;
    font-weight: 700;
    color: ${({ theme }) => theme.semantic.text};
  }

  .tenure {
    font-size: 0.72rem;
    color: ${({ theme }) => theme.semantic.subText};
  }
`;
