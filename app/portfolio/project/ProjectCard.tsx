"use client";

import Typography from "@/components/common/Typography";
import Link from "next/link";
import { ReactNode } from "react";
import styled from "styled-components";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LogicFlowChart, { DevLog } from "./ProjectVisuals";
import ProjectImageViewer, {
  ProjectImage,
} from "@/components/common/ProjectImageViewer";

interface ProjectCardProps {
  title: string;
  period: string;
  linkUrl: string;
  description: ReactNode;
  details: {
    problem: ReactNode;
    solution: ReactNode;
    tech: ReactNode;
  };
  logicSteps?: string[];
  historyLogs?: { ver: string; date: string; content: string }[];
  projectImages?: ProjectImage[];
}

export default function ProjectCard({
  title,
  period,
  linkUrl,
  description,
  details,
  logicSteps,
  historyLogs,
  projectImages,
}: ProjectCardProps) {
  const detailItems: {
    label: string;
    type: "problem" | "solution" | "tech";
    content: ReactNode;
  }[] = [
    { label: "⚠️ 기획 배경", type: "problem", content: details.problem },
    { label: "💡 해결 전략", type: "solution", content: details.solution },
    { label: "🛠 기술 구현", type: "tech", content: details.tech },
  ];

  return (
    <StCardContainer>
      {/* 상단: 제목 및 링크 */}
      <StHeader>
        <div className="title-area">
          <Typography variant="h3" as="h3">
            {title}
          </Typography>
          <span className="period">{period}</span>
        </div>

        <StServiceLink href={linkUrl} target="_blank" rel="noopener noreferrer">
            <span className="link-content">
              서비스 바로가기 <OpenInNewIcon fontSize="inherit" />
            </span>
        </StServiceLink>
      </StHeader>

      {/* 메인 설명 */}
      <StDescriptionBody>
        <Typography variant="body2" color="gray700">
          {description}
        </Typography>
      </StDescriptionBody>

      {/* ✨ 상세 내용 (다시 리스트 형태로 복귀 + 가독성 개선) */}
      <StDetailsBox>
        {detailItems.map((item) => (
          <StDetailRow key={item.type}>
            <StDetailLabel $type={item.type}>{item.label}</StDetailLabel>
            <div className="content">{item.content}</div>
          </StDetailRow>
        ))}
      </StDetailsBox>

      {/* 로직 흐름도 */}
      {logicSteps && <LogicFlowChart />}

      {/* 업데이트 히스토리 */}
      {historyLogs && <DevLog logs={historyLogs} />}

      {/* 이미지 뷰어 */}
      <ProjectImageViewer images={projectImages} projectTitle={title} />
    </StCardContainer>
  );
}

const StCardContainer = styled.article`
  background-color: ${({ theme }) => theme.colors.white};
  padding: 2.5rem;
  border-radius: 1.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  transition: all 0.3s ease-in-out;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const StHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;

  .title-area {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .period {
      /* 🔹 13px 적용 */
      font-size: 13px;
      color: ${({ theme }) => theme.colors.gray500};
      font-weight: 500;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const StServiceLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem; /* 패딩도 폰트에 맞춰 살짝 줄임 */
  background-color: ${({ theme }) => theme.colors.black};
  color: #fff;

  /* 🔹 13px 적용 */
  font-size: 13px;
  font-weight: 600;
  border-radius: 2rem;
  transition: opacity 0.2s;
  flex-shrink: 0;

  &:hover {
    opacity: 0.8;
  }
`;

const StDescriptionBody = styled.div`
  margin-bottom: 1rem;
`;

/* ✨ Compact Details Box */
const StDetailsBox = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StDetailRow = styled.div`
  display: flex;
  align-items: baseline;
  line-height: 1.6;

  /* 🔹 핵심: 상세 내용 13px 적용 */
  font-size: 13px;

  .content {
    flex: 1;
    color: #495057;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.4rem;
  }
`;

/* ✨ Semantic Labels */
const StDetailLabel = styled.div<{ $type: "problem" | "solution" | "tech" }>`
  font-weight: 700;
  min-width: 90px;
  flex-shrink: 0;

  color: ${({ $type }) =>
    $type === "problem"
      ? "#E53E3E"
      : $type === "solution"
        ? "#3182CE"
      : "#718096"};
`;
