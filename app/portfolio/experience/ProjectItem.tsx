/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Image from "next/image";
import styled, { keyframes } from "styled-components";
import Typography from "@/components/common/Typography";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import ProjectItemList from "./ProjectItemList";

export default function ProjectItem({
  project,
  color,
}: {
  project: any;
  color: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasImages = project.images && project.images.length > 0;
  const [isListOpen, setIsListOpen] = useState(false);

  return (
    <StContainer>
      {/* 1. 상단: 타이틀, 링크, 기간 */}
      <StTitleGroup className="mb-4">
        <div className="flex items-center gap-2">
          <Typography variant="h3" as="h3">
            {project.title}
          </Typography>
          {project.link && (
            <StExternalLink
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
            </StExternalLink>
          )}
        </div>
        <StPeriodBadge>{project.period}</StPeriodBadge>
      </StTitleGroup>

      {/* 2. 설명: body2 유지 (요청사항 반영) */}
      <div className="mb-6">
        <Typography variant="body2" color="gray600">
          {project.description}
        </Typography>
      </div>

      {/* 3. 수행 업무 리스트 */}
      <div className="mb-6">
        <Typography variant="h4" color="gray800" className="block mb-3">
          수행 업무
        </Typography>
        <StTaskList>
          {project.tasks.map((task: string, i: number) => (
            <li key={i}>{task}</li>
          ))}
        </StTaskList>
      </div>

      {/* 4. 기술 스택 */}
      <StTechList>
        {project.techStack.map((tech: string) => (
          <StTechTag $customColor={color} key={tech}>
            {tech}
          </StTechTag>
        ))}
      </StTechList>

      {/* 5. 이미지 더보기 영역 */}
      {hasImages && (
        <StImageSection>
          <StToggleButton onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? "프로젝트 이미지 접기" : "프로젝트 이미지 보기"}
            {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </StToggleButton>

          {isOpen && (
            <StImageGrid>
              {project.images.map((img: string, idx: number) => (
                <StImageFrame key={idx}>
                  <StNextImage
                    src={img}
                    alt={`${project.title} screenshot ${idx + 1}`}
                    width={0}
                    height={0}
                    sizes="100vw"
                    priority={idx === 0}
                  />
                </StImageFrame>
              ))}
            </StImageGrid>
          )}
        </StImageSection>
      )}

      {project.projectItemList && (
        <StToggleArea>
          <StToggleButton onClick={() => setIsListOpen(!isListOpen)}>
            {isListOpen
              ? `${project.projectItemList.title} - 리스트 접기`
              : `${project.projectItemList.title} - 리스트 보기`}
            {isListOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </StToggleButton>

          {isListOpen && (
            <StToggleContent>
              <ProjectItemList
                items={project.projectItemList.items}
                title={project.projectItemList.title} // 필요하면 전달
                description={project.projectItemList.description} // 필요하면 전달
              />
            </StToggleContent>
          )}
        </StToggleArea>
      )}
    </StContainer>
  );
}

// ✨ 스타일 정의
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  padding: 1.75rem 1rem;
  border-radius: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s;

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  @media ${({ theme }) => theme.media.desktop} {
    padding: 2.5rem;
  }
`;

const StTitleGroup = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;

  @media ${({ theme }) => theme.media.desktop} {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

const StExternalLink = styled.a`
  color: ${({ theme }) => theme.colors.gray400};
  transition: color 0.2s;
  display: flex;
  align-items: center;

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.blue600};
  }
`;

const StPeriodBadge = styled.span`
  font-size: 0.85rem; /* ✅ 요청사항 반영: Badge 크기 증가 */
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray700};
  background-color: ${({ theme }) => theme.colors.gray200};
  padding: 0.35rem 0.6rem;
  border-radius: 0.35rem;
`;

const StTaskList = styled.ul`
  list-style-type: disc;
  list-style-position: outside;
  margin-left: 1.25rem;
  font-size: 1rem; /* ✅ 요청사항 반영: List 크기 증가 */
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.6;

  li + li {
    margin-top: 0.35rem;
  }
`;

const StTechList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 2rem;
  margin-top: 0.5rem;
`;

const StTechTag = styled.span<{ $customColor?: string }>`
  padding: 0.25rem 0.65rem;

  background-color: ${({ theme, $customColor }) => {
    // 값이 없을 경우 기본값
    if (!$customColor) return theme.colors.yellow200;

    // 문자열에 포함된 텍스트로 테마 색상 매핑
    if ($customColor.includes("orange-500")) return theme.colors.orange200;
    if ($customColor.includes("yellow-400")) return theme.colors.yellow200;
    if ($customColor.includes("blue-600")) return theme.colors.blue200;
    if ($customColor.includes("black")) return theme.colors.gray300;
    if ($customColor.includes("gray-400")) return theme.colors.gray100;

    // 매칭되는게 없으면 기본값
    return theme.colors.yellow200;
  }};
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 0.75rem; /* ✅ 요청사항 반영: Tag 크기 증가 */
  font-weight: 600;
  border-radius: 0.5rem;
`;

// === Image Section ===

const StImageSection = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray100};
  padding-top: 1.5rem;
  margin-top: 1.5rem;
`;

const StToggleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;

  font-size: 1rem; /* ✅ 요청사항 반영: Button Text 크기 증가 */
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray600};
  background-color: ${({ theme }) => theme.colors.gray50};
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  transition: all 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.gray900};
    background-color: ${({ theme }) => theme.colors.gray100};
  }

  @media ${({ theme }) => theme.media.desktop} {
    width: auto;
    justify-content: flex-start;
  }
`;

const StImageGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  margin-top: 1.5rem;
  animation: ${fadeIn} 0.5s ease-out;

  @media ${({ theme }) => theme.media.desktop} {
    grid-template-columns: 1fr 1fr;
  }
`;

const StImageFrame = styled.div`
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  position: relative;
`;

const StNextImage = styled(Image)`
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
`;

const StToggleArea = styled.div`
  margin-top: 1.5rem;
`;

const StToggleContent = styled.div`
  margin-top: 1.25rem;
  padding: 1.25rem;
  background-color: #fafafa;
  border-radius: 12px;
  border: 1px solid #eee;

  animation: fadeIn 0.3s ease-in-out;
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
