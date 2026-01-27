/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from "react";
import styled, { css } from "styled-components";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { format, parse, isValid } from "date-fns";
import { TaskPhase } from "@/types/work-schedule";

// 분리된 컴포넌트들 (이전과 동일)
import DateInput from "./DateInput";
import MemoArea from "./MemoArea";

interface TaskRowProps {
  task: TaskPhase;
  serviceId: string;
  onUpdate: (svcId: string, task: TaskPhase) => void;
  onDelete: (svcId: string, taskId: string) => void;
  isReadOnly?: boolean;
}

const MemoIcon = () => <ChatBubbleOutlineIcon fontSize="small" />;

export default function TaskCardItemRow({
  task,
  serviceId,
  onUpdate,
  onDelete,
  isReadOnly = false,
}: TaskRowProps) {
  const [titleValue, setTitleValue] = useState(task.title);
  const [showMemo, setShowMemo] = useState(!!task.memo);

  useEffect(() => {
    setTitleValue(task.title);
    if (task.memo) setShowMemo(true);
  }, [task]);

  const handleTitleBlur = () => {
    if (titleValue !== task.title) {
      onUpdate(serviceId, { ...task, title: titleValue });
    }
  };

  const handleDateUpdate = (start: Date, end: Date) => {
    onUpdate(serviceId, { ...task, startDate: start, endDate: end });
  };

  const handleMemoUpdate = (newMemo: string) => {
    onUpdate(serviceId, { ...task, memo: newMemo });
  };

  // ✨ 완료 토글 핸들러
  const toggleComplete = () => {
    onUpdate(serviceId, { ...task, isCompleted: !task.isCompleted });
  };

  return (
    <StTaskItem $isCompleted={task.isCompleted}>
      <div className="task-header">
        {/* ✨ [NEW] 완료 체크박스 */}
        {!isReadOnly && (
          <input
            type="checkbox"
            className="complete-checkbox"
            checked={!!task.isCompleted}
            onChange={toggleComplete}
            title="완료 처리"
          />
        )}

        {isReadOnly ? (
          <>
            <span className="task-title-text">{task.title}</span>
            {task.memo && (
              <button
                className={`memo-icon-read ${showMemo ? "active" : ""}`}
                onClick={() => setShowMemo(!showMemo)}
                title="메모 보기"
              >
                <MemoIcon />
              </button>
            )}
          </>
        ) : (
          <>
            <input
              type="text"
              className="task-title-input"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="업무명"
            />
            <button
              className={`memo-toggle-btn ${task.memo || showMemo ? "active" : ""}`}
              onClick={() => setShowMemo(!showMemo)}
              tabIndex={-1}
              title="메모 입력"
            >
              <MemoIcon />
            </button>
            <button
              className="delete-task-btn"
              onClick={() => onDelete(serviceId, task.id)}
              title="삭제"
            >
              ×
            </button>
          </>
        )}
      </div>

      <DateInput
        startDate={task.startDate}
        endDate={task.endDate}
        onUpdate={handleDateUpdate}
        isReadOnly={isReadOnly}
      />

      {showMemo && (
        <MemoArea
          initialMemo={task.memo || ""}
          onUpdate={handleMemoUpdate}
          isReadOnly={isReadOnly}
        />
      )}
    </StTaskItem>
  );
}

// --- Styles ---

const StTaskItem = styled.div<{ $isCompleted?: boolean }>`
  display: flex;
  flex-direction: column;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e5e7eb;
  transition: all 0.2s;

  /* ✨ 완료된 항목 스타일: 투명도 + 취소선 */
  ${({ $isCompleted }) =>
    $isCompleted &&
    css`
      opacity: 0.5;
      .task-title-input,
      .task-title-text {
        text-decoration: line-through;
        color: #9ca3af;
      }
    `}

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .task-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;

    /* 체크박스 스타일 */
    .complete-checkbox {
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: #3b82f6;
    }

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
