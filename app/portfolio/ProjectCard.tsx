"use client";

import Typography from "@/components/common/Typography";
import Link from "next/link";
import { ReactNode } from "react";
import styled from "styled-components";
import LogicFlowChart, { DevLog } from "./ProjectVisuals";

interface ProjectCardProps {
  title: string;
  period: string;
  linkUrl: string;
  description: ReactNode;
  techStack?: string[];
  details: {
    problem: string;
    solution: string;
    tech: string;
  };
  logicSteps?: string[];
  edgeCase?: { condition: string; result: string };
  historyLogs?: { ver: string; date: string; content: string }[];
}

export default function ProjectCard({
  title,
  period,
  linkUrl,
  description,
  techStack,
  details,
  logicSteps,
  historyLogs,
}: ProjectCardProps) {
  return (
    <StCardContainer>
      {/* 상단: 제목, 뱃지, 링크 */}
      <StHeader>
        <StTitleGroup>
          <StTitleRow>
            {/* Logic Component: Typography */}
            <Typography variant="h3" as="h3">
              {title}
            </Typography>
          </StTitleRow>
          <Typography variant="caption" color="gray500">
            {period}
          </Typography>
        </StTitleGroup>

        <StServiceLink href={linkUrl} target="_blank">
          서비스 바로가기 🔗
        </StServiceLink>
      </StHeader>

      {/* 설명 및 기술 스택 */}
      <StBody>
        <StDescriptionWrapper>
          <Typography variant="body2" color="gray700">
            {description}
          </Typography>
        </StDescriptionWrapper>

        <StTechStackList>
          {techStack?.map((tech) => (
            <StTechTag key={tech}>{tech}</StTechTag>
          ))}
        </StTechStackList>
      </StBody>

      {/* 상세 내용 (Problem / Solution / Tech) */}
      <StDetailsBox>
        <StDetailRow>
          <StDetailLabel>기획 배경:</StDetailLabel> {details.problem}
        </StDetailRow>
        <StDetailRow>
          <StDetailLabel>해결 전략:</StDetailLabel> {details.solution}
        </StDetailRow>
        <StDetailRow>
          <StDetailLabel>기술 구현:</StDetailLabel> {details.tech}
        </StDetailRow>
      </StDetailsBox>

      {/* ✅ 로직 흐름도 (데이터가 있을 때만 렌더링) */}
      {logicSteps && <LogicFlowChart />}

      {/* ✅ 업데이트 히스토리 (데이터가 있을 때만 렌더링) */}
      {historyLogs && <DevLog logs={historyLogs} />}
    </StCardContainer>
  );
}

// ✨ 스타일 정의 (St 프리픽스 적용)

const StCardContainer = styled.article`
  background-color: ${({ theme }) => theme.colors.white};
  padding: 2rem;
  border-radius: 1.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  transition: box-shadow 0.3s;

  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
`;

const StHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media ${({ theme }) => theme.media.desktop} {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
`;

const StTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const StTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
`;

const StServiceLink = styled(Link)`
  padding: 0.5rem 1.25rem;
  background-color: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.white};
  font-weight: 700;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.black};
  }
`;

const StBody = styled.div`
  margin-bottom: 1.5rem;
`;

const StDescriptionWrapper = styled.div`
  margin-bottom: 1rem;
`;

const StTechStackList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const StTechTag = styled.span`
  padding: 0.25rem 0.75rem;
  background-color: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0.5rem;
`;
const StDetailsBox = styled.div`
  background-color: ${({ theme }) => theme.colors.gray50 || "#F8F9FA"};

  border: 1px solid ${({ theme }) => theme.colors.gray200 || "#E9ECEF"};

  padding: 1.25rem;
  border-radius: 1rem;
  font-size: 0.875rem;

  color: ${({ theme }) => theme.colors.gray600 || "#495057"};

  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const StDetailRow = styled.p`
  line-height: 1.6;
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
`;

const StDetailLabel = styled.b`
  color: ${({ theme }) => theme.colors.gray800 || "#343A40"};
  font-weight: 700;
  min-width: 50px;
  flex-shrink: 0;
`;
