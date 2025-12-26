"use client";

import React, { useState } from "react";
import styled, { css } from "styled-components";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
interface ShareButtonProps {
  title?: string;
  description?: string;
}

const ShareButton = ({ title, description }: ShareButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;

    // 1. 모바일 디바이스 체크 (User Agent)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // 2. 모바일 + 공유 기능 지원 시 -> 네이티브 공유
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: title, // props로 받은 제목 사용
          text: description, // props로 받은 본문 사용
          url: url,
        });
      } catch (err) {
        console.log("공유 취소됨");
      }
    } else {
      // PC: URL 복사
      try {
        await navigator.clipboard.writeText(url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        alert("링크 복사에 실패했습니다.");
      }
    }
  };

  return (
    <StContainer>
      <StShareButton
        onClick={handleShare}
        $isCopied={isCopied}
        aria-label="약속 링크 공유하기"
      >
        {isCopied ? <CheckOutlinedIcon /> : <ShareOutlinedIcon />}
      </StShareButton>

      {/* 툴팁 (PC 복사 시에만 등장) */}
      <StTooltip $show={isCopied}>링크 복사 완료</StTooltip>
    </StContainer>
  );
};

export default ShareButton;

// ✨ 스타일 정의 (St 프리픽스 적용)

const StContainer = styled.div`
  position: relative; /* 툴팁 위치 기준점 */
  display: flex;
  align-items: center;
`;

const StShareButton = styled.button<{ $isCopied: boolean }>`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;
  flex-shrink: 0;

  svg {
    width: 1.5rem; /* 24px (Material Default) */
    height: 1.5rem;
  }

  ${({ $isCopied, theme }) =>
    $isCopied
      ? css`
          background-color: #22c55e; /* green-500 */
          color: white;
          cursor: default;
          transform: scale(1.1);
        `
      : css`
          background-color: ${theme.colors.gray100};
          color: ${theme.colors.gray600};

          &:hover {
            background-color: ${theme.colors.gray200};
            color: ${theme.colors.gray800};
          }
          &:active {
            transform: scale(0.95);
          }
        `}
`;

const StTooltip = styled.div<{ $show: boolean }>`
  position: absolute;
  right: 100%; /* 버튼 왼쪽으로 배치 */
  top: 50%;
  margin-right: 0.75rem; /* 버튼과 간격 */
  padding: 0.25rem 0.5rem;
  background-color: ${({ theme }) => theme.colors.gray800};
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 0.375rem;
  white-space: nowrap;
  pointer-events: none; /* 툴팁이 클릭 방해하지 않도록 */
  transition: all 0.2s ease-in-out;

  /* 말풍선 꼬리 (선택 사항) */
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    right: -4px;
    margin-top: -4px;
    border-width: 4px;
    border-style: solid;
    border-color: transparent transparent transparent
      ${({ theme }) => theme.colors.gray800};
  }

  /* 애니메이션: 투명도 + 위치 이동 */
  ${({ $show }) =>
    $show
      ? css`
          opacity: 1;
          transform: translateY(-50%) translateX(0);
        `
      : css`
          opacity: 0;
          transform: translateY(-50%) translateX(0.5rem);
        `}
`;
