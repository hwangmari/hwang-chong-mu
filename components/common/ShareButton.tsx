"use client";

import React, { useState } from "react";
import styled from "styled-components";

interface ShareButtonProps {
  className?: string; // 외부에서 위치나 마진을 조정할 수 있게
  iconSize?: number; // 아이콘 크기 조절 (기본값 24)
}

export default function ShareButton({
  className,
  iconSize = 24,
}: ShareButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleShare = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);

      setShowTooltip(true);
      setTimeout(() => {
        setShowTooltip(false);
      }, 2000);
    } catch (err) {
      console.error("클립보드 복사 실패:", err);
      alert("주소 복사에 실패했습니다. URL을 직접 복사해주세요!");
    }
  };

  return (
    <StShareButton
      onClick={handleShare}
      className={className}
      aria-label="링크 공유하기"
    >
      {/* 공유 아이콘 */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={iconSize}
        height={iconSize}
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

      {/* 말풍선 툴팁 */}
      <StTooltip $show={showTooltip}>링크 복사 완료! ✅</StTooltip>
    </StShareButton>
  );
}


const StShareButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  position: relative; /* 툴팁의 기준점 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
  color: #333; /* 아이콘 색상 */

  &:hover {
    background-color: rgba(0, 0, 0, 0.05); /* 살짝 회색 배경 */
  }

  &:active {
    transform: scale(0.95);
  }
`;

const StTooltip = styled.span<{ $show: boolean }>`
  position: absolute;
  bottom: -40px; /* 버튼 아래쪽에 위치 */
  left: 50%;
  transform: translateX(-50%);

  background-color: rgba(30, 30, 30, 0.9); /* 진한 회색 배경 */
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none; /* 툴팁이 클릭을 방해하지 않도록 */
  z-index: 10;

  opacity: ${(props) => (props.$show ? 1 : 0)};
  visibility: ${(props) => (props.$show ? "visible" : "hidden")};
  transition: opacity 0.2s ease-in-out, visibility 0.2s;

  &::after {
    content: "";
    position: absolute;
    top: -4px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 0 4px 4px 4px;
    border-style: solid;
    border-color: transparent transparent rgba(30, 30, 30, 0.9) transparent;
  }
`;
