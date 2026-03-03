"use client";

import React from "react";
import styled, { css } from "styled-components";
import { uiTheme } from "../theme";

export const TYPOGRAPHY_VARIANTS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "body1",
  "body2",
  "caption",
  "label"
] as const;

const variants = {
  h1: css`
    font-size: 2.25rem;
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.2;

    @media ${({ theme }) => theme.media.desktop} {
      font-size: 3rem;
    }
  `,
  h2: css`
    font-size: 1.5rem;
    font-weight: 700;

    @media ${({ theme }) => theme.media.desktop} {
      font-size: 2.25rem;
    }
  `,
  h3: css`
    font-size: 1.25rem;
    font-weight: 700;
  `,
  h4: css`
    font-size: 1.1rem;
    font-weight: 700;
  `,
  body1: css`
    font-size: 1.125rem;
    line-height: 1.625;
    font-weight: 400;
  `,
  body2: css`
    font-size: 1rem;
    line-height: 1.6;
    font-weight: 400;
  `,
  caption: css`
    font-size: 0.875rem;
    font-weight: 500;
  `,
  label: css`
    font-size: 0.75rem;
    font-weight: 700;
  `
} as const;

type VariantType = (typeof TYPOGRAPHY_VARIANTS)[number];
type ColorType = keyof typeof uiTheme.colors;

export interface TypographyProps {
  variant?: VariantType;
  color?: ColorType;
  align?: "left" | "center" | "right";
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

const Text = styled.p<{
  $variant: VariantType;
  $color: ColorType;
  $align?: "left" | "center" | "right";
}>`
  margin: 0;
  padding: 0;
  ${({ $variant }) => variants[$variant]}
  color: ${({ theme, $color }) => theme.colors[$color]};
  text-align: ${({ $align }) => $align ?? "left"};
`;

export function Typography({
  variant = "body2",
  color = "gray900",
  align,
  children,
  className,
  as = "p"
}: TypographyProps) {
  return (
    <Text
      as={as}
      $variant={variant}
      $color={color}
      $align={align}
      className={className}
    >
      {children}
    </Text>
  );
}
