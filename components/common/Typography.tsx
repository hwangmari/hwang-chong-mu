"use client";

import styled, { css } from "styled-components";
import { theme } from "@/styles/theme";

// 1. 사용할 폰트 스타일 레벨 정의
// (디자인 시스템에 맞춰서 계속 추가하면 됩니다!)
const variants = {
  // 🦁 헤드라인 (Hero Title)
  h1: css`
    font-size: 2.25rem;
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.2;

    @media ${({ theme }) => theme.media.desktop} {
      font-size: 3rem;
    }
  `,
  // 🐯 섹션 타이틀
  h2: css`
    font-size: 1.5rem;
    font-weight: 700;

    @media ${({ theme }) => theme.media.desktop} {
      font-size: 2.25rem;
    }
  `,
  // 🦊 카드 타이틀
  h3: css`
    font-size: 1.125rem;
    font-weight: 700;
  `,
  h4: css`
    font-size: 1.1rem;
    font-weight: 700;
  `,
  // 🐰 본문 (큰 글씨)
  body1: css`
    font-size: 1.125rem;
    line-height: 1.625;
    font-weight: 400;
  `,
  // 🐭 본문 (기본)
  body2: css`
    font-size: 1rem;
    line-height: 1.5;
    font-weight: 400;
  `,
  // 🐣 작은 텍스트 (설명, 날짜)
  caption: css`
    font-size: 0.875rem;
    font-weight: 500;
  `,
  // 🏷️ 뱃지, 버튼 텍스트
  label: css`
    font-size: 0.75rem;
    font-weight: 700;
  `,
};

// 타입 정의 (자동완성을 위해!)
type VariantType = keyof typeof variants;
type ColorType = keyof typeof theme.colors;

interface TypographyProps {
  variant?: VariantType;
  color?: ColorType;
  align?: "left" | "center" | "right";
  children: React.ReactNode;
  className?: string;
}

// ✨ 만능 컴포넌트
const Txt = styled.p<{
  $variant: VariantType;
  $color: ColorType;
  $align?: string;
}>`
  margin: 0;
  padding: 0;

  // 1. Variant 스타일 적용
  ${({ $variant }) => variants[$variant]}

  // 2. Color 적용 (theme에서 가져옴)
  color: ${({ theme, $color }) => theme.colors[$color]};

  // 3. 정렬
  text-align: ${({ $align }) => $align || ""};
`;

// 🎁 컴포넌트 내보내기
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
