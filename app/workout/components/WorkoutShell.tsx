"use client";

import { ReactNode } from "react";
import styled from "styled-components";
import WorkoutAuthGate from "./WorkoutAuthGate";
import WorkoutSubNav from "./WorkoutSubNav";

export default function WorkoutShell({ children }: { children: ReactNode }) {
  return (
    <WorkoutAuthGate>
      <StWrap>
        <WorkoutSubNav />
        <StContent>{children}</StContent>
      </StWrap>
    </WorkoutAuthGate>
  );
}

const StWrap = styled.div`
  min-height: calc(100vh - 64px);
  background: ${({ theme }) => theme.colors.gray50};
  overflow-x: clip;
`;

const StContent = styled.div`
  /* 운동기록은 PC 창 폭을 넓게 쓴다 — 본문도 사이트 최대 폭(1024)까지 (주인 요청 2026-09-22) */
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 1.25rem 1rem 4rem;
  min-width: 0;

  @media (max-width: 540px) {
    padding: 1rem 0 3rem;
  }
`;
