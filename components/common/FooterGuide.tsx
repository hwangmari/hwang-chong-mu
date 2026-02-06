"use client";

import styled from "styled-components";
import { ReactNode } from "react";

interface TipItem {
  icon: ReactNode; // 이모지 or MUI 아이콘
  title: string;
  description: ReactNode; // 줄바꿈 등을 위해 ReactNode로
}

interface FooterGuideProps {
  title: string; // 전체 제목 (예: 약속 잡기 꿀팁)
  story?: {
    /** 브랜드 스토리 (선택 사항) */
    title: string;
    content: ReactNode;
    solution?: {
      title: string;
      content: ReactNode;
    };
  };
  tips: TipItem[]; // 팁 리스트
}

export default function FooterGuide({ title, story, tips }: FooterGuideProps) {
  return (
    <StFooterContainer>
      {/* 1. 브랜드 스토리 (있을 때만 렌더링) */}
      {story && (
        <StStoryCard>
          <StCardTitle>{story.title}</StCardTitle>
          <StContent>
            {story.content}
            {story.solution && (
              <StSolutionBox>
                <StSolutionTitle>{story.solution.title}</StSolutionTitle>
                <div>{story.solution.content}</div>
              </StSolutionBox>
            )}
          </StContent>
        </StStoryCard>
      )}

      {/* 2. 꿀팁 리스트 */}
      <StTipsCard $hasStory={!!story}>
        <StCardTitle>{title}</StCardTitle>
        <StTipList>
          {tips.map((tip, index) => (
            <StTipItem key={index}>
              <StTipIconWrapper>{tip.icon}</StTipIconWrapper>
              <StTipText>
                <strong>{tip.title}</strong>
                <p>{tip.description}</p>
              </StTipText>
            </StTipItem>
          ))}
        </StTipList>
      </StTipsCard>
    </StFooterContainer>
  );
}


const StFooterContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
  gap: 1.5rem;
`;

const StCardTitle = styled.h4`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray800};
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StStoryCard = styled.div`
  background-color: ${({ theme }) => theme.colors.gray100};
  padding: 1.5rem;
  border-radius: 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
`;

const StContent = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.6;
`;

const StSolutionBox = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  margin-top: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
`;

const StSolutionTitle = styled.p`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.blue600};
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const StTipsCard = styled.div<{ $hasStory: boolean }>`
  background-color: #f0fdf4; /* 약속(노랑) vs 습관(초록) 테마 분리 가능하지만 일단 통일 */
  background-color: ${({ $hasStory }) =>
    $hasStory
      ? "#fefce8"
      : "#f1f5f9"}; /* 스토리가 있으면 노랑(약속), 없으면 회색(습관) */
  padding: 1.5rem;
  border-radius: 1.25rem;
  border: 1px solid ${({ $hasStory }) => ($hasStory ? "#fef9c3" : "#e2e8f0")};
`;

const StTipList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const StTipItem = styled.li`
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const StTipIconWrapper = styled.div`
  background: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  font-size: 1.2rem;
`;

const StTipText = styled.div`
  font-size: 0.9rem;
  line-height: 1.5;
  padding-top: 2px;

  strong {
    display: block;
    color: #1e293b;
    margin-bottom: 4px;
    font-weight: 700;
  }

  p {
    color: #64748b;
    font-size: 0.85rem;
  }
`;
