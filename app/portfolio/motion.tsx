"use client";

// 포트폴리오의 조용한 등장 효과.
// 움직임은 커리어 리본 하나로 몰아 두었으므로, 여기서는 짧은 페이드만 쓴다.
import { motion } from "framer-motion";
import { type ReactNode } from "react";
import styled, { css } from "styled-components";

export const stillIfReducedMotion = css`
  @media (prefers-reduced-motion: reduce) {
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
    animation: none !important;
    background-size: 100% 100% !important;
  }
`;

/** 화면에 들어올 때 0.2초 동안 흐리게 → 또렷하게. 움직임은 없다. */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <StReveal
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </StReveal>
  );
}

const StReveal = styled(motion.div)`
  height: 100%;
  ${stillIfReducedMotion}
`;

/** 섹션 제목. 움직이지 않는다. */
export function SectionTitle({ title, id }: { title: string; id?: string }) {
  return (
    <StTitleBlock id={id}>
      <h2>{title}</h2>
    </StTitleBlock>
  );
}

const StTitleBlock = styled.div`
  margin-bottom: 1.1rem;

  h2 {
    font-family: var(--font-display), ui-sans-serif, system-ui, sans-serif;
    font-weight: 400;
    font-size: clamp(1.6rem, 3vw, 2.1rem);
    color: ${({ theme }) => theme.semantic.text};
    margin: 0;
  }
`;
