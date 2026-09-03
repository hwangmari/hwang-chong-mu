"use client";

import styled, { css, keyframes } from "styled-components";

// 데이터를 기다리는 동안 "빈 화면" 대신 자리를 잡아 두는 회색 뼈대(스켈레톤).
// 실제 내용이 도착해도 레이아웃이 튀지 않도록, 쓰는 쪽에서 높이를 실제 카드와 비슷하게 맞춰 준다.

const shimmer = keyframes`
  0% { background-position: 200% 50%; }
  100% { background-position: 0% 50%; }
`;

// 라이트/다크 모두 theme.colors 그레이 사다리를 쓰므로 색을 따로 분기하지 않아도 된다.
const shimmerSurface = css`
  background-color: ${({ theme }) => theme.colors.gray100};
  background-image: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.gray100} 0%,
    ${({ theme }) => theme.colors.gray200} 50%,
    ${({ theme }) => theme.colors.gray100} 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;

  /* 움직임을 줄이고 싶다고 설정한 사용자에겐 반짝임 없이 회색 면만 */
  @media (prefers-reduced-motion: reduce) {
    background-image: none;
    animation: none;
  }
`;

const StBlock = styled.div<{
  $width?: string;
  $height?: string;
  $radius?: string;
}>`
  width: ${({ $width }) => $width ?? "100%"};
  height: ${({ $height }) => $height ?? "0.9rem"};
  border-radius: ${({ $radius }) => $radius ?? "0.5rem"};
  flex-shrink: 0;
  ${shimmerSurface}
`;

type SkeletonBlockProps = {
  width?: string;
  height?: string;
  radius?: string;
  className?: string;
};

/** 회색 사각형 한 덩어리. 제목·버튼·썸네일 자리를 대신한다. */
export function SkeletonBlock({
  width,
  height,
  radius,
  className,
}: SkeletonBlockProps) {
  return (
    <StBlock
      aria-hidden="true"
      className={className}
      $width={width}
      $height={height}
      $radius={radius}
    />
  );
}

const StTextGroup = styled.div<{ $gap?: string }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => $gap ?? "0.5rem"};
  width: 100%;
`;

type SkeletonTextProps = {
  /** 몇 줄을 그릴지 */
  lines?: number;
  /** 마지막 줄 너비 (문단처럼 짧게 끝나 보이도록) */
  lastWidth?: string;
  lineHeight?: string;
  gap?: string;
  className?: string;
};

/** 여러 줄 글자 자리. 마지막 줄만 조금 짧게 그려 문단처럼 보인다. */
export function SkeletonText({
  lines = 3,
  lastWidth = "60%",
  lineHeight = "0.85rem",
  gap,
  className,
}: SkeletonTextProps) {
  return (
    <StTextGroup className={className} $gap={gap}>
      {Array.from({ length: Math.max(1, lines) }).map((_, i) => (
        <SkeletonBlock
          key={i}
          height={lineHeight}
          width={i === lines - 1 ? lastWidth : "100%"}
        />
      ))}
    </StTextGroup>
  );
}

const StCard = styled.div<{ $height?: string; $padding?: string }>`
  width: 100%;
  min-height: ${({ $height }) => $height ?? "auto"};
  box-sizing: border-box;
  padding: ${({ $padding }) => $padding ?? "1.1rem"};
  border-radius: 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  background: ${({ theme }) => theme.colors.white};
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

type SkeletonCardProps = {
  /** 제목 아래 본문 줄 수 */
  lines?: number;
  /** 카드 최소 높이 — 실제 카드와 비슷하게 넣으면 화면이 안 튄다 */
  height?: string;
  padding?: string;
  /** 제목 줄을 그릴지 */
  title?: boolean;
  titleWidth?: string;
  className?: string;
};

/** 흰 카드 한 장 자리. 제목 한 줄 + 본문 두세 줄. */
export function SkeletonCard({
  lines = 2,
  height,
  padding,
  title = true,
  titleWidth = "45%",
  className,
}: SkeletonCardProps) {
  return (
    <StCard
      aria-busy="true"
      className={className}
      $height={height}
      $padding={padding}
    >
      {title ? (
        <SkeletonBlock width={titleWidth} height="1.05rem" radius="0.6rem" />
      ) : null}
      {lines > 0 ? <SkeletonText lines={lines} /> : null}
    </StCard>
  );
}

const StList = styled.div<{ $gap?: string }>`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => $gap ?? "0.75rem"};
`;

type SkeletonListProps = {
  /** 카드 몇 장 */
  count?: number;
  lines?: number;
  height?: string;
  padding?: string;
  title?: boolean;
  gap?: string;
  className?: string;
};

/** 카드 목록 자리. 목록형 화면이 비어 보이지 않게 같은 높이로 채운다. */
export function SkeletonList({
  count = 3,
  lines = 2,
  height,
  padding,
  title = true,
  gap,
  className,
}: SkeletonListProps) {
  return (
    <StList aria-busy="true" className={className} $gap={gap}>
      {Array.from({ length: Math.max(1, count) }).map((_, i) => (
        <SkeletonCard
          key={i}
          lines={lines}
          height={height}
          padding={padding}
          title={title}
        />
      ))}
    </StList>
  );
}
