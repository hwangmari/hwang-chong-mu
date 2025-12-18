"use client";

import { useState } from "react";
import styled, { css } from "styled-components";

interface RoomHeaderProps {
  title: string;
}

export default function RoomHeader({ title }: RoomHeaderProps) {
  const [showCopied, setShowCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href; // 현재 페이지 주소

    // 1. 모바일 등 네이티브 공유가 가능한 경우 (Web Share API)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `[약속잡기] ${title}`,
          text: `${title} 약속 날짜를 정해보아요! 🐰`,
          url: url,
        });
      } catch (err) {
        console.log("공유 취소됨");
      }
    } else {
      // 2. PC 등 공유 기능이 없는 경우 -> 클립보드 복사
      try {
        await navigator.clipboard.writeText(url);
        // "복사됨!" 말풍선 2초간 보여주기
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      } catch (err) {
        alert("링크 복사에 실패했어요 😢 URL을 직접 복사해주세요.");
      }
    }
  };

  return (
    <StHeaderContainer>
      <StServiceTitle>🐰 황총무의 약속 잡기</StServiceTitle>

      {/* 타이틀 및 공유 버튼 영역 */}
      <StTitleCard>
        <StRoomTitle>{title}</StRoomTitle>

        {/* 🔥 공유 버튼 */}
        <StShareButton onClick={handleShare} aria-label="약속 링크 공유하기">
          {/* 공유 아이콘 (SVG) */}
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
              d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
            />
          </svg>

          {/* "복사됨" 말풍선 (PC용) */}
          <StTooltip $show={showCopied}>링크 복사 완료! ✅</StTooltip>
        </StShareButton>
      </StTitleCard>
    </StHeaderContainer>
  );
}

// ✨ 스타일 정의 (St 프리픽스)

const StHeaderContainer = styled.header`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem; /* gap-4 */
  margin-bottom: 1.5rem; /* mb-6 */
`;

const StServiceTitle = styled.h1`
  font-size: 1.25rem; /* text-xl */
  font-weight: 800; /* font-extrabold */
  color: ${({ theme }) => theme.colors.gray800};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const StTitleCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
  padding: 0.5rem 1rem; /* px-4 py-2 */
  background-color: ${({ theme }) => theme.colors.white};
`;

const StRoomTitle = styled.h1`
  font-size: 1.5rem; /* text-2xl */
  font-weight: 900; /* font-black */
  color: ${({ theme }) => theme.colors.gray900};
  word-break: keep-all; /* break-keep */
  line-height: 1.25; /* leading-tight */
`;

const StShareButton = styled.button`
  position: relative;
  padding: 0.5rem; /* p-2 */
  border-radius: 9999px;
  background-color: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray600};
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray200};
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 1.25rem; /* w-5 */
    height: 1.25rem; /* h-5 */

    @media ${({ theme }) => theme.media.desktop} {
      width: 1.5rem; /* sm:w-6 */
      height: 1.5rem; /* sm:h-6 */
    }
  }
`;

const StTooltip = styled.div<{ $show: boolean }>`
  position: absolute;
  left: 100%;
  top: 50%;
  margin-left: 0.5rem; /* ml-2 */
  padding: 0.25rem 0.5rem; /* px-2 py-1 */
  background-color: ${({ theme }) => theme.colors.gray800};
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.75rem; /* text-xs */
  font-weight: 700;
  border-radius: 0.5rem;
  white-space: nowrap;
  pointer-events: none;
  transition: all 0.2s ease-in-out;

  /* 조건부 스타일링: 상태에 따라 투명도와 위치 이동 */
  ${({ $show }) =>
    $show
      ? css`
          opacity: 1;
          transform: translateY(-50%) translateX(0);
        `
      : css`
          opacity: 0;
          transform: translateY(-50%) translateX(-0.5rem);
        `}
`;
