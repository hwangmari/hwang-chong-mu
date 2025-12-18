"use client";

import styled, { css, keyframes } from "styled-components";
import PersonIcon from "@/components/icons/PersonIcon";

interface Props {
  currentName: string;
  isEditing: boolean;
  onChangeName: (name: string) => void;
  onCancelEdit: () => void;
}

export default function NameInput({
  currentName,
  isEditing,
  onChangeName,
  onCancelEdit,
}: Props) {
  return (
    <StInputWrapper>
      <StNameInputBox $isEditing={isEditing}>
        <StIconBadge>
          <PersonIcon className="w-5 h-5" />
        </StIconBadge>
        <StNameInput
          type="text"
          placeholder="이름 입력"
          value={currentName}
          onChange={(e) => onChangeName(e.target.value)}
          readOnly={isEditing}
          disabled={isEditing}
        />
        {(isEditing || currentName.length > 0) && (
          <StResetButton onClick={onCancelEdit}>✕</StResetButton>
        )}
      </StNameInputBox>
    </StInputWrapper>
  );
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const StInputWrapper = styled.div`
  width: 100%;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  position: relative;
  animation: ${fadeIn} 0.3s ease-out;
`;

const StNameInputBox = styled.div<{ $isEditing: boolean }>`
  flex: 1;
  padding: 0.5rem;
  border-radius: 1.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: background-color 0.2s;

  ${({ $isEditing, theme }) =>
    $isEditing
      ? css`
          background-color: ${theme.colors.gray100};
          border-color: ${theme.colors.gray300};
        `
      : css`
          background-color: ${theme.colors.white};
          border-color: ${theme.colors.gray200};
        `}
`;

const StIconBadge = styled.span`
  padding: 0.5rem;
  background-color: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray600};
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StNameInput = styled.input`
  flex: 1;
  background-color: transparent;
  outline: none;
  border: none;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  min-width: 0;
  font-size: 0.875rem;

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray300};
  }
  &:disabled {
    cursor: not-allowed;
    color: ${({ theme }) => theme.colors.gray500};
  }
  @media ${({ theme }) => theme.media.desktop} {
    font-size: 1rem;
  }
`;

const StResetButton = styled.button`
  margin-right: 0.5rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 700;
  padding: 0 0.5rem;
  &:hover {
    color: ${({ theme }) => theme.colors.gray600};
  }
`;
