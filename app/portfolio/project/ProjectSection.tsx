"use client";

import Link from "next/link";
import {
  StProjectSection,
  StSectionInner,
  StHeaderGroup,
  StCommonStackWrapper,
  StCoreBadge,
  StPhilosophyBox,
  StUiKitBanner,
} from "./ProjectSection.styled";
import ProjectList from "./ProjectList";
import { SectionTitle } from "../motion";
import { TOY_PROJECTS } from "./toyProjects";
import { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import styled from "styled-components";
import { displayFont } from "@/lib/fonts";

const CORE_STACK = [
  "Claude Code",
  "Gemini",
  "OpenAI Codex",
  "Next.js 14",
  "TypeScript",
  "Supabase",
  "Vercel",
];

export default function ProjectSection() {
  const [philosophyOpen, setPhilosophyOpen] = useState(false);

  return (
    <StProjectSection id="toy-projects" className={displayFont.variable}>
      <StSectionInner>
        {/* 섹션 타이틀 & 공통 스택 영역 */}
        <StHeaderGroup>
          <SectionTitle title={`🚀 Toy Projects · ${TOY_PROJECTS.length}개`} />

          {/* 개발 철학 및 시너지 강조 영역 */}
          <StPhilosophyBox>
            <p className="catchphrase">
              &quot;Real Problems, Practical Solutions.&quot;
            </p>
            <StPhilosophyToggle
              type="button"
              aria-expanded={philosophyOpen}
              aria-controls="toy-philosophy"
              onClick={() => setPhilosophyOpen((v) => !v)}
            >
              {philosophyOpen ? "접기" : "어떻게 만들었는지 보기"}
              <StChevron $open={philosophyOpen} aria-hidden="true">
                <ExpandMoreIcon fontSize="inherit" />
              </StChevron>
            </StPhilosophyToggle>
            {/* 🔹 공통 기술 스택 */}
            <StCommonStackWrapper hidden={!philosophyOpen}>
              <span className="label">Core Tech Stack :</span>
              <div className="badge-list">
                {CORE_STACK.map((tech) => (
                  <StCoreBadge
                    key={tech}
                    $isAi={
                      tech.includes("Gemini") || tech.includes("OpenAI Codex")
                    }
                    $isClaude={tech.includes("Claude")}
                  >
                    {tech}
                  </StCoreBadge>
                ))}
              </div>
            </StCommonStackWrapper>

            <p
              className="description"
              id="toy-philosophy"
              hidden={!philosophyOpen}
            >
              이 프로젝트들은 제가 <b>직접 사용하기 위해</b> 필요성을 정의하고
              설계한 서비스들입니다.
              <br />
              <b>사용자 동선과 상황</b>을 먼저 시뮬레이션해 기능을 정리하고,
              불필요한 요소를 덜어내 <b>핵심 문제 해결</b>에 집중했습니다.
              <br />
              <br />
              구현 과정에서는 AI를 활용해 반복 작업을 줄였고, 저는{" "}
              <b>전체 구조 설계</b>, <b>코드 리팩토링</b>,{" "}
              <b>버전 관리와 유지보수</b>에 집중했습니다.
              <br />
              <br />
              <b>[ 사용 → 문제 인식 → 개선 → 구조 정리 ]</b>
              <br />이 반복을 통해 단순 구현을 넘어{" "}
              <b>기획부터 코드 관리까지</b> 이어지는 개발 경험을 쌓아왔습니다.
            </p>
          </StPhilosophyBox>
        </StHeaderGroup>

        <StUiKitBanner as={Link} href="/ui-kit">
          <div className="text-group">
            <span className="eyebrow">Shared UI</span>
            <strong>UI Kit 모음집 보러가기</strong>
            <p>
              황총무에서 분리한 공용 컴포넌트와 스타일 토큰 문서를 한 화면에서
              확인할 수 있습니다.
            </p>
          </div>
          <span className="cta">/ui-kit</span>
        </StUiKitBanner>

        <ProjectList />
      </StSectionInner>
    </StProjectSection>
  );
}

const StPhilosophyToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray700};
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: 2px;
  }
`;

const StChevron = styled.span<{ $open: boolean }>`
  display: inline-flex;
  font-size: 1.1rem;
  transition: transform 0.25s ease;
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
