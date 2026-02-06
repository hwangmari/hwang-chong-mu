import styled from "styled-components";
import type { JSX, PropsWithChildren } from "react";

type SectionTitleProps = PropsWithChildren<{
  size?: string;
  color?: string;
  weight?: number;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}>;

const BaseTitle = styled.h2<{
  $size?: string;
  $color?: string;
  $weight?: number;
}>`
  font-size: ${({ $size }) => $size ?? "1.125rem"};
  font-weight: ${({ $weight }) => $weight ?? 700};
  color: ${({ $color, theme }) => $color ?? theme.colors.gray800};
  margin: 0;
`;

export default function SectionTitle({
  size,
  color,
  weight,
  as,
  className,
  children,
}: SectionTitleProps) {
  return (
    <BaseTitle
      as={as}
      $size={size}
      $color={color}
      $weight={weight}
      className={className}
    >
      {children}
    </BaseTitle>
  );
}
