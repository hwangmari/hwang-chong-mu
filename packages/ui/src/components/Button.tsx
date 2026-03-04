"use client";

import React from "react";
import styled, { css, keyframes } from "styled-components";

export const BUTTON_AS = ["button", "a"] as const;
export const BUTTON_COLORS = ["primary", "danger", "light", "dark"] as const;
export const BUTTON_VARIANTS = ["fill", "weak"] as const;
export const BUTTON_DISPLAYS = ["inline", "block", "full"] as const;
export const BUTTON_SIZES = ["small", "medium", "large", "xlarge"] as const;

export type ButtonAs = (typeof BUTTON_AS)[number];
export type ButtonColor = (typeof BUTTON_COLORS)[number];
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type ButtonDisplay = (typeof BUTTON_DISPLAYS)[number];
export type ButtonSize = (typeof BUTTON_SIZES)[number];

export interface ButtonProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color" | "style"> {
  as?: ButtonAs;
  color?: ButtonColor;
  variant?: ButtonVariant;
  display?: ButtonDisplay;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  href?: string;
  target?: string;
  rel?: string;
  download?: string | boolean;
  htmlStyle?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const colorVariants = {
  primary: {
    fill: css`
      background: #ff6f0f;
      border-color: #ff6f0f;
      color: #ffffff;

      &:hover:not(:disabled, [aria-disabled="true"]) {
        background: #ef6700;
        border-color: #ef6700;
      }
    `,
    weak: css`
      background: #fff4eb;
      border-color: #ffd7b8;
      color: #ef6700;

      &:hover:not(:disabled, [aria-disabled="true"]) {
        background: #ffe8d2;
        border-color: #ffc798;
      }
    `,
  },
  danger: {
    fill: css`
      background: #e5484d;
      border-color: #e5484d;
      color: #ffffff;

      &:hover:not(:disabled, [aria-disabled="true"]) {
        background: #d63d43;
        border-color: #d63d43;
      }
    `,
    weak: css`
      background: #fff1f2;
      border-color: #fecdd3;
      color: #e5484d;

      &:hover:not(:disabled, [aria-disabled="true"]) {
        background: #ffe4e6;
        border-color: #fda4af;
      }
    `,
  },
  light: {
    fill: css`
      background: #ffffff;
      border-color: #ececec;
      color: #333333;

      &:hover:not(:disabled, [aria-disabled="true"]) {
        background: #fafafa;
        border-color: #dddddd;
      }
    `,
    weak: css`
      background: #f7f7f8;
      border-color: #ededee;
      color: #555555;

      &:hover:not(:disabled, [aria-disabled="true"]) {
        background: #efeff1;
        border-color: #e0e0e2;
      }
    `,
  },
  dark: {
    fill: css`
      background: #4a4a4a;
      border-color: #4a4a4a;
      color: #ffffff;

      &:hover:not(:disabled, [aria-disabled="true"]) {
        background: #3d3d3d;
        border-color: #3d3d3d;
      }
    `,
    weak: css`
      background: #f4f4f5;
      border-color: #d6d6d8;
      color: #4a4a4a;

      &:hover:not(:disabled, [aria-disabled="true"]) {
        background: #eaeaed;
        border-color: #c7c7cb;
      }
    `,
  },
} as const;

const sizeStyles = {
  small: css`
    min-height: 2rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.75rem;
    font-size: 0.8125rem;
    font-weight: 600;
  `,
  medium: css`
    min-height: 2.5rem;
    padding: 0.7rem 1rem;
    border-radius: 0.875rem;
    font-size: 0.9375rem;
    font-weight: 600;
  `,
  large: css`
    min-height: 3rem;
    padding: 0.9rem 1.2rem;
    border-radius: 1rem;
    font-size: 1rem;
    font-weight: 700;
  `,
  xlarge: css`
    min-height: 3.5rem;
    padding: 1rem 1.4rem;
    border-radius: 1.125rem;
    font-size: 1.0625rem;
    font-weight: 700;
  `,
} as const;

const displayStyles = {
  inline: css`
    width: auto;
  `,
  block: css`
    width: 100%;
    display: flex;
  `,
  full: css`
    width: 100%;
    display: flex;
  `,
} as const;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const StyledButton = styled.button<{
  $color: ButtonColor;
  $variant: ButtonVariant;
  $display: ButtonDisplay;
  $size: ButtonSize;
  $iconOnly: boolean;
}>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid transparent;
  line-height: 1;
  letter-spacing: -0.01em;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    opacity 0.2s ease,
    transform 0.2s ease;

  ${({ $color, $variant }) => colorVariants[$color][$variant]}
  ${({ $display }) => displayStyles[$display]}
  ${({ $size }) => sizeStyles[$size]}
  ${({ $iconOnly }) =>
    $iconOnly &&
    css`
      padding-inline: 0;
      aspect-ratio: 1 / 1;
    `}

  &:active:not(:disabled, [aria-disabled="true"]) {
    transform: translateY(1px);
  }

  &:disabled,
  &[aria-disabled="true"] {
    opacity: 0.42;
    cursor: not-allowed;
    pointer-events: none;
    box-shadow: none;
  }
`;

const Content = styled.span<{ $loading: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  opacity: ${({ $loading }) => ($loading ? 0 : 1)};
`;

const IconSlot = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;

  svg {
    width: 1em;
    height: 1em;
  }
`;

const Spinner = styled.span`
  position: absolute;
  width: 1em;
  height: 1em;
  border-radius: 999px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: ${spin} 0.75s linear infinite;
`;

export function Button({
  as = "button",
  color = "primary",
  variant = "fill",
  display = "inline",
  size = "xlarge",
  loading = false,
  disabled = false,
  type = "button",
  htmlStyle,
  leftIcon,
  rightIcon,
  children,
  onClick,
  ...props
}: ButtonProps) {
  const iconOnly = !children && !!(leftIcon || rightIcon);
  const iconNode = leftIcon ?? rightIcon;
  const isDisabled = disabled || loading;

  function handleClick(event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) {
    if (isDisabled) {
      event.preventDefault();
      return;
    }

    onClick?.(event as React.MouseEvent<HTMLButtonElement>);
  }

  return (
    <StyledButton
      as={as}
      type={as === "button" ? type : undefined}
      aria-disabled={as === "a" && isDisabled ? true : undefined}
      disabled={as === "button" ? isDisabled : undefined}
      onClick={handleClick}
      style={htmlStyle}
      $color={color}
      $variant={variant}
      $display={display}
      $size={size}
      $iconOnly={iconOnly}
      {...props}
    >
      {loading && <Spinner aria-hidden="true" />}
      {iconOnly ? (
        <Content $loading={loading}>
          <IconSlot>{iconNode}</IconSlot>
        </Content>
      ) : (
        <Content $loading={loading}>
          {leftIcon && <IconSlot>{leftIcon}</IconSlot>}
          {children}
          {rightIcon && <IconSlot>{rightIcon}</IconSlot>}
        </Content>
      )}
    </StyledButton>
  );
}
