"use client";

import styled, { css } from "styled-components";

interface BaseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  bgColor?: string; // 배경색 (없으면 기본 primary 스타일 적용)
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
  gap: 0.35rem;
  font-weight: 800;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.white};
  border: none;
  cursor: pointer;
  padding: 0.95rem 1rem;
  border-radius: 0.9rem;
  transition:
    background-color 0.15s ease,
    filter 0.15s ease;

  &:disabled {
    background: ${({ theme }) => theme.colors.gray200};
    color: ${({ theme }) => theme.colors.gray500};
    cursor: not-allowed;
    filter: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  ${({ $bgColor, theme }) =>
    $bgColor
      ? css`
          background: ${$bgColor};

          &:hover:not(:disabled) {
            filter: brightness(0.94);
          }
        `
      : css`
          background-color: ${theme.semantic.primary};

          &:hover:not(:disabled) {
            background-color: ${theme.colors.blue700};
          }
        `}
`;
