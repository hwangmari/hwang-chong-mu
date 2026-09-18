"use client";

import styled from "styled-components";

/* 추천 장소 고르기 창 전용 스타일 (2026-09-17).
   규칙: 창(StModal)이 테두리 역할(그림자)을 하므로 안쪽은 테두리 없이 여백·semantic.bg 띠로만 나눈다.
   구역 칩은 테두리 없는 회색 면, 고른 칩만 파란 면. 줄은 체크된 것만 회색 띠. */

/* 구역 칩 줄 — 좁으면 줄바꿈 */
export const StAreaChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
`;

export const StAreaChip = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 2rem;
  padding: 0 0.75rem;
  border: none;
  border-radius: 999px;
  background: ${({ $active, theme }) => ($active ? theme.semantic.primary : theme.semantic.bg)};
  color: ${({ $active, theme }) => ($active ? theme.colors.white : theme.semantic.subText)};
  font-size: 0.82rem;
  font-weight: 700;
  font-family: inherit;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover:not(:disabled) {
    color: ${({ $active, theme }) => ($active ? theme.colors.white : theme.semantic.text)};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/* 칩 안의 "고른 개수" 작은 알약 */
export const StChipCount = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.125rem;
  height: 1.125rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: ${({ $active, theme }) => ($active ? "rgba(255, 255, 255, 0.25)" : theme.colors.white)};
  color: ${({ $active, theme }) => ($active ? theme.colors.white : theme.semantic.primary)};
  font-size: 0.7rem;
  font-weight: 800;
  line-height: 1;
`;

/* 고른 구역 설명 한 줄 */
export const StAreaBlurb = styled.p`
  font-size: 0.86rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.semantic.subText};
`;

/* 장소 줄 목록 — 창 전체가 아니라 이 칸만 안에서 스크롤되어 아래 담기 버튼이 늘 보인다 */
export const StSpotList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  max-height: min(50vh, 26rem);
  overflow-y: auto;
  /* 안쪽 스크롤 칸이라 위아래로 머리카락 한 줄씩만 */
  border-top: 1px solid ${({ theme }) => theme.semantic.border};
  border-bottom: 1px solid ${({ theme }) => theme.semantic.border};
  padding: 0.375rem 0;
`;

/* 장소 한 줄(label 이라 어디를 눌러도 체크된다). 체크된 줄만 회색 띠. */
export const StSpotRow = styled.label<{ $checked: boolean }>`
  display: grid;
  /* 체크 · 아이콘 · 이름+팁 · (DAY 꼬리표 + 지도 링크) */
  grid-template-columns: 1.25rem 1.5rem minmax(0, 1fr) auto;

  /* 휴대폰: 이름 칸이 좁아지지 않게 꼬리표·지도 링크는 이름 아래 줄로 */
  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1.25rem 1.5rem minmax(0, 1fr);
    row-gap: 0.25rem;
  }
  align-items: start;
  gap: 0.5rem;
  padding: 0.5rem 0.5rem;
  border-radius: 0.625rem;
  background: ${({ $checked, theme }) => ($checked ? theme.semantic.bg : "transparent")};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.semantic.bg};
  }

  input {
    width: 1.125rem;
    height: 1.125rem;
    margin: 0.125rem 0 0;
    accent-color: ${({ theme }) => theme.semantic.primary};
    cursor: pointer;
  }
`;

/* 줄 오른쪽 끝: DAY 꼬리표 + 지도 링크. 휴대폰에서는 이름 아래(3번째 칸)로 내려간다 */
export const StSpotSide = styled.span`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-column: 3;
    justify-content: flex-start;
  }
`;

export const StSpotName = styled.span`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.375rem;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.4;
  color: ${({ theme }) => theme.semantic.text};
`;

/* "꼭" — 그 구역에서 빠지면 아쉬운 곳 표시. 테두리 없는 작은 알약 */
export const StPickTag = styled.span`
  display: inline-flex;
  align-items: center;
  height: 1.125rem;
  padding: 0 0.375rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.blue50};
  color: ${({ theme }) => theme.semantic.primary};
  font-size: 0.7rem;
  font-weight: 800;
  line-height: 1;
`;

/* 아래 담기 줄 — 날짜 고르기 + 담기 + 닫기. 좁으면 날짜 칸이 한 줄을 다 쓴다.
   창(StModal)은 90vh 를 넘으면 통째로 스크롤되므로, 이 줄만 바닥에 붙여 담기 버튼이 늘 보이게 한다.
   StModal 의 아래 여백(1.25rem)만큼 끌어내려 붙인다 (리뷰 반영 2026-09-17) */
export const StPickFoot = styled.div`
  position: sticky;
  bottom: -1.25rem;
  z-index: 1;
  margin-bottom: -1.25rem;
  padding: 0.5rem 0 1.25rem;
  background: ${({ theme }) => theme.colors.white};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;

  select {
    flex: 1 1 10rem;
  }
`;

export const StPickBtns = styled.div`
  display: flex;
  flex: 1 1 14rem;
  gap: 0.5rem;
`;
