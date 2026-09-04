"use client";

// 대표 프로젝트 3개. 회사 카드 안에 묻히기 아까운 것들을 큰 화면으로 따로 보여준다.
// 제목·설명·과업·이미지는 모두 data/experiences.tsx에 있는 값 그대로다.
import Image from "next/image";
import Link from "next/link";
import styled from "styled-components";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { experiences } from "@/data/experiences";
import type { Experience, Project } from "@/types/experiences";
import { displayFont } from "@/lib/fonts";
import { companyColor, companyInk } from "./companyColor";
import { Reveal, SectionTitle } from "./motion";

/**
 * 어떤 회사의 어떤 프로젝트를 앞세울지.
 * 29CM 사이트 전면 개편은 data/experiences.tsx에 이미지가 없어, 같은 회사의
 * public/images/29cm_*.png 중 하나를 대신 쓴다(아래 fallbackImage).
 */
const PICKS: { companyId: string; projectTitle: string; fallbackImage?: string }[] = [
  { companyId: "hanwha", projectTitle: "HSP 상담 플랫폼 마이그레이션" },
  { companyId: "kakao-ent", projectTitle: "카카오워크 할 일 (Todo)" },
  {
    companyId: "musinsa",
    projectTitle: "29CM 사이트 전면 개편 및 통합 운영",
    fallbackImage: "/images/29cm_c.png",
  },
];

const picked: { exp: Experience; project: Project; fallbackImage?: string }[] = PICKS.flatMap(
  ({ companyId, projectTitle, fallbackImage }) => {
    const exp = experiences.find((e) => e.id === companyId);
    const project = exp?.projects.find((p) => p.title === projectTitle);
    return exp && project ? [{ exp, project, fallbackImage }] : [];
  },
);

export default function SignatureProjects() {
  if (picked.length === 0) return null;

  return (
    <StSection id="signature" className={displayFont.variable}>
      <StInner>
        <SectionTitle title="대표 프로젝트" />

        <StGrid>
          {picked.map(({ exp, project, fallbackImage }) => {
            const image = project.images?.[0];
            const src = image?.src ?? fallbackImage;
            return (
              <Reveal key={project.title}>
                <StCard>
                  <StShot>
                    {src ? (
                      <Image
                        src={src}
                        alt={image?.alt ?? project.title}
                        fill
                        sizes="(max-width: 767px) 92vw, 320px"
                        style={{ objectFit: "contain" }}
                      />
                    ) : null}
                  </StShot>

                  <StBody>
                    <StCompanyChip $colorClass={exp.color}>{exp.company}</StCompanyChip>
                    <h3>{project.title}</h3>
                    <span className="period">{project.period}</span>
                    <p className="desc">{project.description}</p>
                    <ul>
                      {project.tasks.map((task) => (
                        <li key={task}>{task}</li>
                      ))}
                    </ul>
                    <StMore href={`/portfolio/experience/${exp.id}`}>
                      전체 과업 보기 <ArrowForwardIcon fontSize="inherit" />
                    </StMore>
                  </StBody>
                </StCard>
              </Reveal>
            );
          })}
        </StGrid>
      </StInner>
    </StSection>
  );
}

const StSection = styled.section`
  background: ${({ theme }) => theme.colors.white};
  padding: 1.9rem 0;
  border-top: 1px solid ${({ theme }) => theme.semantic.border};
`;

const StInner = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 0 1.5rem;

  @media ${({ theme }) => theme.media.mobile} {
    padding: 0 1.15rem;
  }
`;

const StGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  perspective: 1000px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const StCard = styled.article`
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 2px solid ${({ theme }) => theme.semantic.border};
  border-radius: 1.1rem;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.white};
  transition: border-color 0.18s ease;

  &:hover {
    border-color: ${({ theme }) => theme.semantic.primary};
  }
`;

const StShot = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 1;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.gray100};
  border-bottom: 1px solid ${({ theme }) => theme.semantic.border};

  @media (max-width: 767px) {
    aspect-ratio: 21 / 9;
  }
`;

const StBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem 1.1rem 1.15rem;
  flex: 1;

  h3 {
    margin: 0.2rem 0 0;
    font-size: 1.02rem;
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.text};
    word-break: keep-all;
  }

  .period {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.semantic.subText};
    font-variant-numeric: tabular-nums;
  }

  .desc {
    margin: 0.35rem 0 0;
    font-size: 0.85rem;
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.gray600};
    white-space: pre-line;
    word-break: keep-all;
  }

  ul {
    margin: 0.55rem 0 0;
    padding-left: 1.05rem;
    list-style: disc;
    font-size: 0.8rem;
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.gray600};
    word-break: keep-all;
  }

  li + li {
    margin-top: 0.25rem;
  }
`;

const StCompanyChip = styled.span<{ $colorClass: string }>`
  align-self: flex-start;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
  color: ${({ theme, $colorClass }) => companyInk(theme, $colorClass)};
  background: ${({ theme, $colorClass }) => companyColor(theme, $colorClass)};
`;

const StMore = styled(Link)`
  margin-top: auto;
  padding-top: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.primary};

  &:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: 3px;
    border-radius: 4px;
  }
`;
