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
`;

const StContent = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 1.25rem 1rem 4rem;
`;
