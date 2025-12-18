"use client";

import React, { useState } from "react";
import styled, { css } from "styled-components";

const ShareButton = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2초 뒤 원상복구
    } catch (err) {
      alert("링크 복사에 실패했습니다.");
    }
  };

  return (
    <StShareButton onClick={handleCopy} $copied={copied}>
      {copied ? <>✅ 복사 완료!</> : <>🔗 약속 링크 복사하기</>}
    </StShareButton>
  );
};

export default ShareButton;

// ✨ 스타일 정의 (St 프리픽스)

const StShareButton = styled.button<{ $copied: boolean }>`
  margin-top: 1rem; /* mt-4 */
  padding: 0.5rem 1rem; /* px-4 py-2 */
  border-radius: 0.5rem; /* rounded (조금 더 부드럽게 0.5rem 적용) */
  font-size: 0.875rem; /* text-sm */
  font-weight: 500; /* font-medium */
  display: flex;
  align-items: center;
  gap: 0.5rem; /* gap-2 */
  transition: all 0.2s ease-in-out;

  /* 상태에 따른 스타일 분기 */
  ${({ $copied, theme }) =>
    $copied
      ? css`
          background-color: #22c55e; /* green-500 */
          color: ${theme.colors.white};
          cursor: default;
        `
      : css`
          background-color: ${theme.colors.gray200};
          color: ${theme.colors.gray700};

          &:hover {
            background-color: ${theme.colors.gray300};
          }
        `}
`;
