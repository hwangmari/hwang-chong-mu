"use client";

import styled from "styled-components";
import { useMemo } from "react";

// 1. description 배열 타입 추가
export interface HistoryItem {
  id: number | string;
  date: string;
  title: string;
  description?: string[]; // 👈 추가됨
  url?: string;
}

interface ProjectItemListProps {
  items: HistoryItem[];
  title?: string;
  description?: string;
}

export default function ProjectItemList({
  items,
  title,
  description,
}: ProjectItemListProps) {
  const groupedData = useMemo(() => {
    if (!items || items.length === 0) return { years: [], groups: {} };

    const sortedList = [...items].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const groups: Record<string, HistoryItem[]> = {};

    sortedList.forEach((item) => {
      const year = item.date.split(".")[0];
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(item);
    });

    const years = Object.keys(groups).sort((a, b) => Number(b) - Number(a));

    return { years, groups };
  }, [items]);

  // 렌더링 헬퍼 함수 (링크/비링크 공통 구조)
  const renderContent = (item: HistoryItem) => (
    <>
      <StDate>{item.date.slice(5)}</StDate>

      {/* 2. 제목과 설명을 감싸는 컨테이너 (StContent) */}
      <StContent>
        <StTitle>{item.title}</StTitle>
        {item.description && item.description.length > 0 && (
          <StDescList>
            {item.description.map((desc, idx) => (
              <StDescItem key={idx}>{desc}</StDescItem>
            ))}
          </StDescList>
        )}
      </StContent>

      <StArrow>{item.url ? "↗" : "-"}</StArrow>
    </>
  );

  return (
    <StContainer>
      {(title || description) && (
        <StHeader>
          {title && <StPageTitle>{title}</StPageTitle>}
          {description && <StDescription>{description}</StDescription>}
        </StHeader>
      )}

      <StTimelineContainer>
        {groupedData.years.map((year) => (
          <StYearSection key={year}>
            <StLeftCol>
              <StStickyYear>{year}</StStickyYear>
            </StLeftCol>

            <StRightCol>
              {groupedData.groups[year].map((item) => (
                <StItemWrapper key={item.id}>
                  <StDot />
                  {item.url ? (
                    <StLink
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {renderContent(item)}
                    </StLink>
                  ) : (
                    <StDisabledBox>{renderContent(item)}</StDisabledBox>
                  )}
                </StItemWrapper>
              ))}
            </StRightCol>
          </StYearSection>
        ))}
      </StTimelineContainer>
    </StContainer>
  );
}

// --- 스타일 컴포넌트 ---

const StContainer = styled.div`
  width: 100%;
  padding: 0.5rem 0 0 0;
`;

const StHeader = styled.div`
  margin-bottom: 2rem;
  text-align: left;
`;

const StPageTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.2rem;
`;

const StDescription = styled.p`
  font-size: 0.85rem;
  color: #999;
`;

const StTimelineContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const StYearSection = styled.div`
  display: flex;
  align-items: flex-start;
`;

const StLeftCol = styled.div`
  width: 60px;
  flex-shrink: 0;
  position: sticky;
  top: 70px;
  z-index: 10;
  margin-bottom: 54px;
`;

const StStickyYear = styled.div`
  font-size: 1.1rem;
  font-weight: 800;
  color: #444;
  text-align: right;
  padding-right: 1rem;
  line-height: 1.2;
`;

const StRightCol = styled.div`
  flex: 1;
  border-left: 2px solid #e5e5e5;
  padding-bottom: 2rem;
`;

const StItemWrapper = styled.div`
  position: relative;
  padding-left: 1.25rem;
  margin-bottom: 12px; /* 간격 살짝 늘림 */
`;

const StDot = styled.div`
  position: absolute;
  left: -4px;
  top: 1.2rem; /* 카드 높이 변화에 따라 위치 조정 */
  width: 6px;
  height: 6px;
  background-color: #fff;
  border: 2px solid #ccc;
  border-radius: 50%;
  z-index: 1;
  transition: all 0.2s;
`;

// 기존 cardStyles에서 align-items를 flex-start로 변경 (내용이 길어질 수 있으므로)
const cardStyles = `
  display: flex;
  align-items: flex-start; 
  justify-content: space-between;
  padding: 1rem;
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  transition: all 0.2s;
`;

const StLink = styled.a`
  ${cardStyles}
  text-decoration: none;
  cursor: pointer;

  &:hover {
    background-color: #fff;
    border-color: #888;
    transform: translateX(2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &:hover ~ ${StDot}, &:hover ${StDot} {
    background-color: #555;
    border-color: #555;
  }
`;

const StDisabledBox = styled.div`
  ${cardStyles}
  background-color: #fcfcfc;
  color: #bbb;
  cursor: default;
`;

const StDate = styled.span`
  font-family: monospace;
  font-size: 0.75rem;
  color: #999;
  margin-right: 1rem;
  min-width: 35px;
  margin-top: 2px; /* 텍스트 줄맞춤 */
`;

/* 3. 새로 추가된 컨텐츠 래퍼 및 설명 스타일 */
const StContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const StTitle = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
`;

const StDescList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const StDescItem = styled.li`
  font-size: 0.85rem;
  color: #666;
  line-height: 1.5;
  position: relative;
  padding-left: 10px;
  margin-bottom: 2px;

  /* 불렛 포인트 커스텀 */
  &::before {
    content: "-";
    position: absolute;
    left: 0;
    color: #999;
  }
`;

const StArrow = styled.span`
  font-size: 0.8rem;
  color: #ddd;
  margin-left: 0.8rem;
  margin-top: 2px;
`;
