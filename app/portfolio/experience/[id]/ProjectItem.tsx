"use client";

import { useState } from "react";
import Image from "next/image";
import styled, { keyframes } from "styled-components";
import Typography from "@/components/common/Typography";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProjectItem({ project }: { project: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasImages = project.images && project.images.length > 0;

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

      {/* 2. 설명 */}
      <div className="mb-6">
        <Typography variant="body2" color="gray600">
          {project.description}
        </Typography>
      </div>

      {/* 3. 수행 업무 리스트 */}
      <div className="mb-6">
        <Typography variant="label" color="gray800" className="block mb-2">
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
          <StTechTag key={tech}>{tech}</StTechTag>
        ))}
      </StTechList>

      {/* 5. 이미지 더보기 영역 */}
      {hasImages && (
        <StImageSection>
          <StToggleButton onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? "🔼 이미지 접기" : "📷 프로젝트 이미지 보기"}
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
  padding: 1.5rem;
  border-radius: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s;

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  @media ${({ theme }) => theme.media.desktop} {
    padding: 2rem;
  }
`;

const StTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;

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
    width: 1rem;
    height: 1rem;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.blue600};
  }
`;

const StPeriodBadge = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray400};
  background-color: ${({ theme }) => theme.colors.gray50};
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
`;

const StTaskList = styled.ul`
  list-style-type: disc;
  list-style-position: outside;
  margin-left: 1rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.625;

  li + li {
    margin-top: 0.25rem;
  }
`;

const StTechList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const StTechTag = styled.span`
  padding: 0.25rem 0.75rem;
  background-color: ${({ theme }) => theme.colors.yellow200};
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 0.5rem;
`;

// === Image Section ===

const StImageSection = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray100};
  padding-top: 1rem;
  margin-top: 1rem;
`;

const StToggleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;

  font-size: 0.875rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
  background-color: ${({ theme }) => theme.colors.gray50};
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  transition: all 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.gray900};
  }

  @media ${({ theme }) => theme.media.desktop} {
    width: auto;
    justify-content: flex-start;
  }
`;

const StImageGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-top: 1rem;
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
