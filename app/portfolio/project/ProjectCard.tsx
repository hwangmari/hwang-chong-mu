"use client";

import { Typography } from "@hwangchongmu/ui";
import Link from "next/link";
import { ReactNode } from "react";
import styled from "styled-components";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LogicFlowChart, { DevLog } from "./ProjectVisuals";
import ProjectImageViewer, {
  ProjectImage,
} from "@/components/common/ProjectImageViewer";
import ToyPreview from "./ToyPreview";
import { useCareerFocus } from "../CareerFocusContext";

interface ProjectCardProps {
  anchorId?: string;
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
  anchorId,
  title,
  period,
  linkUrl,
  description,
  details,
  logicSteps,
  historyLogs,
  projectImages,
}: ProjectCardProps) {
  // 펼침 여부는 포트폴리오 공용 통로가 들고 있다 (위쪽 빠른 이동 메뉴에서 눌러도 열린다)
  const { isOpen, toggleOpen } = useCareerFocus();
  const cardKey = anchorId ?? title;
  const open = isOpen(cardKey);
  const reduced = useReducedMotion();

  const detailItems: {
    label: string;
    type: "problem" | "solution" | "tech";
    content: ReactNode;
  }[] = [
    { label: "⚠️ 기획 배경", type: "problem", content: details.problem },
    { label: "💡 해결 전략", type: "solution", content: details.solution },
    { label: "🛠 기술 구현", type: "tech", content: details.tech },
  ];

  const panelId = `${anchorId ?? title}-panel`;

  return (
    <StToyRow id={anchorId}>
      {/* 윗단: 왼쪽 설명 / 오른쪽 미리보기. 두 칸은 같은 줄에서 아래 끝이 맞는다 */}
      <StRowMain>
        <StRowText>
          <StHeader>
            <div className="title-area">
              <Typography variant="h3" as="h3">
                {title}
              </Typography>
              <span className="period">{period}</span>
            </div>
          </StHeader>

          {/* 메인 설명은 항상 전부 보인다 */}
          <StDescriptionBody>
            <Typography variant="body2" color="gray700">
              {description}
            </Typography>
          </StDescriptionBody>

          <StActions>
            <StMoreButton
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => toggleOpen(cardKey)}
            >
              {open ? "접기" : "자세히 보기"}
              <StChevron $open={open} aria-hidden="true">
                <ExpandMoreIcon fontSize="inherit" />
              </StChevron>
            </StMoreButton>

            <StServiceLink
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="link-content">
                바로가기 <OpenInNewIcon fontSize="inherit" />
              </span>
            </StServiceLink>
          </StActions>
        </StRowText>

        <StRowAside>
          <ToyPreview
            anchorId={anchorId}
            title={title}
            images={projectImages}
          />
        </StRowAside>
      </StRowMain>

      {/* 아랫단: 자세히 보기는 두 칸 아래에 줄 전체 너비로 열린다 */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="panel"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={reduced ? {} : { height: "auto", opacity: 1 }}
            exit={reduced ? {} : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <StPanelInner>
              <StDetailGrid>
                {detailItems.map((item) => (
                  <StDetailsBox key={item.type}>
                    <StDetailRow>
                      <StDetailLabel $type={item.type}>
                        {item.label}
                      </StDetailLabel>
                      <div className="content">{item.content}</div>
                    </StDetailRow>
                  </StDetailsBox>
                ))}
              </StDetailGrid>

              {/* 로직 흐름도 */}
              {logicSteps && <LogicFlowChart />}

              {/* 업데이트 히스토리 */}
              {historyLogs && <DevLog logs={historyLogs} />}

              {/* 이미지 뷰어 */}
              <ProjectImageViewer images={projectImages} projectTitle={title} />
            </StPanelInner>
          </motion.div>
        )}
      </AnimatePresence>
    </StToyRow>
  );
}

const StToyRow = styled.article`
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.white};
  padding: 1.1rem 1.15rem 1.15rem;
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  position: relative;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease;
  scroll-margin-top: 5rem;

  &:hover,
  &:focus-within {
    border-color: ${({ theme }) => theme.semantic.primary};
    transform: translateY(-2px);

    h3 {
      text-decoration: underline;
      text-decoration-color: ${({ theme }) => theme.semantic.primary};
      text-decoration-thickness: 2px;
      text-underline-offset: 4px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover,
    &:focus-within {
      transform: none;
    }
  }

  @media (max-width: 767px) {
    padding: 1rem;
  }
`;

/* 데스크톱: 설명 칸이 조금 더 넓고, 두 칸 아래 끝이 맞도록 stretch */
const StRowMain = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  align-items: stretch;
  gap: 1.25rem;

  @media (max-width: 1023px) {
    gap: 0.85rem;
  }

  @media (max-width: 767px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const StRowText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const StRowAside = styled.div`
  display: flex;
  min-width: 0;

  /* 모바일에서는 미리보기가 위, 설명이 아래 */
  @media (max-width: 767px) {
    order: -1;
  }
`;

const StHeader = styled.div`
  margin-bottom: 0.5rem;

  .title-area {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;

    h3 {
      font-size: 1.05rem;
      line-height: 1.35;
    }

    .period {
      font-size: 12px;
      color: ${({ theme }) => theme.colors.gray500};
      font-weight: 500;
    }
  }
`;

const StActions = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: auto;
  padding-top: 0.15rem;
`;

const StServiceLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.6rem;
  background-color: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.white};

  font-size: 12px;
  font-weight: 700;
  border-radius: 2rem;
  transition: opacity 0.2s;
  flex-shrink: 0;

  &:hover {
    opacity: 0.8;
  }
`;

const StDescriptionBody = styled.div`
  margin-bottom: 0.7rem;
  max-width: 72ch;
  line-height: 1.6;
  font-size: 0.85rem;

  @media (max-width: 767px) {
    font-size: 0.82rem;
  }
`;

const StMoreButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.gray50};
  color: ${({ theme }) => theme.colors.gray700};
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray100};
  }
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: 2px;
  }
`;

const StChevron = styled.span<{ $open: boolean }>`
  display: inline-flex;
  font-size: 1.15rem;
  transition: transform 0.25s ease;
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const StPanelInner = styled.div`
  padding-top: 1rem;
`;

const StDetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
`;

const StDetailsBox = styled.div`
  background-color: ${({ theme }) => theme.colors.gray100};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StDetailRow = styled.div`
  display: flex;
  align-items: baseline;
  line-height: 1.6;

  font-size: 13px;

  .content {
    flex: 1;
    color: ${({ theme }) => theme.colors.gray700};
    max-width: 72ch;
    line-height: 1.75;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.4rem;
  }
`;

const StDetailLabel = styled.div<{ $type: "problem" | "solution" | "tech" }>`
  font-weight: 700;
  min-width: 90px;
  flex-shrink: 0;

  color: ${({ $type, theme }) =>
    $type === "problem"
      ? theme.semantic.danger
      : $type === "solution"
        ? theme.semantic.primary
        : theme.semantic.subText};
`;
