"use client";

import React from "react";
import styled, { css } from "styled-components";

export const BUTTON_VARIANTS = ["solid", "subtle", "ghost"] as const;
export const BUTTON_SIZES = ["sm", "md", "lg"] as const;

const buttonVariants = {
  solid: css`
    background: ${({ theme }) => theme.semantic.primary};
    color: ${({ theme }) => theme.colors.white};
    border: 1px solid ${({ theme }) => theme.semantic.primary};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.blue700};
      border-color: ${({ theme }) => theme.colors.blue700};
    }
  `,
  subtle: css`
    background: ${({ theme }) => theme.semantic.primaryLight};
    color: ${({ theme }) => theme.semantic.primary};
    border: 1px solid ${({ theme }) => theme.colors.blue100};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.blue100};
    }
  `,
  ghost: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.gray700};
    border: 1px solid ${({ theme }) => theme.colors.gray200};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.white};
      border-color: ${({ theme }) => theme.colors.gray400};
    }
  `
} as const;

const buttonSizes = {
  sm: css`
    min-height: 2.25rem;
    padding: 0.55rem 0.9rem;
    font-size: 0.875rem;
  `,
  md: css`
    min-height: 2.85rem;
    padding: 0.8rem 1.1rem;
    font-size: 0.95rem;
  `,
  lg: css`
    min-height: 3.3rem;
    padding: 1rem 1.35rem;
    font-size: 1rem;
  `
} as const;

type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
type ButtonSize = (typeof BUTTON_SIZES)[number];

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const StyledButton = styled.button<{
  $variant: ButtonVariant;
  $size: ButtonSize;
  $fullWidth: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  border-radius: 0.9rem;
  font-weight: 700;
  line-height: 1;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;

  ${({ $variant }) => buttonVariants[$variant]}
  ${({ $size }) => buttonSizes[$size]}

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export function Button({
  variant = "solid",
  size = "md",
  fullWidth = false,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <StyledButton
      type={type}
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      {...props}
    />
  );
}
