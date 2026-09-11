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

/* 기록 폼 맨 위: 왼쪽 날짜 띠 | 오른쪽 기본 입력(부위·시간·칼로리·심박 등). 폰에서는 위아래로 (2026-09-11) */
export const StTopGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.9rem;

  @media (min-width: 768px) {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    gap: 1.1rem;
    align-items: start;
  }
`;

export const StTopRight = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  min-width: 0;
`;

/* 날짜 블록: 라벨 + 띠. 오른쪽 입력 묶음과 같은 높이가 되도록 띠가 남은 높이를 채운다 */
export const StDateBlock = styled.div`
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 0.35rem;
  height: 100%;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray600};
`;
