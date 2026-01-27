/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { TaskPhase } from "@/types/work-schedule";

// 분리된 컴포넌트들
import DateInput from "./DateInput";
import MemoArea from "./MemoArea";
import TaskHeader from "./TaskHeader"; // ✨ [NEW] 추가됨

interface TaskRowProps {
  task: TaskPhase;
  serviceId: string;
  onUpdate: (svcId: string, task: TaskPhase) => void;
  onDelete: (svcId: string, taskId: string) => void;
  isReadOnly?: boolean;
}

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

  return (
    <StTaskItem>
      {/* ✨ 헤더 컴포넌트로 교체 */}
      <TaskHeader
        title={task.title}
        titleValue={titleValue}
        hasMemo={!!task.memo}
        showMemo={showMemo}
        isReadOnly={isReadOnly}
        onTitleChange={setTitleValue}
        onTitleBlur={handleTitleBlur}
        onToggleMemo={() => setShowMemo(!showMemo)}
        onDelete={() => onDelete(serviceId, task.id)}
      />

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

const StTaskItem = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e5e7eb;
  transition: all 0.2s;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;
