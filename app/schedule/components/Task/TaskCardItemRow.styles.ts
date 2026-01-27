import styled, { css } from "styled-components";

export const StTaskItem = styled.div<{ $isPast?: boolean }>`
  display: flex;
  flex-direction: column;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e5e7eb;
  ${({ $isPast }) =>
    $isPast &&
    css`
      opacity: 0.7;
    `}
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

    /* 메모 버튼 스타일 */
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
      color: #d1d5db; /* 기본 회색 */

      &:hover {
        color: #9ca3af;
        transform: scale(1.1);
      }

      &.active {
        color: #f59e0b; /* 활성화 시 주황색 */
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
