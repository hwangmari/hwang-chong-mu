import styled, { css } from "styled-components";

const highlightAnimation = css`
  animation: flash 1.5s ease-out;
  @keyframes flash {
    0% {
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
      border-color: #3b82f6;
      background-color: #eff6ff;
    }
    100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
      background-color: white;
    }
  }
`;

export const StScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 1rem 2rem;
  padding-right: 8px;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #e5e7eb;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
`;

export const StCard = styled.div<{
  $isCollapsed?: boolean;
  $isHighlighted?: boolean;
  $isHidden?: boolean;
  $isCompleted?: boolean;
}>`
  flex-shrink: 0;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  scroll-margin-top: 20px;

  ${({ $isHidden }) =>
    $isHidden &&
    css`
      opacity: 0.6;
      background-color: #f9fafb;
      border-style: dashed;
    `}

  ${({ $isCollapsed }) =>
    $isCollapsed &&
    css`
      background-color: #fcfcfc;
    `}
  ${({ $isHighlighted }) => $isHighlighted && highlightAnimation}

  opacity: ${(props) => (props.$isCompleted ? 0.7 : 1)};
  background-color: ${(props) => (props.$isCompleted ? "#f9fafb" : "#ffffff")};
  transition: all 0.3s ease; // 정렬 이동 시 부드러운 효과

  .service-title-text {
    color: ${(props) => (props.$isCompleted ? "#9ca3af" : "inherit")};
  }
`;

export const StCardHeader = styled.div<{ $color: string }>`
  padding: 10px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
  border-left: 6px solid ${({ $color }) => $color};
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 52px;

  .header-left {
    flex: 1;
    margin-right: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    .accordion-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.8rem;
      color: #6b7280;
      transition: transform 0.2s;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      &:hover {
        background-color: #e5e7eb;
        color: #374151;
      }
      &.collapsed {
        transform: rotate(-90deg);
      }
    }
    .service-title-input {
      width: 100%;
      font-weight: 700;
      background: transparent;
      border: none;
      font-size: 1rem;
      &:focus {
        outline: none;
        background: white;
      }
    }
    .service-title-text {
      font-size: 1rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
      cursor: pointer;
      &:hover {
        opacity: 0.8;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;

    .visibility-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #9ca3af;
      padding: 4px;
      display: flex;
      align-items: center;
      transition: all 0.2s;
      &:hover {
        color: #4b5563;
        transform: scale(1.1);
      }
      &.hidden {
        color: #d1d5db;
      }
    }

    .delete-service-btn {
      border: none;
      background: none;
      cursor: pointer;
      opacity: 0.5;
      font-size: 1.1rem;
      &:hover {
        opacity: 1;
        transform: scale(1.1);
      }
    }
    .color-indicator {
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }
  }
`;

export const StHiddenMessage = styled.div`
  padding: 2rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.9rem;
`;

export const StColorTrigger = styled.div<{ $color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 0 0 1px #d1d5db;
  transition: transform 0.2s;
  &:hover {
    transform: scale(1.1);
  }
`;

export const StColorPopover = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 50;
  width: 180px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .preset-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .custom-picker-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #6b7280;
    padding-top: 8px;
    border-top: 1px dashed #e5e7eb;

    input[type="color"] {
      border: none;
      width: 24px;
      height: 24px;
      padding: 0;
      background: none;
      cursor: pointer;
    }
  }
`;

export const StColorChip = styled.div<{ $color: string; $isSelected: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  cursor: pointer;
  position: relative;
  transition: transform 0.1s;
  &:hover {
    transform: scale(1.15);
  }
  ${({ $isSelected }) =>
    $isSelected &&
    css`
      box-shadow:
        0 0 0 2px white,
        0 0 0 4px #3b82f6;
      z-index: 1;
    `}
`;

export const StCardBody = styled.div`
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: slideDown 0.2s ease-out;
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const StPastSection = styled.details`
  margin-top: 8px;
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
  summary {
    font-size: 0.85rem;
    font-weight: 600;
    color: #6b7280;
    cursor: pointer;
    user-select: none;
    margin-bottom: 12px;
    list-style: none;
    display: flex;
    align-items: center;
    gap: 6px;
    &::before {
      content: "▶";
      font-size: 0.6rem;
      transition: transform 0.2s;
    }
  }
  &[open] summary::before {
    transform: rotate(90deg);
  }
  .past-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    background-color: #f9fafb;
    padding: 12px;
    border-radius: 8px;
  }
`;

export const StFooter = styled.div`
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const StAddButton = styled.button`
  background-color: white;
  color: #6b7280;
  border: 1px dashed #d1d5db;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background-color: #f9fafb;
    color: #111827;
  }
`;

export const StAddServiceBlock = styled.button`
  width: 100%;
  padding: 1.5rem;
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
  .plus-icon {
    font-size: 1.5rem;
  }
  &:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
    color: #3b82f6;
  }
`;

export const StTaskItem = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e5e7eb;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .task-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px; /* 날짜와 간격 추가 */

    .read-mode-header {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
    }
    .task-title-input {
      flex: 1;
      font-size: 0.9rem;
      font-weight: 600;
      border: none;
      background: transparent;
      padding: 2px 0;
      border-bottom: 1px solid transparent;
      &:focus {
        border-bottom: 1px solid #3b82f6;
        outline: none;
      }
    }
    .task-title-text {
      font-size: 0.9rem;
      font-weight: 600;
      color: #374151;
      padding: 2px 0;
      flex: 1;
    }

    .delete-task-btn {
      color: #9ca3af;
      font-size: 1.2rem;
      cursor: pointer;
      background: none;
      border: none;
      padding: 0 4px;
      &:hover {
        color: #ef4444;
      }
    }

    .memo-toggle-btn,
    .memo-icon-read {
      background: none;
      border: none;
      cursor: pointer;
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      color: #d1d5db;

      &:hover {
        color: #9ca3af;
        transform: scale(1.1);
      }

      &.active {
        color: #f59e0b;
        filter: drop-shadow(0 1px 2px rgba(245, 158, 11, 0.3));
        opacity: 1;
      }
    }
  }
`;

export const StDateInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  width: 100%;

  .date-text-input {
    flex: 1;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 6px 8px;
    font-size: 0.85rem;
    color: #374151;
    font-family: monospace;
    letter-spacing: 0.5px;
    transition: border-color 0.2s;
    &:focus {
      border-color: #3b82f6;
      outline: none;
    }
  }
  .date-text-display {
    font-size: 0.8rem;
    color: #6b7280;
    font-family: monospace;
    letter-spacing: 0.5px;
  }

  .calendar-toggle-btn {
    background: none;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
    &:hover {
      background-color: #f3f4f6;
      border-color: #9ca3af;
    }
  }
`;

export const StCalendarPopover = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  z-index: 50;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .popover-row {
    display: flex;
    flex-direction: column;
    gap: 4px;

    label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
    }
    input[type="date"] {
      width: 100%;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      padding: 6px;
      font-size: 0.85rem;
      &:focus {
        outline: 2px solid #3b82f6;
        border-color: transparent;
      }
    }
  }
`;

export const StMemoContainer = styled.div`
  margin-top: 6px;
  padding: 8px;
  background-color: #fffbeb;
  border-radius: 6px;
  border: 1px solid #fcd34d;
  animation: fadeIn 0.2s ease-in-out;
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .memo-input {
    width: 100%;
    border: none;
    background: transparent;
    resize: none;
    font-size: 0.85rem;
    color: #4b5563;
    line-height: 1.4;
    font-family: inherit;
    &:focus {
      outline: none;
    }
  }
  .memo-text {
    font-size: 0.85rem;
    color: #92400e;
    white-space: pre-wrap;
    margin: 0;
    line-height: 1.4;
  }
`;

export const StCompletedSection = styled.div`
  margin-top: 20px;
  padding: 10px 0;
  border-top: 1px solid #eee;

  .toggle-btn {
    width: 100%;
    padding: 8px;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    color: #6c757d;
    font-size: 0.85rem;
    cursor: pointer;
    margin-bottom: 10px;

    &:hover {
      background: #e9ecef;
    }

    .toggle-label {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
  }

  .completed-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    opacity: 0.8;
  }
`;
