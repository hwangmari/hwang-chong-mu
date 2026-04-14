import styled from "styled-components";

export const StSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

export const StSectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};
`;

export const StVoterCount = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray400};
`;

export const StPlaceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const StPlaceCard = styled.div<{
  $isLeading: boolean;
  $isSelectable: boolean;
  $isSelected: boolean;
}>`
  padding: 1rem;
  border-radius: 0.75rem;
  border: 2px solid
    ${({ $isSelected, $isLeading, theme }) =>
      $isSelected
        ? theme.colors.blue500
        : $isLeading
          ? theme.colors.amber200
          : theme.colors.gray100};
  background: ${({ $isSelected, $isLeading, theme }) =>
    $isSelected
      ? theme.colors.blue50
      : $isLeading
        ? theme.colors.amber50
        : theme.colors.white};
  cursor: ${({ $isSelectable }) => ($isSelectable ? "pointer" : "default")};
  transition: all 0.15s;

  ${({ $isSelectable, theme }) =>
    $isSelectable &&
    `
    &:hover {
      border-color: ${theme.colors.blue200};
    }
  `}
`;

export const StPlaceTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
`;

export const StPlaceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

export const StCrown = styled.span`
  font-size: 1rem;
`;

export const StPlaceName = styled.span`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StVoteCount = styled.span<{ $isLeading: boolean }>`
  font-weight: 800;
  font-size: 1rem;
  color: ${({ $isLeading, theme }) =>
    $isLeading ? theme.colors.amber500 : theme.colors.gray500};
`;

export const StPlaceMeta = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray400};
  display: flex;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StBarWrapper = styled.div`
  height: 0.5rem;
  background: ${({ theme }) => theme.colors.gray100};
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

export const StBar = styled.div<{ $width: number; $isLeading: boolean }>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  background: ${({ $isLeading, theme }) =>
    $isLeading ? theme.colors.amber500 : theme.colors.blue500};
  border-radius: 9999px;
  transition: width 0.3s ease;
`;

export const StVoters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
`;

export const StVoterChip = styled.span`
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  background: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray600};
  font-weight: 600;
`;

export const StNaverLink = styled.a`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.green600};
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const StTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const StMemberChipSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const StChipLabel = styled.span`
  font-size: 0.813rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
`;

export const StMemberChipList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const StMemberChip = styled.button<{
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

export const StVoteForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const StSelectedInfo = styled.div`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray500};
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.gray50};
  border-radius: 0.5rem;
  text-align: center;

  b {
    color: ${({ theme }) => theme.colors.blue600};
  }
`;

export const StDoneMessage = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;

  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1rem;
  }
`;

export const StShareInfo = styled.p`
  text-align: center;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray400};
  margin-top: 0.5rem;
  padding-bottom: 2rem;
`;

export const StEditButton = styled.button`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.blue600};
  background: ${({ theme }) => theme.colors.blue50};
  border: 1px solid ${({ theme }) => theme.colors.blue200};
  border-radius: 0.5rem;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.blue100};
  }
`;

export const StEditPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const StSearchRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

export const StSearchResultList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const StSearchResultItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  background: ${({ theme }) => theme.colors.white};
`;

export const StSearchResultInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const StSearchResultName = styled.div`
  font-weight: 700;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StSearchResultMeta = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray400};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StCurrentPlaces = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray100};
  padding-top: 1rem;
`;

export const StSubTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray600};
  margin-bottom: 0.5rem;
`;

export const StCurrentPlaceItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray800};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray50};
`;

export const StDeleteButton = styled.button`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.rose600};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.2rem 0.5rem;

  &:hover {
    text-decoration: underline;
  }
`;
