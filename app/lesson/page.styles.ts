import Link from "next/link";
import styled, { css } from "styled-components";

/*
 * 카드·입력칸·칩·탭 같은 공통 조각은 경조사비 장부(app/gift-log/page.styles.ts)의 것을 그대로 쓴다.
 * 여기에는 레슨 일지에만 있는 조각(구성 줄, 합계 띠, 일지 목록, 팁 묶음)만 둔다.
 *
 * 테두리는 카드 한 겹만. 카드 안은 배경 띠(semantic.bg)와 가로 실선으로만 나눈다.
 * 글자 사다리: 카드 제목 1rem/800 · 라벨 0.78rem/700 · 날짜 0.95rem/800
 *            · 메타 0.78rem/700 · 메모·팁 0.86rem/1.6 · 팁 주제 0.9rem/800
 */

const numeric = css`
  font-variant-numeric: tabular-nums;
`;

/* === 쓰기 === */

/* 구성 한 줄: 이름 | 분 | 지우기 — 열 폭을 고정해 줄마다 칸이 같은 자리에 온다 */
export const StPartRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 6.5rem 2.75rem;
  gap: 0.5rem;
  align-items: center;
`;

export const StMinuteField = styled.div`
  position: relative;

  input {
    padding-right: 2rem;
    text-align: right;
  }

  span {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.82rem;
    font-weight: 700;
    color: ${({ theme }) => theme.semantic.subText};
    pointer-events: none;
  }
`;

export const StIconBtn = styled.button`
  height: 2.75rem;
  border: 0;
  border-radius: 0.7rem;
  background: transparent;
  color: ${({ theme }) => theme.semantic.subText};
  font-size: 1.1rem;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.semantic.bg};
    color: ${({ theme }) => theme.semantic.danger};
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
`;

/* 총 시간 → 운동 기록에 들어갈 값 */
export const StTotalBand = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.semantic.bg};
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};

  b {
    ${numeric};
    font-size: 0.95rem;
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.text};
  }
`;

/* 코드에 적어 둔 예전 일지를 옮기라는 한 줄 */
export const StSeedBand = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.75rem 0.9rem;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.semantic.primaryLight};
  font-size: 0.86rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.semantic.text};
`;

/* === 일지 목록 === */

export const StLessonList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
`;

export const StLessonItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1rem 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.semantic.border};
  }

  &:first-child {
    padding-top: 0.25rem;
  }

  &:last-child {
    padding-bottom: 0;
  }
`;

export const StLessonHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const StLessonActions = styled.div`
  display: flex;
  flex-shrink: 0;
  gap: 0.1rem;
`;

export const StLessonTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
`;

export const StLessonDate = styled.time`
  ${numeric};
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
`;

export const StLessonMeta = styled.span`
  ${numeric};
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
`;

/* game: 달력의 게임 점(semantic.warning)과 같은 노랑 바탕 — 글자는 본문색이라 밝은/어두운 화면 모두 읽힌다 */
export const StPill = styled.span<{ $tone: "amber" | "teal" | "gray" | "game" }>`
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  color: ${({ $tone, theme }) =>
    $tone === "amber"
      ? theme.colors.amber600
      : $tone === "teal"
        ? theme.semantic.success
        : $tone === "game"
          ? theme.semantic.text
          : theme.semantic.subText};
  background: ${({ $tone, theme }) =>
    $tone === "amber"
      ? theme.colors.amber50
      : $tone === "teal"
        ? theme.semantic.successBg
        : $tone === "game"
          ? theme.semantic.warningBg
          : theme.semantic.bg};
`;

export const StRaw = styled.p`
  margin: 0;
  padding: 0.7rem 0.85rem;
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.semantic.bg};
  font-size: 0.86rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.semantic.text};
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

/* === 팁 === */

export const StTipGroup = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  & + & {
    margin-top: 0.9rem;
    padding-top: 0.9rem;
    border-top: 1px solid ${({ theme }) => theme.semantic.border};
  }
`;

export const StTipTopic = styled.h3`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin: 0;
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
`;

export const StTipDates = styled.span`
  ${numeric};
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
`;

export const StTipPoints = styled.ul`
  margin: 0;
  padding-left: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  li {
    font-size: 0.86rem;
    line-height: 1.6;
    color: ${({ theme }) => theme.semantic.text};
  }

  li::marker {
    color: ${({ theme }) => theme.semantic.primary};
  }

  b {
    font-weight: 800;
  }
`;

/* 일지 안의 팁 — 바깥 실선 대신 위쪽 여백만 */
export const StLessonTips = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding-left: 0.1rem;

  ${StTipGroup} + ${StTipGroup} {
    margin-top: 0;
    padding-top: 0;
    border-top: 0;
  }
`;

/* 안내 문구 안의 이동 링크 (운동 기록 열기) */
export const StHintLink = styled(Link)`
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.primary};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;
