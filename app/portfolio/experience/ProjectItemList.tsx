"use client";

import styled, { keyframes } from "styled-components";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useMemo } from "react";
import Image from "next/image";

/** 1. 이미지 데이터 타입 정의 */
export interface HistoryImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export interface HistoryItem {
  id: number | string;
  date: string;
  title: string;
  description?: string[];
  url?: string;
  images?: HistoryImage[]; // 👈 추가됨
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
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
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

  /** 렌더링 헬퍼 함수 */
  const renderContent = (item: HistoryItem) => (
    <>
      <StTitleDate>
        <StDate>{item.date.slice(5)}</StDate>
        <StContent>
          <StTitle>{item.title}</StTitle>
        </StContent>
        <StArrow>
          {item.url ? <OpenInNewIcon fontSize="inherit" /> : "-"}
        </StArrow>
      </StTitleDate>

      {/* 설명 목록 렌더링 */}
      {item.description && item.description.length > 0 && (
        <StDescList>
          {item.description.map((desc, idx) => (
            <StDescItem key={idx}>{desc}</StDescItem>
          ))}
        </StDescList>
      )}

      {/* 3. 이미지 그리드 렌더링 로직 수정 */}
      {item.images && item.images.length > 0 && (
        <StImageGrid>
          {item.images.map((img, idx) => (
            <StImageFrame key={idx} className={img.className}>
              <StNextImage
                src={img.src}
                alt={img.alt}
                width={img.width || 500} // 기본값 설정
                height={img.height || 600}
                /** width/height를 모를 경우 fill={true} 사용 고려 */
                style={{
                  height: "auto",
                }}
              />
            </StImageFrame>
          ))}
        </StImageGrid>
      )}
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


/** 4. 애니메이션 정의 (누락되었던 부분) */
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

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

const StLeftCol = styled.div`
  width: 60px;
  flex-shrink: 0;
  position: sticky;
  top: 70px;
  z-index: 10;
  margin: 10px 0 54px;
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

const StYearSection = styled.div`
  display: flex;
  align-items: flex-start;
  &:last-child {
    ${StLeftCol} {
      margin: 10px 0 20px;
    }
    ${StRightCol} {
      padding-bottom: 0;
    }
  }
`;

const StItemWrapper = styled.div`
  position: relative;
  padding-left: 1.25rem;
  margin-bottom: 12px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const StDot = styled.div`
  position: absolute;
  left: -4px;
  top: 1.2rem;
  width: 6px;
  height: 6px;
  background-color: #fff;
  border: 2px solid #ccc;
  border-radius: 50%;
  z-index: 1;
  transition: all 0.2s;
`;

const cardStyles = `
  padding: .9rem;
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  transition: all 0.2s;
`;

const StLink = styled.a`
  display: block;
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

const StTitleDate = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
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
  margin-top: 2px;
`;

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
  margin-top: 12px;
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

const StImageGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  margin-top: 0.5rem;
  animation: ${fadeIn} 0.5s ease-out;

  /* 테마가 있다면 아래 주석 해제 후 사용하세요 */
  /*
  @media ${({ theme }) => theme?.media?.desktop || "min-width: 1024px"} {
    grid-template-columns: 1fr 1fr;
  }
  */
`;

const StImageFrame = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 0.75rem;
`;

const StNextImage = styled(Image)`
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid #e5e5e5;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  display: block;
`;
