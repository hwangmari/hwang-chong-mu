"use client";

import styled from "styled-components";
import { useMemo } from "react";
import { CAMPAIGN_LIST, CampaignItem } from "../../../data/constants";

export default function ProjectItemList() {
  // 로직은 기존과 동일
  const groupedData = useMemo(() => {
    const sortedList = [...CAMPAIGN_LIST].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const groups: Record<string, CampaignItem[]> = {};

    sortedList.forEach((item) => {
      const year = item.date.split(".")[0];
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(item);
    });

    const years = Object.keys(groups).sort((a, b) => Number(b) - Number(a));

    return { years, groups };
  }, []);

  return (
    <StContainer>
      <StHeader>
        <StPageTitle>Campaign Archive</StPageTitle>
        <StDescription>2017 - 2020 29CM PT Campaign History</StDescription>
      </StHeader>

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

// --- 스타일 컴포넌트 수정됨 ---

const StContainer = styled.div`
  width: 100%;
  margin: 0;
  padding: 0.5rem 0 0 0; // 상단 패딩 최소화
`;

const StHeader = styled.div`
  margin-bottom: 2rem;
  text-align: left;
`;

const StPageTitle = styled.h3`
  // h2 -> h3
  font-size: 1.1rem; // 2.2rem -> 1.1rem 대폭 축소
  font-weight: 700;
  color: #333;
  margin-bottom: 0.2rem;
`;

const StDescription = styled.p`
  font-size: 0.85rem; // 1rem -> 0.85rem
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
  font-size: 1.1rem; // 1.8rem -> 1.1rem 축소
  font-weight: 800;
  color: #444;
  text-align: right;
  padding-right: 1rem; // 간격 축소
  line-height: 1.2;
`;

const StRightCol = styled.div`
  flex: 1;
  border-left: 2px solid #e5e5e5;
  padding-bottom: 2rem; // 3rem -> 2rem
`;

const StItemWrapper = styled.div`
  position: relative;
  padding-left: 1.25rem; // 2rem -> 1.25rem
  margin-bottom: 8px; // 12px -> 8px
`;

const StDot = styled.div`
  position: absolute;
  left: -4px; // 선 두께 고려 (-1 + -3)
  top: 0.9rem; // 카드 높이에 맞춰 조정
  width: 6px; // 8px -> 6px
  height: 6px; // 8px -> 6px
  background-color: #fff;
  border: 2px solid #ccc;
  border-radius: 50%;
  z-index: 1;
  transition: all 0.2s;
`;

// 카드 공통 스타일 (패딩과 폰트 축소)
const cardStyles = `
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1rem; // 1rem 1.25rem -> 0.6rem 1rem
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
    background-color: #fff; // 배경색 유지
    border-color: #888;
    transform: translateX(2px); // 이동 거리 축소
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
  font-size: 0.75rem; // 0.85rem -> 0.75rem
  color: #999;
  margin-right: 0.8rem;
  min-width: 35px;
`;

const StTitle = styled.span`
  flex: 1;
  font-size: 0.9rem; // 1rem -> 0.9rem
  font-weight: 500; // 600 -> 500
  color: #444;
`;

const StArrow = styled.span`
  font-size: 0.8rem;
  color: #ddd;
  margin-left: 0.5rem;
`;
