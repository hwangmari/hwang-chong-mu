"use client";

import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";

const COMPANIES = [
  {
    name: "하이브랩",
    start: 2012,
    end: 2016,
    color: "#6b7280",
    role: "UIT 웹표준개발팀",
    period: "2012.09 - 2016.05",
    highlights: ["네이버 서비스 운영", "CJ오쇼핑 파견", "크로스브라우징 전문"],
  },
  {
    name: "더존",
    start: 2016,
    end: 2017,
    color: "#3b82f6",
    role: "UI 개발팀",
    period: "2016.05 - 2016.12",
    highlights: ["WEHAGO 플랫폼 React UI 설계", "외부 인력 리딩"],
  },
  {
    name: "29CM",
    start: 2017,
    end: 2020,
    color: "#8b5cf6",
    role: "Platform Cell FE",
    period: "2017.02 - 2020.07",
    highlights: ["사이트 전면 개편(SPA)", "앤어워드 2회 수상", "브랜드 캠페인 인터랙션"],
  },
  {
    name: "카카오",
    start: 2020,
    end: 2023,
    color: "#facc15",
    role: "워크개발 마크업파트",
    period: "2020.07 - 2023.08",
    highlights: ["4종 OS 크로스플랫폼 웹뷰", "React·Svelte·Angular 멀티스택", "다크모드 시스템 구축"],
  },
  {
    name: "한화생명",
    start: 2023,
    end: 2026.5,
    color: "#f97316",
    role: "디지털프로덕트팀 세일즈파트",
    period: "2023.08 - 재직 중",
    highlights: ["다이렉트 웹 전담", "HSP 마이그레이션(Next.js)", "보장분석 운영 전담"],
  },
];

const MILESTONES = [
  {
    year: 2012,
    level: 15,
    title: "하이브랩 입사",
    desc: "웹표준 개발팀 — 커리어 시작",
    tag: "Start",
    color: "#6b7280",
    company: "하이브랩",
  },
  {
    year: 2013,
    level: 28,
    title: "네이버 서비스 운영",
    desc: "지식쇼핑, 부동산 등 대형 서비스 UI",
    tag: "Naver",
    color: "#22c55e",
    company: "하이브랩",
  },
  {
    year: 2014,
    level: 35,
    title: "CJ오쇼핑 파견",
    desc: "CJmall, 올리브영 커머스 운영",
    tag: "CJ",
    color: "#22c55e",
    company: "하이브랩",
  },
  {
    year: 2016,
    level: 42,
    title: "더존 비즈온",
    desc: "WEHAGO 플랫폼 React UI 설계",
    tag: "React",
    color: "#3b82f6",
    company: "더존",
  },
  {
    year: 2017,
    level: 52,
    title: "29CM 입사",
    desc: "프론트엔드 개발자로 본격 전환",
    tag: "FE 전환",
    color: "#8b5cf6",
    company: "29CM",
  },
  {
    year: 2018,
    level: 60,
    title: "29CM 전면 개편",
    desc: "SPA 기반 PC/Mobile 통합 구축",
    tag: "리뉴얼",
    color: "#8b5cf6",
    company: "29CM",
  },
  {
    year: 2019,
    level: 68,
    title: "앤어워드 2회 수상",
    desc: "삼성화재 브랜드 캠페인 인터랙션",
    tag: "Award",
    color: "#f59e0b",
    company: "29CM",
  },
  {
    year: 2020,
    level: 73,
    title: "카카오 엔터프라이즈",
    desc: "카카오워크 — 멀티 프레임워크 시대",
    tag: "Kakao",
    color: "#facc15",
    company: "카카오",
  },
  {
    year: 2022,
    level: 80,
    title: "크로스플랫폼 웹뷰",
    desc: "4종 OS 대응 투표·할일 서비스",
    tag: "Webview",
    color: "#facc15",
    company: "카카오",
  },
  {
    year: 2023,
    level: 85,
    title: "한화생명 입사",
    desc: "다이렉트 웹 & 백오피스 전담",
    tag: "현직",
    color: "#f97316",
    company: "한화생명",
  },
  {
    year: 2025,
    level: 92,
    title: "HSP 마이그레이션",
    desc: "레거시 JSP → Next.js 전면 재구축",
    tag: "Migration",
    color: "#ef4444",
    company: "한화생명",
  },
  {
    year: 2026,
    level: 96,
    title: "현재",
    desc: "보장분석 서비스 운영 전담",
    tag: "Now",
    color: "#ec4899",
    company: "한화생명",
  },
];

const GRAPH_WIDTH = 900;
const GRAPH_HEIGHT = 280;
const PADDING_X = 25;
const PADDING_Y = 30;
const MIN_YEAR = 2012;
const MAX_YEAR = 2026.5;

function getX(year: number) {
  return PADDING_X + ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * (GRAPH_WIDTH - PADDING_X * 2);
}

function getY(level: number) {
  return GRAPH_HEIGHT - PADDING_Y - (level / 100) * (GRAPH_HEIGHT - PADDING_Y * 2);
}

function buildPath() {
  const points = MILESTONES.map((m) => ({ x: getX(m.year), y: getY(m.level) }));
  if (points.length < 2) return "";

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
    const cpx2 = prev.x + (curr.x - prev.x) * 0.6;
    d += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

function buildAreaPath() {
  const linePath = buildPath();
  const lastPoint = MILESTONES[MILESTONES.length - 1];
  const firstPoint = MILESTONES[0];
  return `${linePath} L ${getX(lastPoint.year)} ${GRAPH_HEIGHT - PADDING_Y} L ${getX(firstPoint.year)} ${GRAPH_HEIGHT - PADDING_Y} Z`;
}

export default function CareerGraph() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [hoveredCompany, setHoveredCompany] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const pathD = buildPath();
  const areaD = buildAreaPath();
  const years = [2012, 2014, 2016, 2018, 2020, 2022, 2024, 2026];
  const lastIdx = MILESTONES.length - 1;

  return (
    <StSection>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <StSectionHeader>
          <StSectionTitle>Career Journey</StSectionTitle>
          <StSectionDesc>2012년부터 현재까지, 성장의 궤적</StSectionDesc>
        </StSectionHeader>

        <StGraphContainer>
          <StSvgWrapper>
          <StSvg viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`} preserveAspectRatio="xMinYMin meet">
            {/* 가로 그리드 */}
            {[20, 40, 60, 80].map((level) => (
              <line
                key={level}
                x1={PADDING_X}
                y1={getY(level)}
                x2={GRAPH_WIDTH - PADDING_X}
                y2={getY(level)}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}

            {/* 연도 라벨 */}
            {years.map((year) => (
              <text
                key={year}
                x={getX(year)}
                y={GRAPH_HEIGHT - 8}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize="11"
                fontWeight="600"
              >
                {year}
              </text>
            ))}

            {/* 그라데이션 정의 */}
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6b7280" />
                <stop offset="30%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="70%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.01" />
              </linearGradient>
              {/* 파티클 글로우 */}
              <radialGradient id="particleGlow">
                <stop offset="0%" stopColor="white" stopOpacity="1" />
                <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* 영역 채우기 */}
            <motion.path
              d={areaD}
              fill="url(#areaGrad)"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.8 }}
            />

            {/* 곡선 */}
            <motion.path
              d={pathD}
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />

            {/* 회사 호버 시 해당 구간 하이라이트 */}
            {hoveredCompany && (() => {
              const company = COMPANIES.find((c) => c.name === hoveredCompany);
              if (!company) return null;
              const x1 = getX(company.start);
              const x2 = getX(Math.min(company.end, 2026.5));
              return (
                <rect
                  x={x1}
                  y={PADDING_Y}
                  width={x2 - x1}
                  height={GRAPH_HEIGHT - PADDING_Y * 2}
                  fill={`${company.color}10`}
                  stroke={`${company.color}30`}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  rx="8"
                />
              );
            })()}

            {/* 마일스톤 점 */}
            {MILESTONES.map((m, i) => {
              const isLast = i === lastIdx;
              const isHighlighted = hoveredCompany ? m.company === hoveredCompany : true;
              const isActive = activeIdx === i;

              return (
                <g key={i}>
                  {/* 1. 현재 점 펄스 효과 */}
                  {isLast && (
                    <>
                      <circle
                        cx={getX(m.year)}
                        cy={getY(m.level)}
                        r="5"
                        fill={m.color}
                        opacity="0.3"
                      >
                        <animate
                          attributeName="r"
                          values="5;16;5"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.4;0;0.4"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle
                        cx={getX(m.year)}
                        cy={getY(m.level)}
                        r="5"
                        fill={m.color}
                        opacity="0.15"
                      >
                        <animate
                          attributeName="r"
                          values="5;22;5"
                          dur="2s"
                          begin="0.4s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.25;0;0.25"
                          dur="2s"
                          begin="0.4s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </>
                  )}
                  <motion.circle
                    cx={getX(m.year)}
                    cy={getY(m.level)}
                    r={isActive ? 8 : 5}
                    fill={m.color}
                    stroke="white"
                    strokeWidth="2.5"
                    style={{ cursor: "pointer" }}
                    opacity={isHighlighted ? 1 : 0.25}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08, type: "spring" }}
                    onMouseEnter={() => setActiveIdx(i)}
                    onMouseLeave={() => setActiveIdx(null)}
                  />
                </g>
              );
            })}
          </StSvg>

          {/* 툴팁 */}
          {activeIdx !== null && (
            <StTooltip
              as={motion.div}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                left: `${(getX(MILESTONES[activeIdx].year) / GRAPH_WIDTH) * 100}%`,
                top: `${(getY(MILESTONES[activeIdx].level) / GRAPH_HEIGHT) * 100}%`,
                transform: "translate(-50%, calc(-100% - 12px))",
              }}
            >
              <StTooltipTag $color={MILESTONES[activeIdx].color}>
                {MILESTONES[activeIdx].tag}
              </StTooltipTag>
              <StTooltipYear>{MILESTONES[activeIdx].year}</StTooltipYear>
              <StTooltipTitle>{MILESTONES[activeIdx].title}</StTooltipTitle>
              <StTooltipDesc>{MILESTONES[activeIdx].desc}</StTooltipDesc>
            </StTooltip>
          )}
          </StSvgWrapper>
          {/* 하단 회사 타임라인 바 */}
          <StCompanyTimeline>
          {/* 앞쪽 spacer: 2011 ~ 첫 회사 시작(2012) */}
          <div style={{ flex: COMPANIES[0].start - MIN_YEAR }} />
          {COMPANIES.map((c, idx) => {
            const baseFlex = c.end - c.start;
            const isSelected = selectedCompany === c.name;
            const isHovered = hoveredCompany === c.name;
            const hasSelected = selectedCompany !== null;
            const flex = isSelected ? 8 : hasSelected ? 0.5 : baseFlex;
            // 회사 사이 갭 spacer
            const nextStart = COMPANIES[idx + 1]?.start;
            const gapAfter = nextStart ? nextStart - c.end : 0;

            return (
              <React.Fragment key={c.name}>
              <StCompanyBar
                as={motion.div}
                layout
                $color={c.color}
                $isHovered={isHovered}
                $isSelected={isSelected}
                $isCollapsed={hasSelected && !isSelected}
                style={{ flex }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onMouseEnter={() => setHoveredCompany(c.name)}
                onMouseLeave={() => setHoveredCompany(null)}
                onClick={() =>
                  setSelectedCompany(isSelected ? null : c.name)
                }
              >
                {isSelected ? (
                  <StExpandedContent $color={c.color}>
                    <div className="expanded-header">
                      <span className="company-name">{c.name}</span>
                      <span className="period">{c.period}</span>
                    </div>
                    <div className="role">{c.role}</div>
                    <div className="highlights">
                      {c.highlights.map((h, i) => (
                        <span key={i} className="chip">{h}</span>
                      ))}
                    </div>
                  </StExpandedContent>
                ) : (
                  <StBarLabel $isCollapsed={hasSelected && !isSelected}>
                    {hasSelected && !isSelected ? c.name[0] : c.name}
                  </StBarLabel>
                )}
              </StCompanyBar>
              {gapAfter > 0 && !hasSelected && (
                <div style={{ flex: gapAfter }} />
              )}
            </React.Fragment>
            );
          })}
          {/* 뒤쪽 spacer: 마지막 회사 끝 ~ 2027 */}
          <div style={{ flex: MAX_YEAR - COMPANIES[COMPANIES.length - 1].end }} />
        </StCompanyTimeline>
        </StGraphContainer>
      </motion.div>
    </StSection>
  );
}

// ── Styled Components ──

const StSection = styled.section`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 3rem 1.5rem;
`;

const StSectionHeader = styled.div`
  margin-bottom: 2rem;
`;

const StSectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.25rem;
`;

const StSectionDesc = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: 600;
`;

const StGraphContainer = styled.div`
  background: ${({ theme }) => theme.colors.white};
  padding: 0;
  overflow: visible;
`;

const StSvgWrapper = styled.div`
  position: relative;
`;

const StSvg = styled.svg`
  width: 100%;
  height: auto;
  display: block;
`;

const StTooltip = styled.div`
  position: absolute;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.75rem;
  padding: 0.6rem 0.85rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  pointer-events: none;
  z-index: 10;
  min-width: 160px;
  text-align: center;
`;

const StTooltipTag = styled.div<{ $color: string }>`
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 800;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}15`};
  padding: 1px 8px;
  border-radius: 4px;
  margin-bottom: 4px;
`;

const StTooltipYear = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StTooltipTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  margin: 2px 0;
`;

const StTooltipDesc = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.4;
`;

const StCompanyTimeline = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid ${({ theme }) => theme.colors.gray100};
  min-height: 36px;
  /* SVG PADDING_X와 동일한 비율로 좌우 패딩 */
  padding-left: ${(PADDING_X / GRAPH_WIDTH) * 100}%;
  padding-right: ${(PADDING_X / GRAPH_WIDTH) * 100}%;
`;

const StCompanyBar = styled.div<{
  $color: string;
  $isHovered: boolean;
  $isSelected: boolean;
  $isCollapsed: boolean;
}>`
  background: ${({ $color, $isHovered, $isSelected }) =>
    $isSelected ? `${$color}15` : $isHovered ? `${$color}35` : `${$color}20`};
  border: 1px solid ${({ $color, $isHovered, $isSelected }) =>
    $isSelected ? $color : $isHovered ? $color : `${$color}40`};
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  min-width: ${({ $isCollapsed }) => ($isCollapsed ? "28px" : "0")};
  padding: ${({ $isSelected }) => ($isSelected ? "0.6rem 0.85rem" : "0 6px")};
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    z-index: 2;
  }
`;

const StBarLabel = styled.span<{ $isCollapsed: boolean }>`
  font-size: ${({ $isCollapsed }) => ($isCollapsed ? "0.65rem" : "0.7rem")};
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StExpandedContent = styled.div<{ $color: string }>`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .expanded-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .company-name {
    font-size: 1rem;
    font-weight: 800;
    color: ${({ $color }) => $color};
  }

  .period {
    font-size: 0.7rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray400};
  }

  .role {
    font-size: 0.78rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray500};
  }

  .highlights {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 2px;
  }

  .chip {
    font-size: 0.68rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    background: ${({ $color }) => `${$color}15`};
    color: ${({ $color }) => $color};
    white-space: nowrap;
  }
`;
