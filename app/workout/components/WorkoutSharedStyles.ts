"use client";

import styled from "styled-components";

// 페이지 레이아웃 ----------------------------------------------------------

export const StPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
`;

export const StHeader = styled.header`
  padding: 0.5rem 0.25rem;

  @media (max-width: 540px) {
    padding: 0.5rem 1rem;
  }
`;

export const StTitle = styled.h1`
  font-size: 1.35rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StSubtitle = styled.p`
  margin-top: 0.2rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray500};
`;

export const StCard = styled.section`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 1.1rem;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;

  @media (max-width: 540px) {
    border: none;
    border-radius: 0;
  }
`;

export const StCardTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
`;

// 공통 상태 표시 -----------------------------------------------------------

export const StEmpty = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray400};
`;

export const StError = styled.p`
  color: ${({ theme }) => theme.colors.rose600};
  background: ${({ theme }) => theme.colors.rose50};
  padding: 0.5rem 0.75rem;
  border-radius: 0.6rem;
  font-size: 0.82rem;
  font-weight: 700;
`;

// 액션 버튼 ---------------------------------------------------------------

export const StActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

export const StGhostButton = styled.button`
  min-height: 2.9rem;
  padding: 0 1.1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray600};
  border-radius: 0.8rem;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
`;

// 기록 카드 내부 공용 ------------------------------------------------------

export const StRecordMemo = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.45;
`;
