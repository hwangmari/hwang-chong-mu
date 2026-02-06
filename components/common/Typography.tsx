"use client";

import styled, { css } from "styled-components";
import { theme } from "@/styles/theme";

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
  `,
};

type VariantType = keyof typeof variants;
type ColorType = keyof typeof theme.colors;

interface TypographyProps {
  variant?: VariantType;
  color?: ColorType;
  align?: "left" | "center" | "right";
  children: React.ReactNode;
  className?: string;
}

const Txt = styled.p<{
  $variant: VariantType;
  $color: ColorType;
  $align?: string;
}>`
  margin: 0;
  padding: 0;

  ${({ $variant }) => variants[$variant]}

  color: ${({ theme, $color }) => theme.colors[$color]};

  text-align: ${({ $align }) => $align || ""};
`;

export default function Typography({
  variant = "body2",
  color = "gray900",
  align,
  children,
  className,
  ...props // as prop 등을 받기 위함
}: TypographyProps & { as?: React.ElementType }) {
  return (
    <Txt
      as="p" // 기본 태그
      $variant={variant}
      $color={color}
      $align={align}
      className={className}
      {...props} // 여기서 as="h1" 같은게 들어오면 덮어씌워짐
    >
      {children}
    </Txt>
  );
}
