import styled, { css } from "styled-components";

const inputStyles = css`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  border-radius: 6px;
  padding: 8px;
  font-size: 0.9rem;
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.blue500};
    border-color: transparent;
  }
`;

export const StCard = styled.div<{
  $isCompleted?: boolean;
  $isEditing: boolean;
}>`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 16px;
  padding: 1.5rem;
  cursor: ${({ $isEditing }) => ($isEditing ? "default" : "pointer")};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  min-height: 200px;

  ${({ $isEditing }) =>
    !$isEditing &&
    css`
      &:hover {
        border-color: ${({ theme }) => theme.colors.gray900};
        transform: translateY(-4px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        h3 {
          color: ${({ theme }) => theme.colors.gray900};
        }
      }
    `}

  background-color: ${(props) => (props.$isCompleted ? props.theme.colors.gray50 : props.theme.colors.white)};
  opacity: ${(props) => (props.$isCompleted ? 0.7 : 1)};
  transition: all 0.3s ease;

  .service-title-text {
    color: ${(props) => (props.$isCompleted ? props.theme.colors.gray400 : "inherit")};
  }

  .card-header {
    margin-bottom: 0.75rem;
    h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.gray800};
      transition: color 0.2s;
    }
  }

  .desc {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: auto;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .footer {
    margin-top: 1.5rem;
    .actions,
    .view-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
    .view-actions {
      justify-content: space-between;
      width: 100%;
    }
    .arrow {
      font-size: 0.75rem;
      color: ${({ theme }) => theme.colors.gray400};
    }
    .btn-group {
      display: flex;
      gap: 4px;
    }
  }
`;

export const StInput = styled.input`
  ${inputStyles}
  font-weight: 700;
  font-size: 1.1rem;
  padding: 4px 8px;
`;

export const StTextarea = styled.textarea`
  ${inputStyles}
  resize: none;
  line-height: 1.5;
  margin-bottom: auto;
`;

export const StButton = styled.button<{ $variant: "primary" | "secondary" }>`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  margin-left: 8px;
  transition: background 0.2s;

  ${({ $variant }) =>
    $variant === "primary"
      ? css`
          background: ${({ theme }) => theme.colors.gray900};
          color: ${({ theme }) => theme.colors.white};
          border: none;
          &:hover {
            background: ${({ theme }) => theme.colors.black};
          }
        `
      : css`
          background: ${({ theme }) => theme.colors.gray100};
          color: ${({ theme }) => theme.colors.gray600};
          border: 1px solid ${({ theme }) => theme.colors.gray200};
          &:hover {
            background: ${({ theme }) => theme.colors.gray200};
          }
        `}
`;

export const StIconButton = styled.button<{ $isDelete?: boolean }>`
  background: none;
  border: none;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray400};
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: ${({ $isDelete, theme }) => ($isDelete ? theme.colors.rose100 : theme.colors.gray100)};
    color: ${({ $isDelete, theme }) => ($isDelete ? theme.colors.rose500 : theme.colors.gray700)};
  }
`;
