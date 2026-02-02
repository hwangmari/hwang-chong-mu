import styled, { css } from "styled-components";

// 공통 Input 스타일 (Mixin)
const inputStyles = css`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px;
  font-size: 0.9rem;
  &:focus {
    outline: 2px solid #3b82f6;
    border-color: transparent;
  }
`;

export const StCard = styled.div<{
  $isCompleted?: boolean;
  $isEditing: boolean;
}>`
  background: white;
  border: 1px solid #e5e7eb;
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
        border-color: #111827;
        transform: translateY(-4px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        h3 {
          color: #111827;
        }
      }
    `}

  // ✨ 완료된 프로젝트 카드 스타일
  background-color: ${(props) => (props.$isCompleted ? "#f9fafb" : "#fff")};
  opacity: ${(props) => (props.$isCompleted ? 0.7 : 1)};
  transition: all 0.3s ease;

  .service-title-text {
    color: ${(props) => (props.$isCompleted ? "#9ca3af" : "inherit")};
  }

  .card-header {
    margin-bottom: 0.75rem;
    h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1f2937;
      transition: color 0.2s;
    }
  }

  .desc {
    color: #4b5563;
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
      color: #9ca3af;
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
          background: #111827;
          color: white;
          border: none;
          &:hover {
            background: black;
          }
        `
      : css`
          background: #f3f4f6;
          color: #4b5563;
          border: 1px solid #e5e7eb;
          &:hover {
            background: #e5e7eb;
          }
        `}
`;

export const StIconButton = styled.button<{ $isDelete?: boolean }>`
  background: none;
  border: none;
  font-size: 0.8rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: ${({ $isDelete }) => ($isDelete ? "#fee2e2" : "#f3f4f6")};
    color: ${({ $isDelete }) => ($isDelete ? "#ef4444" : "#374151")};
  }
`;
