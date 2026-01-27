/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { TaskPhase } from "@/types/work-schedule";
import { StTaskItem } from "./TaskCardItemRow.styles";
import DateInput from "./DateInput";
import MemoArea from "./MemoArea";

// 분리된 컴포넌트들

interface TaskCardItemRowProps {
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
}: TaskCardItemRowProps) {
  const [titleValue, setTitleValue] = useState(task.title);
  const [showMemo, setShowMemo] = useState(!!task.memo);

  // Task 변경 시 상태 동기화
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

  return (
    <StTaskItem $isPast={isReadOnly}>
      {/* 1. 헤더 (제목 + 버튼들) */}
      <div className="task-header">
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

      {/* 2. 날짜 입력 (컴포넌트 분리됨) */}
      <DateInput
        startDate={task.startDate}
        endDate={task.endDate}
        onUpdate={handleDateUpdate}
        isReadOnly={isReadOnly}
      />

      {/* 3. 메모 영역 (컴포넌트 분리됨) */}
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
