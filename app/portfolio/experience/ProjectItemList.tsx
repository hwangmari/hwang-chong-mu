"use client";

import styled from "styled-components";
import { useMemo } from "react";

// 데이터 타입 정의 (필요에 따라 types.ts로 분리 가능)
export interface HistoryItem {
  id: number | string;
  date: string; // format: "YYYY.MM.DD"
  title: string;
  url?: string;
}

interface ProjectItemListProps {
  items: HistoryItem[]; // 외부에서 주입받을 데이터
  title?: string; // 선택적: 제목 (예: Campaign Archive)
  description?: string; // 선택적: 설명
}

export default function ProjectItemList({
  items,
  title,
  description,
}: ProjectItemListProps) {
  const groupedData = useMemo(() => {
    // items가 없으면 빈 배열 처리
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

  return (
    <StContainer>
      {/* 제목이나 설명이 있을 때만 헤더 렌더링 */}
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
                      <StDate>{item.date.slice(5)}</StDate>
                      <StTitle>{item.title}</StTitle>
                      <StArrow>↗</StArrow>
                    </StLink>
                  ) : (
                    <StDisabledBox>
                      <StDate>{item.date.slice(5)}</StDate>
                      <StTitle>{item.title}</StTitle>
                      <StArrow>-</StArrow>
                    </StDisabledBox>
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

// --- 스타일 컴포넌트 (기존과 동일) ---

const StContainer = styled.div`
  width: 100%;
  margin: 0;
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
  margin-bottom: 8px;
`;

const StDot = styled.div`
  position: absolute;
  left: -4px;
  top: 0.9rem;
  width: 6px;
  height: 6px;
  background-color: #fff;
  border: 2px solid #ccc;
  border-radius: 50%;
  z-index: 1;
  transition: all 0.2s;
`;

const cardStyles = `
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1rem;
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 6px;
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
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
  margin-right: 0.8rem;
  min-width: 35px;
`;

const StTitle = styled.span`
  flex: 1;
  font-size: 0.9rem;
  font-weight: 500;
  color: #444;
`;

const StArrow = styled.span`
  font-size: 0.8rem;
  color: #ddd;
  margin-left: 0.5rem;
`;
