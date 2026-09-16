"use client";

// 여행 만들기 화면(/travel)의 모양.
// 색은 전부 theme 토큰만 써서 다크 모드가 따로 분기 없이 따라온다.
import styled, { css } from "styled-components";

/** 흰 카드 한 장. 테두리는 이 카드에만 두고, 안쪽은 간격으로 나눈다. */
export const StCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1.1rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 1.1rem;
  background: ${({ theme }) => theme.colors.white};
  box-sizing: border-box;

  /* 카드가 이어질 때만 사이를 띄운다 (StSection 과 같은 1.25rem) */
  & + & {
    margin-top: 1.25rem;
  }

  @media ${({ theme }) => theme.media.mobile} {
    padding: 0.9rem 1rem;
  }
`;

/** 카드 안 작은 제목 */
export const StCardTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
`;

/** 입력 칸 한 덩어리 (라벨 + 입력). 같은 줄에 둘 때 바닥이 맞도록 세로로 늘어난다. */
export const StField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 0;
  height: 100%;
`;

export const StLabel = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
`;

// 입력·선택 상자의 공통 생김새 — 한 줄에 나란히 두어도 높이가 어긋나지 않게 한 곳에서 정한다.
const fieldBox = css`
  width: 100%;
  min-width: 0;
  height: 2.75rem;
  box-sizing: border-box;
  padding: 0 0.75rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.semantic.text};
  font-size: 0.95rem;
  font-family: inherit;

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray400};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.semantic.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.semantic.primaryLight};
  }
`;

export const StInput = styled.input`
  ${fieldBox}
`;

/** 화살표는 직접 그린다(브라우저마다 다른 기본 화살표를 쓰지 않으려고). app/workout/weight 와 같은 간격. */
export const StSelect = styled.select`
  ${fieldBox}
  padding: 0 2rem 0 0.75rem;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3e%3cpath d='M1 1l4 4 4-4' stroke='%237d8593' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.7rem center;
`;

/** 시작일 / 종료일 — 두 칸이 같은 높이로 끝나도록 stretch */
export const StDateRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: stretch;
  gap: 0.75rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

/** 날짜 아래 "2박 3일" 같은 한 줄 */
export const StNights = styled.p`
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.primary};
`;

/** 버튼 아래 설명 문구 */
export const StHint = styled.p`
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.semantic.subText};
`;

/** 내 여행 목록 — 줄마다 테두리를 두르지 않고 가는 선으로만 나눈다 */
export const StMyList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
`;

export const StMyRow = styled.li`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.semantic.border};
  }
`;

export const StMyLink = styled.a`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  text-decoration: none;
  color: inherit;
`;

export const StMyTitle = styled.span`
  font-size: 0.95rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StMyMeta = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.semantic.subText};
`;

/** 목록에서만 빼는 작은 버튼 — 테두리 없이 글자만 */
export const StGhostBtn = styled.button`
  flex-shrink: 0;
  border: none;
  background: none;
  padding: 0.25rem 0.375rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.semantic.danger};
  }
`;

/** 아직 만든 여행이 없을 때의 한 줄 */
export const StEmpty = styled.p`
  margin: 0;
  font-size: 0.86rem;
  color: ${({ theme }) => theme.semantic.subText};
`;

/** 목록을 불러오는 동안 자리를 잡아 두는 줄 */
export const StSkeletonRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.625rem 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.semantic.border};
  }
`;
