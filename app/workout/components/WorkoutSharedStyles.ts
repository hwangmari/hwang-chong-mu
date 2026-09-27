"use client";

import styled from "styled-components";

// 페이지 레이아웃 ----------------------------------------------------------

export const StPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
`;

export const StCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  min-width: 0;
`;

/* PC(900px 이상)에서는 입력(왼쪽) | 차트·지난 기록(오른쪽) 두 칸 — 넓은 화면에서 세로로 너무 길어지지 않게 (주인 요청 2026-09-22) */
/** 두 칸 비율 — form(기본, 입력 1.2 : 기록 1) · wide(달력 7 : 최근 기록 3) · half(반반, PR 두 장) */
const TWO_COL_RATIO = { form: "1.2fr 1fr", wide: "7fr 3fr", half: "1fr 1fr" } as const;

export const StTwoCol = styled.div<{ $ratio?: keyof typeof TWO_COL_RATIO }>`
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  min-width: 0;

  @media (min-width: 900px) {
    display: grid;
    grid-template-columns: ${({ $ratio = "form" }) =>
      TWO_COL_RATIO[$ratio]
        .split(" ")
        .map((fr) => `minmax(0, ${fr})`)
        .join(" ")};
    /* 같은 줄 카드는 아래 끝을 맞춘다 (CLAUDE.md 규칙) — 짧은 쪽 카드가 칸을 채운다 */
    align-items: stretch;

    & > ${StCol} > :last-child {
      flex: 1 1 auto;
    }
  }
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
  container: workout-card / inline-size;

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

  /* 창 폭이 아니라 카드 폭 기준 — PC 두 칸에서 카드가 좁아져도 칸이 찌그러지지 않게 */
  @container workout-card (min-width: 700px) {
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

// 지난 기록 목록 공용 ------------------------------------------------------
// 러닝·웨이트·활동 세 화면이 같은 모양을 쓴다. 예전에는 화면마다 따로 정의해
// 두어 버튼 방향·숫자 정렬이 서로 달랐다 (2026-09-23 정리).

export const StRecordList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

export const StRecordRow = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 0.8rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 0.9rem;
`;

export const StRecordMain = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const StRecordTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

export const StRecordDate = styled.span`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 700;
`;

/* 수정·삭제는 한 줄에 나란히 — 홈과 같은 모양 (예전엔 러닝·활동만 세로 2단이었다) */
export const StRecordActions = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  flex-shrink: 0;
`;

const recordButton = `
  padding: 0.35rem 0.7rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
`;

export const StEditBtn = styled.button`
  ${recordButton}
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray600};
`;

export const StDelBtn = styled.button`
  ${recordButton}
  border: 1px solid ${({ theme }) => theme.colors.rose200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.rose600};
`;

/* 숫자 칸을 격자로 — 값 길이가 달라도 행끼리 세로줄이 맞는다 (CLAUDE.md 규칙).
   카드가 넓을 때($cols)는 rem 고정 폭, 좁을 때($colsNarrow)는 균등 분할을 쓴다.
   어느 쪽이든 카드 안 모든 행이 같은 칸 폭을 받으므로 세로줄은 똑같이 맞는다.
   실제 분기 폭(측정): StCard 내부폭 456~899px 구간에서만 $cols, 그 밖은 $colsNarrow.
   넘치는 뱃지(델타 등)는 StStatFull 로 다음 줄에 둔다. */
export const StStatGrid = styled.div<{ $cols: string; $colsNarrow?: string }>`
  display: grid;
  grid-template-columns: ${({ $cols }) => $cols};
  justify-content: start;
  align-items: center;
  gap: 0.35rem 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.gray700};

  /* 칸보다 긴 값(예: "9,999 kcal")이 두 줄로 접혀 행 높이가 들쭉날쭉해지지 않게 */
  > * {
    white-space: nowrap;
  }

  b {
    font-weight: 900;
    color: ${({ theme }) => theme.colors.gray900};
  }

  /* 카드가 좁아지면(폰·PC 두 칸) 칸 수를 줄여 접는다 — 접힌 뒤에도 행끼리는 계속 맞는다 */
  @container workout-card (max-width: 420px) {
    grid-template-columns: ${({ $cols, $colsNarrow }) => $colsNarrow ?? $cols};
  }
`;

/* 줄 전체를 차지하는 칸 — 항상 다음 줄 맨 왼쪽에서 시작한다 */
export const StStatFull = styled.div`
  grid-column: 1 / -1;
  justify-self: start;
`;
