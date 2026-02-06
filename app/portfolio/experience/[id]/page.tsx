"use client";

import { useParams } from "next/navigation";
import styled, { keyframes } from "styled-components";
import ProjectItem from "../ProjectItem"; // (경로 확인 필요)
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
    <StPageContainer>
      {/* 1. 헤더 */}
      <HeaderWrapper>
        <HeaderContent>
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
          {data.workSummary && (
            <DescriptionWrapper>
              <Typography variant="h4" as="h4" className="mb-2">
                Work Summary
              </Typography>

              <Typography color="gray700">{data.workSummary}</Typography>
            </DescriptionWrapper>
          )}
        </HeaderContent>
      </HeaderWrapper>

      {/* 2. 상세 프로젝트 리스트 */}
      <BodyContent>
        <SectionTitleWrapper>
          <Typography variant="h2" as="h2">
            Key Projects
          </Typography>
        </SectionTitleWrapper>

        <ProjectList>
          {data.projects.map((project, idx) => (
            <ProjectItem key={idx} project={project} color={data.color} />
          ))}
        </ProjectList>
      </BodyContent>
    </StPageContainer>
  );
}

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StPageContainer = styled.div`
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

const HeaderWrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
`;

const HeaderContent = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 3rem 1.25rem 2rem;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.5rem;
`;

const CompanyDot = styled.span<{ $colorClass: string }>`
  width: 12px;
  height: 26px;
  border-radius: 7px;

  background-color: ${({ theme, $colorClass }) => {
    if ($colorClass.includes("orange-500")) return theme.colors.orange500;
    if ($colorClass.includes("yellow-400")) return theme.colors.yellow400;
    if ($colorClass.includes("blue-600")) return theme.colors.blue600;
    if ($colorClass.includes("black")) return theme.colors.black;
    if ($colorClass.includes("gray-400")) return theme.colors.gray400;
    return theme.colors.gray200;
  }};
`;

const BodyContent = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 3rem 1.25rem;

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

const DescriptionWrapper = styled.div`
  margin-top: 2rem; /* 프로젝트 리스트와의 간격 */
  padding-top: 1rem;
  border-top: 1px dashed ${({ theme }) => theme.colors.gray300}; /* 구분선 (선택사항) */
  white-space: pre-wrap; /* 줄바꿈 등 서식을 유지 */
`;
