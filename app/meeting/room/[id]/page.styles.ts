import styled from "styled-components";

// 헤더(RoomHeader)를 VOTING 단계의 2열 데스크톱 컨테이너와 동일한 폭으로
// 정렬하기 위한 래퍼. 모바일/태블릿(<1024px)에서는 기존과 동일하게 540px로
// 좁게 유지하고, 데스크톱에서만 폭을 100%(=StContainer의 1024px 상한)로 넓힌다.
export const StHeaderWrapper = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.layout.narrowWidth};
  margin: 0 auto;

  @media ${({ theme }) => theme.media.desktop} {
    max-width: ${({ theme }) => theme.layout.maxWidth};
  }
`;

export const StLoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.gray50};
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 700;
`;

export const StGuideTextWrapper = styled.div`
  margin-bottom: 0.5rem;
  word-break: keep-all;
`;

export const StHighlightText = styled.b`
  color: ${({ theme }) => theme.colors.rose500};
  text-decoration: underline;
  text-decoration-color: ${({ theme }) => theme.colors.rose200};
  text-decoration-thickness: 4px;
`;

export const StGuideRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: space-between;
`;

export const StGuideButton = styled.button`
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

export const StInputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  /* 좁은 사이드바(PC)·모바일에서 이름입력과 버튼이 겹치지 않도록 줄바꿈 허용
     (안 맞으면 이름입력이 한 줄, 다돼요/다안돼요가 아래 줄로 내려감) */
  flex-wrap: wrap;
  margin-bottom: 20px;
`;

export const StNameChipList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

export const StNameChip = styled.button<{
  $isActive: boolean;
  $hasVoted: boolean;
}>`
  height: 36px;
  padding: 0 0.875rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 800;
  border: 2px solid transparent;
  transition: all 0.2s;

  ${({ $isActive, $hasVoted, theme }) =>
    $isActive
      ? `
        background-color: ${theme.colors.gray900};
        color: ${theme.colors.white};
        border-color: ${theme.colors.gray900};
      `
      : $hasVoted
        ? `
        background-color: ${theme.colors.white};
        color: ${theme.colors.amber500};
        border-color: ${theme.colors.amber200};
      `
        : `
        background-color: ${theme.colors.white};
        color: ${theme.colors.gray600};
        border-color: ${theme.colors.gray200};
      `}

  &:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  &:active {
    transform: scale(0.95);
  }
`;

export const StConfirmVoteRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

export const StConfirmGuide = styled.span`
  font-size: 0.813rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray600};
`;

export const StConfirmVoteBtn = styled.button`
  height: 44px;
  padding: 0 1.25rem;
  border-radius: 9999px;
  background-color: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.white};
  font-weight: 800;
  font-size: 0.85rem;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.02);
  }
  &:active {
    transform: scale(0.95);
  }
`;

export const StBackToVotingButton = styled.button`
  width: 100%;
  padding: 0.75rem 0;
  margin-top: 1rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 600;
  font-size: 0.813rem;
  text-align: center;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.gray600};
  }
`;
