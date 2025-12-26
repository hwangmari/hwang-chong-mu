"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import styled, { keyframes } from "styled-components";
import ProjectItem from "./ProjectItem"; // (경로 확인 필요)
import Typography from "@/components/common/Typography"; // 👈 Typography 활용
import { experiences } from "@/data/experiences";

export default function ExperienceDetail() {
  const params = useParams();
  const id = params.id as string;
  const data = experiences.find((exp) => exp.id === id);

  if (!data) {
    return (
      <NotFoundContainer>
        <Typography variant="body1" color="gray500">
          찾을 수 없는 페이지입니다. 😢
        </Typography>
      </NotFoundContainer>
    );
  }

  return (
    <PageContainer>
      {/* 1. 헤더 */}
      <HeaderWrapper>
        <HeaderContent>
          <BackLink href="/portfolio">← 포트폴리오 메인으로 돌아가기</BackLink>

          <TitleRow>
            <CompanyDot $colorClass={data.color} />
            <Typography variant="h2" as="h2">
              {data.company}
            </Typography>
          </TitleRow>

          <Typography variant="h3" as="h3" color="gray600">
            {data.role}
          </Typography>
          <Typography variant="caption" color="gray400">
            {data.period}
          </Typography>
        </HeaderContent>
      </HeaderWrapper>

      {/* 2. 상세 프로젝트 리스트 */}
      <BodyContent>
        <SectionTitleWrapper>
          <Typography variant="h2" as="h2">
            🔥 Key Projects
          </Typography>
        </SectionTitleWrapper>

        <ProjectList>
          {data.projects.map((project, idx) => (
            <ProjectItem key={idx} project={project} />
          ))}
        </ProjectList>
      </BodyContent>
    </PageContainer>
  );
}

// ✨ 스타일 정의

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray900};
  font-family: ui-sans-serif, system-ui, sans-serif;
`;

const NotFoundContainer = styled.div`
  padding: 5rem 0;
  display: flex;
  justify-content: center;
  text-align: center;
`;

// === Header Styles ===
const HeaderWrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
`;

const HeaderContent = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 4rem 1.5rem;
`;

const BackLink = styled(Link)`
  display: inline-block;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray400};
  margin-bottom: 1.5rem;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.gray900};
  }
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

// 🔥 색상 매핑 로직 (ResumeSection과 동일)
const CompanyDot = styled.span<{ $colorClass: string }>`
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;

  /* 데이터 문자열에 따라 테마 색상 적용 */
  background-color: ${({ theme, $colorClass }) => {
    if ($colorClass.includes("orange-500")) return theme.colors.orange500;
    if ($colorClass.includes("yellow-400")) return theme.colors.yellow400;
    if ($colorClass.includes("blue-600")) return theme.colors.blue600;
    if ($colorClass.includes("black")) return theme.colors.black;
    if ($colorClass.includes("gray-400")) return theme.colors.gray400;
    return theme.colors.gray200;
  }};
`;

// === Body Styles ===
const BodyContent = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 3rem 1.5rem;

  animation: ${fadeInUp} 0.8s ease-out forwards;
`;

const SectionTitleWrapper = styled.div`
  margin-bottom: 2rem;
`;

const ProjectList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3rem;
`;
