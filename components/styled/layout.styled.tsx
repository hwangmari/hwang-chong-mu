import styled from "styled-components";
export const StContainer = styled.div`
  padding: 2rem 1rem;
  max-width: 1024px;
  margin: 0 auto;
`;

export const StWrapper = styled.div`
  min-width: 320px;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.narrowWidth};
  margin: 0 auto;
  background-color: ${({ theme }) => theme.colors.gray50};
  color: ${({ theme }) => theme.colors.gray900};
  position: relative;
`;

export const StWaitingBox = styled.div`
  max-width: ${({ theme }) => theme.layout.narrowWidth};
  height: 180px;
  display: flex;
  margin: 0 auto;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  background: ${({ theme }) => theme.semantic.bg};
  border-radius: 1rem;
  color: ${({ theme }) => theme.semantic.subText};
  border: 1px solid ${({ theme }) => theme.semantic.border};
`;

export const StSection = styled.div`
  background: ${({ theme }) => theme.colors.white};
  padding: 1.25rem;
  border-radius: 1rem;
  margin-bottom: 1.25rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

/* 섹션 안 소제목 — 1rem / 800 */
export const StSectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

/* 두 개짜리 토글 공통 패턴 (야근 계산기 등) */
export const StSegmented = styled.div`
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.semantic.bg};
  border: 1px solid ${({ theme }) => theme.semantic.border};
`;

export const StSegmentButton = styled.button<{ $active?: boolean }>`
  flex: 1;
  min-height: 2.4rem;
  padding: 0.5rem 0.6rem;
  border-radius: 0.6rem;
  font-size: 0.88rem;
  font-weight: ${({ $active }) => ($active ? 800 : 600)};
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;

  background: ${({ $active, theme }) =>
    $active ? theme.colors.white : "transparent"};
  border: 1px solid
    ${({ $active, theme }) => ($active ? theme.semantic.border : "transparent")};
  color: ${({ $active, theme }) =>
    $active ? theme.semantic.text : theme.semantic.subText};

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.semantic.text};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/* 인풋 옆에 붙는 작은 버튼 (추가 / 검색 등) — 인풋과 같은 2.75rem 높이 */
export const StInlineButton = styled.button<{ $variant?: "primary" }>`
  flex-shrink: 0;
  height: 2.75rem;
  padding: 0 1rem;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;

  background: ${({ $variant, theme }) =>
    $variant === "primary" ? theme.semantic.primary : theme.colors.white};
  color: ${({ $variant, theme }) =>
    $variant === "primary" ? theme.colors.white : theme.semantic.text};
  border: 1px solid
    ${({ $variant, theme }) =>
      $variant === "primary" ? theme.semantic.primary : theme.semantic.border};

  &:hover:not(:disabled) {
    background: ${({ $variant, theme }) =>
      $variant === "primary" ? theme.colors.blue700 : theme.semantic.bg};
    border-color: ${({ $variant, theme }) =>
      $variant === "primary" ? theme.colors.blue700 : theme.semantic.border};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.gray200};
    color: ${({ theme }) => theme.colors.gray500};
    border-color: ${({ theme }) => theme.colors.gray200};
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/* 폼 안 작은 라벨 (eyebrow) — 공용 Input의 label과 같은 톤 */
export const StFieldLabel = styled.span`
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.semantic.subText};
`;

/* 관련 있는 토글/옵션을 한 덩어리로 묶는 테두리 그룹 (행 사이 구분선) */
export const StOptionGroup = styled.div`
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.8rem;
  overflow: hidden;
`;

/* 왼쪽 라벨 / 오른쪽 컨트롤 레일 */
export const StOptionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 2.9rem;
  padding: 0.5rem 0.85rem;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.semantic.border};
  }
`;

/* 모바일은 한 컬럼(540px), 데스크톱에선 1024px 두 컬럼 캔버스 */
export const StPageWrapper = styled.div`
  min-width: 320px;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.narrowWidth};
  margin: 0 auto;
  color: ${({ theme }) => theme.colors.gray900};
  position: relative;

  @media ${({ theme }) => theme.media.desktop} {
    max-width: ${({ theme }) => theme.layout.maxWidth};
  }
`;

/* 블록이 하나뿐인 페이지(약관·다이어트 등) — 540px보다는 넓게, 본문은 읽기 좋은 폭으로 */
export const StReadWrapper = styled.div`
  min-width: 320px;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.narrowWidth};
  margin: 0 auto;
  color: ${({ theme }) => theme.colors.gray900};
  position: relative;

  @media ${({ theme }) => theme.media.desktop} {
    max-width: 720px;
  }
`;

export const StFlexBox = styled.div<{ $leftRatio?: number }>`
  width: 100%;
  max-width: ${({ theme }) => theme.layout.narrowWidth};
  margin: 0 auto;

  .flex-rgt-box {
    margin-top: 1.25rem;
  }
  @media ${({ theme }) => theme.media.desktop} {
    display: flex;
    max-width: ${({ theme }) => theme.layout.maxWidth};
    gap: 30px;
    align-items: flex-start;
    & > div {
      flex: 1;
      min-width: 0;
    }
    .flex-lft-box {
      position: sticky;
      top: 80px;
      flex: ${({ $leftRatio }) => $leftRatio ?? 1};
    }
    .flex-rgt-box {
      margin-top: 0;
      flex: 1;
    }
  }
`;

export const StLoadingWrapper = styled.div`
  min-height: 50vh;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 600;
`;
