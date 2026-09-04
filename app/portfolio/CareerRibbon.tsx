"use client";

// 이 페이지의 시그니처: 2012년부터 지금까지를 한 줄로 이어 붙인 커리어 리본.
// 처음 한 번 빛줄기가 좌→우로 풀리고, 그 선에서 회사 칸이 피어난다. 그 외 움직임은 없다.
// 읽기 쉬움이 먼저라 칸은 모두 무채색이고, 회사 색은 왼쪽 6px 띠로만 남긴다.
import { useEffect, useRef } from "react";
import styled, { css } from "styled-components";
import { boundaryYears, careerSpans, totalCareerMonths } from "./careerFacts";
import { companyColor } from "./companyColor";
import { useCareerFocus } from "./CareerFocusContext";
import { HERO_TIMING, OUT_EASE, bloomSegment, unrollLine } from "./heroChoreography";

/** 위에 붙은 리본에 카드 제목이 가리지 않도록 두는 여백 */
export const STICKY_RIBBON_OFFSET = "7rem";

/** 데스크톱 기준 칸 최소 폭(px). 재직 기간이 짧아도 이만큼은 준다. */
const MIN_SEGMENT_PX = 88;
/** 이 폭보다 넓을 때만 칸 안에 재직 기간을 함께 적는다 */
const DURATION_MIN_PX = 140;
/** 폭 계산에 쓰는 기준 캔버스 (theme.layout.maxWidth 안쪽) */
const CANVAS_PX = 930;

/** 각 칸이 데스크톱에서 대략 몇 px을 차지하는지 미리 계산해 둔다 */
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
          {careerSpans.map((span, i) => {
            const width = estimatedWidth(span.months);
            const isActive = activeId === span.id;
            const withDuration = !compact && width >= DURATION_MIN_PX && span.durationLabel;
            const label = width >= 110 ? span.company : shortName(span.company);
            return (
              <StSlot
                key={span.id}
                $months={span.months}
                $delay={HERO_TIMING.ribbonBloom + i * 0.055}
                $compact={compact}
              >
                <StSegment
                  type="button"
                  $active={isActive}
                  $compact={compact}
                  aria-current={isActive ? "true" : undefined}
                  title={span.company}
                  onMouseEnter={() => setFocused(span.id)}
                  onMouseLeave={() => setFocused(null)}
                  onFocus={() => setFocused(span.id)}
                  onBlur={() => setFocused(null)}
                  onClick={() => scrollToCompany(span.id)}
                  aria-label={`${span.company} ${span.period} 경력 보기`}
                >
                  <StBrandStripe $colorClass={span.colorClass} aria-hidden="true" />
                  <span className="text">
                    <span className="name">{label}</span>
                    {withDuration && <span className="duration">{span.durationLabel}</span>}
                  </span>
                </StSegment>
              </StSlot>
            );
          })}
        </StBar>
      </StBarArea>

      {!compact && (
        <StTicks aria-hidden="true">
          {careerSpans.map((span, i) => (
            <StTick key={span.id} $months={span.months}>
              <i />
              <span>{boundaryYears[i]}</span>
            </StTick>
          ))}
          <StTickEnd>
            <i />
            <span>{boundaryYears[boundaryYears.length - 1]}</span>
          </StTickEnd>
        </StTicks>
      )}

      {!compact && active && (
        <StCallout>
          <StBrandDot $colorClass={active.colorClass} aria-hidden="true" />
          <strong>{active.company}</strong>
          <span className="role">{active.role}</span>
          <span className="meta">
            {active.period} · 주요 프로젝트 {active.projectCount}개
          </span>
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
  height: ${({ $compact }) => ($compact ? "2.15rem" : "3.25rem")};
  border-radius: 0.55rem;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0 0.5rem 0 0.85rem;
  text-align: left;
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
    line-height: 1.2;
  }

  .name {
    font-size: ${({ $compact }) => ($compact ? "0.74rem" : "0.8rem")};
    font-weight: 700;
    color: ${({ theme }) => theme.semantic.text};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .duration {
    margin-top: 0.1rem;
    font-size: 0.68rem;
    color: ${({ theme }) => theme.semantic.subText};
    font-variant-numeric: tabular-nums;
  }

  ${({ $active, theme }) =>
    $active &&
    css`
      background: ${theme.colors.white};
      border: 2px solid ${theme.semantic.primary};
      padding-left: calc(0.85rem - 1px);
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

const StBrandStripe = styled.span<{ $colorClass: string }>`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: ${({ theme, $colorClass }) => companyColor(theme, $colorClass)};

  @media (max-width: 767px) {
    width: 100%;
  }
`;

const StTicks = styled.div`
  display: flex;
  position: relative;
  padding-top: 0.15rem;
  border-top: 1px solid ${({ theme }) => theme.semantic.border};
`;

const tickLabel = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
  font-variant-numeric: tabular-nums;

  i {
    width: 1px;
    height: 5px;
    margin-bottom: 1px;
    background: ${({ theme }) => theme.semantic.border};
  }
`;

const StTick = styled.div<{ $months: number }>`
  ${tickLabel}
  flex: ${({ $months }) => $months} 1 0;
  min-width: ${MIN_SEGMENT_PX}px;

  @media (max-width: 767px) {
    min-width: 1.9rem;

    span {
      font-size: 0.62rem;
    }
  }
`;

const StTickEnd = styled.div`
  ${tickLabel}
  align-items: flex-end;
  flex: 0 0 auto;

  @media (max-width: 767px) {
    span {
      font-size: 0.62rem;
    }
  }
`;

const StCallout = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
  margin-top: 0.15rem;
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  background: ${({ theme }) => theme.colors.white};

  strong {
    font-size: 0.95rem;
    color: ${({ theme }) => theme.semantic.text};
  }

  .role {
    font-size: 0.82rem;
    color: ${({ theme }) => theme.colors.gray600};
  }

  .meta {
    font-size: 0.78rem;
    color: ${({ theme }) => theme.semantic.subText};
    margin-left: auto;
    font-variant-numeric: tabular-nums;
  }

  @media ${({ theme }) => theme.media.mobile} {
    .role {
      display: none;
    }
    .meta {
      margin-left: 0;
      width: 100%;
    }
  }
`;

const StBrandDot = styled.span<{ $colorClass: string }>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  align-self: center;
  background: ${({ theme, $colorClass }) => companyColor(theme, $colorClass)};
`;
