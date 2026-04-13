import styled from "styled-components";

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
  color: #ef4444;
  text-decoration: underline;
  text-decoration-color: #fecaca;
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
  flex-wrap: nowrap;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
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
        color: #f59e0b;
        border-color: #fde68a;
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
