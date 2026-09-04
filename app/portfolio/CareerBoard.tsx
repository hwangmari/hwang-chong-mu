"use client";

// 경력 섹션. 회사마다 카드 하나이고, 요약과 주요 프로젝트 목록은 처음부터 펼쳐져 있다.
// 날짜별 변경 이력처럼 긴 목록만 상세 페이지로 넘긴다.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { experiences } from "@/data/experiences";
import { displayFont } from "@/lib/fonts";
import { companyColor } from "./companyColor";
import { useCareerFocus } from "./CareerFocusContext";
import { SectionTitle } from "./motion";
import CareerRibbon, { STICKY_RIBBON_OFFSET } from "./CareerRibbon";
import CareerGraph from "./CareerGraph";

export default function CareerBoard() {
  const { focused, scrollFocused, setScrollFocused, setCareerInView } = useCareerFocus();
  const sectionRef = useRef<HTMLElement>(null);

  // 화면 한가운데를 지나는 회사 카드를 리본이 따라 밝힌다
  useEffect(() => {
    const cards = experiences
      .map((exp) => document.getElementById(`career-${exp.id}`))
      .filter((el): el is HTMLElement => el !== null);
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((entry) => entry.isIntersecting);
        if (hit) setScrollFocused(hit.target.id.replace("career-", ""));
      },
      { rootMargin: "-40% 0px -45% 0px", threshold: 0 },
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [setScrollFocused]);

  // 경력 섹션이 화면에 있는 동안에만 위쪽 고정 리본을 띄운다
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => setCareerInView(entries[0]?.isIntersecting ?? false),
      { rootMargin: "-72px 0px -30% 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [setCareerInView]);

  const activeId = focused ?? scrollFocused;

  return (
    <StSection id="career" ref={sectionRef} className={displayFont.variable}>
      {/* 경력을 보는 동안 위쪽에 붙어 따라오는 빠른 이동 바 */}
      <StStickySlot>
        <CareerRibbon variant="compact" />
      </StStickySlot>

      <StInner>
        <SectionTitle title="경력" />

        <StList>
          {experiences.map((exp) => (
            <CompanyCard key={exp.id} experienceId={exp.id} highlighted={activeId === exp.id} />
          ))}
        </StList>

        <StGraphDisclosure>
          <GraphToggle />
        </StGraphDisclosure>
      </StInner>
    </StSection>
  );
}

function CompanyCard({
  experienceId,
  highlighted,
}: {
  experienceId: string;
  highlighted: boolean;
}) {
  const exp = experiences.find((e) => e.id === experienceId);
  if (!exp) return null;

  return (
    <StCard id={`career-${exp.id}`} $highlighted={highlighted} $colorClass={exp.color}>
      <StHeader>
        <StStripe $colorClass={exp.color} aria-hidden="true" />
        <StHeaderText>
          <StCompanyRow>
            <span className="company">{exp.company}</span>
            <StChip $colorClass={exp.color}>주요 프로젝트 {exp.projects.length}개</StChip>
          </StCompanyRow>
          <span className="role">{exp.role}</span>
          <span className="period">{exp.period}</span>
        </StHeaderText>
      </StHeader>

      <StSummary>
        {exp.summary.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </StSummary>

      <StProjectList>
        {exp.projects.map((project) => (
          <StProjectRow key={project.title}>
            <div className="head">
              <strong>{project.title}</strong>
              <span className="period">{project.period}</span>
            </div>
            <p className="desc">{project.description}</p>
            <StStackRow>
              {project.techStack.map((tech) => (
                <span key={tech}>{tech}</span>
              ))}
            </StStackRow>
          </StProjectRow>
        ))}
      </StProjectList>

      <StDetailLink href={`/portfolio/experience/${exp.id}`}>
        {exp.company} 히스토리 보기 <OpenInNewIcon fontSize="inherit" />
      </StDetailLink>
    </StCard>
  );
}

/** 예전 커리어 그래프는 필요할 때만 펼쳐 본다 */
function GraphToggle() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <StGraphButton type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        커리어 그래프로 보기
        <StChevron $open={open} aria-hidden="true">
          <ExpandMoreIcon fontSize="inherit" />
        </StChevron>
      </StGraphButton>
      {open && <CareerGraph />}
    </>
  );
}

const StSection = styled.section`
  position: relative;
  background: ${({ theme }) => theme.colors.gray50};
  padding: 1.9rem 0;
  scroll-margin-top: ${STICKY_RIBBON_OFFSET};
`;

/* sticky 래퍼: 레이아웃을 밀지 않고 섹션 안에서만 따라온다 */
const StStickySlot = styled.div`
  position: sticky;
  top: 3.5rem;
  z-index: 15;
  height: 0;
  overflow: visible;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
`;

const StInner = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 0 1.5rem;

  @media ${({ theme }) => theme.media.mobile} {
    padding: 0 1.15rem;
  }
`;

const StList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

const StCard = styled.article<{ $highlighted: boolean; $colorClass: string }>`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 1.1rem;
  padding: 1.15rem 1.25rem 1.25rem;
  scroll-margin-top: ${STICKY_RIBBON_OFFSET};
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  ${({ $highlighted, theme, $colorClass }) =>
    $highlighted &&
    css`
      border-color: ${companyColor(theme, $colorClass)};
      box-shadow: 0 10px 24px -20px ${companyColor(theme, $colorClass)};
    `}

  @media ${({ theme }) => theme.media.mobile} {
    padding: 1rem 1rem 1.1rem;
  }
`;

const StHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const StStripe = styled.span<{ $colorClass: string }>`
  width: 6px;
  align-self: stretch;
  min-height: 2.6rem;
  border-radius: 999px;
  flex-shrink: 0;
  background: ${({ theme, $colorClass }) => companyColor(theme, $colorClass)};
`;

const StHeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  flex: 1;

  .role {
    font-size: 0.85rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray600};
  }

  .period {
    font-size: 0.78rem;
    color: ${({ theme }) => theme.semantic.subText};
    font-variant-numeric: tabular-nums;
  }
`;

const StCompanyRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;

  .company {
    font-size: 1.2rem;
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.text};
  }
`;

const StChip = styled.span<{ $colorClass: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray600};
  border: 1px solid ${({ theme }) => theme.semantic.border};
  background: ${({ theme }) => theme.colors.gray50};

  &::before {
    content: "";
    width: 0.4rem;
    height: 0.4rem;
    border-radius: 999px;
    background: ${({ theme, $colorClass }) => companyColor(theme, $colorClass)};
  }
`;

const StChevron = styled.span<{ $open: boolean }>`
  display: inline-flex;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.semantic.subText};
  transition: transform 0.2s ease;
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const StSummary = styled.ul`
  margin: 0.85rem 0 0;
  padding-left: 1.1rem;
  list-style: disc;
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 0.875rem;
  line-height: 1.65;
  word-break: keep-all;

  li + li {
    margin-top: 0.25rem;
  }
`;

const StProjectList = styled.div`
  margin-top: 1.1rem;
  padding-top: 1.1rem;
  border-top: 1px dashed ${({ theme }) => theme.semantic.border};
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem 1.5rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const StProjectRow = styled.div`
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem;
  }

  strong {
    font-size: 0.95rem;
    color: ${({ theme }) => theme.semantic.text};
  }

  .period {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.semantic.subText};
    font-variant-numeric: tabular-nums;
  }

  .desc {
    margin: 0.3rem 0 0;
    font-size: 0.85rem;
    line-height: 1.65;
    color: ${({ theme }) => theme.colors.gray600};
    white-space: pre-line;
    word-break: keep-all;
  }
`;

const StStackRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.45rem;

  span {
    padding: 0.12rem 0.5rem;
    border-radius: 0.4rem;
    background: ${({ theme }) => theme.colors.gray100};
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 0.7rem;
    font-weight: 600;
  }
`;

const StDetailLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 1rem;
  padding: 0.55rem 0.95rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.82rem;
  font-weight: 700;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.85;
  }
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: 2px;
  }
`;

const StGraphDisclosure = styled.div`
  margin-top: 1.25rem;
`;

const StGraphButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.55rem 0.95rem;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: 2px;
  }
`;
