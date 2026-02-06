"use client";

import Typography from "@/components/common/Typography";
import {
  StProjectSection,
  StSectionInner,
  StHeaderGroup,
  StSectionTitleWrapper,
  StCommonStackWrapper,
  StCoreBadge,
  StPhilosophyBox,
} from "./ProjectSection.styled";
import ProjectList from "./ProjectList";

// 상단에 정의된 스택 배열
const CORE_STACK = [
  "Gemini",
  "OpenAI Codex",
  "Next.js 14",
  "TypeScript",
  "Supabase",
  "Vercel",
];

export default function ProjectSection() {
  return (
    <StProjectSection>
      <StSectionInner>
        {/* 섹션 타이틀 & 공통 스택 영역 */}
        <StHeaderGroup>
          <StSectionTitleWrapper>
            <Typography variant="h2" as="h2">
              🚀 Toy Projects
            </Typography>
          </StSectionTitleWrapper>

          {/* 🔹 공통 기술 스택 */}
          <StCommonStackWrapper>
            <span className="label">Core Tech Stack :</span>
            <div className="badge-list">
              {CORE_STACK.map((tech) => (
                <StCoreBadge
                  key={tech}
                  $isAi={
                    tech.includes("Gemini") || tech.includes("OpenAI Codex")
                  }
                >
                  {tech}
                </StCoreBadge>
              ))}
            </div>
          </StCommonStackWrapper>

          {/* 개발 철학 및 시너지 강조 영역 */}
          <StPhilosophyBox>
            <p className="catchphrase">
              &quot;Real Problems, Practical Solutions.&quot;
            </p>
            <p className="description">
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

        <ProjectList />
      </StSectionInner>
    </StProjectSection>
  );
}
