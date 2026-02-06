import styled from "styled-components";
import type { PropsWithChildren } from "react";

type CardProps = PropsWithChildren<{
  padding?: string;
  radius?: string;
  shadow?: string;
  borderColor?: string;
  bg?: string;
  overflowHidden?: boolean;
  className?: string;
}>;

const BaseCard = styled.div<{
  $padding?: string;
  $radius?: string;
  $shadow?: string;
  $borderColor?: string;
  $bg?: string;
  $overflowHidden?: boolean;
}>`
  background-color: ${({ $bg, theme }) => $bg ?? theme.colors.white};
  border: 1px solid
    ${({ $borderColor, theme }) => $borderColor ?? theme.colors.gray200};
  border-radius: ${({ $radius }) => $radius ?? "1rem"};
  padding: ${({ $padding }) => $padding ?? "1.25rem"};
  box-shadow: ${({ $shadow }) => $shadow ?? "0 2px 8px rgba(0, 0, 0, 0.04)"};
  overflow: ${({ $overflowHidden }) => ($overflowHidden ? "hidden" : "visible")};
`;

export default function Card({
  padding,
  radius,
  shadow,
  borderColor,
  bg,
  overflowHidden,
  className,
  children,
}: CardProps) {
  return (
    <BaseCard
      $padding={padding}
      $radius={radius}
      $shadow={shadow}
      $borderColor={borderColor}
      $bg={bg}
      $overflowHidden={overflowHidden}
      className={className}
    >
      {children}
    </BaseCard>
  );
}
