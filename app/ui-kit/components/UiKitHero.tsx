"use client";

import styled from "styled-components";
import { Typography } from "@hwangchongmu/ui";

interface UiKitHeroProps {
  foundationCount: number;
  componentCount: number;
}

export function UiKitHero({
  foundationCount,
  componentCount,
}: UiKitHeroProps) {
  return (
    <HeroSection>
      <HeroText>
        <Eyebrow>Shared UI</Eyebrow>
        <Typography as="h1" variant="h1">
          packages/ui 문서 모음집
        </Typography>
        <Typography variant="body1" color="gray600">
          공통 토큰과 컴포넌트를 문서처럼 탐색할 수 있게 정리한 화면입니다.
          좌측 카테고리로 문서 이동, 우측 목차로 Button 세부 설명 이동이
          가능합니다.
        </Typography>
      </HeroText>
      <HeroMeta>
        <MetaPill>foundation: {foundationCount}</MetaPill>
        <MetaPill>components: {componentCount}</MetaPill>
        <MetaPill>button api: documented</MetaPill>
      </HeroMeta>
    </HeroSection>
  );
}

const HeroSection = styled.section`
  display: grid;
  gap: 1rem;
  padding: 1.75rem;
  border-radius: 1.75rem;
  border: 1px solid ${({ theme }) => theme.colors.blue100};
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.14), transparent 30%),
    linear-gradient(135deg, ${({ theme }) => theme.colors.white}, ${({ theme }) => theme.colors.blue50});
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
`;

const HeroText = styled.div`
  display: grid;
  gap: 0.6rem;
  max-width: 780px;
`;

const Eyebrow = styled.span`
  display: inline-flex;
  width: fit-content;
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.blue100};
  color: ${({ theme }) => theme.colors.blue700};
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const HeroMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
`;

const MetaPill = styled.span`
  padding: 0.65rem 0.9rem;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: rgba(255, 255, 255, 0.75);
  color: ${({ theme }) => theme.colors.gray700};
  font-size: 0.85rem;
  font-weight: 600;
`;
