"use client";

import styled, { css } from "styled-components";

interface BaseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  bgColor?: string; // 배경색 (없으면 기본 다크 스타일 적용)
  isLoading?: boolean; // 로딩 상태
  loadingText?: string; // 로딩 텍스트
  children: React.ReactNode;
}

export default function CreateButton({
  bgColor,
  isLoading = false,
  loadingText = "처리 중...",
  children,
  disabled,
  ...props
}: BaseButtonProps) {
  return (
    <StButton $bgColor={bgColor} disabled={disabled || isLoading} {...props}>
      {isLoading ? loadingText : children}
    </StButton>
  );
}

const StButton = styled.button<{ $bgColor?: string }>`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 700;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 1.1rem;
  font-size: 1rem;
  border-radius: 16px;
  ${({ $bgColor, theme }) =>
    $bgColor
      ? css`
          background: ${$bgColor};

          box-shadow: 0 4px 12px ${$bgColor}40;

          &:hover {
            filter: brightness(1.05);
            transform: translateY(-2px);
          }
          &:disabled {
            background: #cbd5e1;
            box-shadow: none;
            cursor: not-allowed;
            transform: none;
            filter: none;
          }
        `
      : css`
          background-color: ${theme.colors.gray500};
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

          &:hover {
            background-color: ${theme.colors.gray700};
          }
          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}
`;
