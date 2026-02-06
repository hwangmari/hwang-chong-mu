import React, { useEffect } from "react";
import styled from "styled-components";
import { startOfDay } from "date-fns";
import { ServiceSchedule } from "@/types/work-schedule";
import { useSearchParams } from "next/navigation"; // useRouter, useParams 제거 가능

import { useScheduleActions } from "@/hooks/useScheduleActions";
import { useCardScroll } from "@/hooks/useCardScroll";
import { buildScheduleText } from "@/utils/clipboardBuilder";
import TaskList from "./Task/TaskList";

interface Props {
  boardId: string;
  schedules: ServiceSchedule[];
  hiddenIds: Set<string>;
  onToggleHide: (id: string) => void;
  onUpdateAll?: (services: ServiceSchedule[]) => void;
}

export default function RightTaskPanel({
  boardId,
  schedules: initialSchedules,
  hiddenIds,
  onToggleHide,
  onUpdateAll,
}: Props) {
  const today = startOfDay(new Date());
  const currentYear = new Date().getFullYear();

  const {
    schedules,
    isEditing,
    setIsEditing,
    handleUpdateService,
    ...actions
  } = useScheduleActions(initialSchedules, boardId, onToggleHide, onUpdateAll);

  const { scrollAreaRef, collapsedIds, highlightId, toggleCollapse } =
    useCardScroll();

  const handleCopyText = () => {
    const text = buildScheduleText(schedules, hiddenIds, currentYear);
    navigator.clipboard
      .writeText(text)
      .then(() => alert("일정이 복사되었습니다! (메모 포함)"));
  };

  const searchParams = useSearchParams();
  const highlightIdFromQuery = searchParams.get("highlightId");

  useEffect(() => {
    if (highlightIdFromQuery) {
      const element = document.getElementById(
        `service-card-${highlightIdFromQuery}`,
      );
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.style.transition = "all 0.5s";
        element.style.boxShadow = "0 0 0 4px #3b82f6";
        setTimeout(() => {
          element.style.boxShadow = "none";
        }, 2000);
      }
    }
  }, [highlightIdFromQuery]);

  return (
    <StContainer>
      <StControlBar>
        <div className="left">
          {!isEditing && (
            <button className="copy-btn" onClick={handleCopyText}>
              📋 텍스트 복사
            </button>
          )}
        </div>
        <div className="right">
          <button
            className={`mode-btn ${isEditing ? "active" : ""}`}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "완료" : "수정"}
          </button>
        </div>
      </StControlBar>

      <TaskList
        schedules={schedules}
        scrollAreaRef={scrollAreaRef as any}
        collapsedIds={collapsedIds}
        highlightId={highlightId}
        isEditing={isEditing}
        today={today}
        hiddenIds={hiddenIds}
        onToggleHide={onToggleHide}
        onToggleCollapse={toggleCollapse}
        onUpdateService={handleUpdateService}
        onServiceNameChange={actions.handleServiceNameChange}
        onServiceNameBlur={actions.handleServiceNameBlur}
        onColorChange={actions.handleColorChange}
        onDeleteService={actions.handleDeleteService}
        onUpdateTask={actions.updateTask}
        onDeleteTask={actions.deleteTask}
        onAddTask={actions.handleAddTask}
        onAddService={actions.handleAddService}
      />
    </StContainer>
  );
}

const StContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  overflow: hidden;
  position: relative;
`;

const StControlBar = styled.div`
  padding: 0 1rem;
  border-bottom: 1px solid #ebebec;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  z-index: 10;
  height: 60px;

  .mode-btn {
    padding: 6px 16px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    border: 1px solid #d1d5db;
    background-color: white;
    color: #374151;
    transition: all 0.2s;
    &.active {
      background-color: #111827;
      color: white;
      border-color: #111827;
    }
    &:hover {
      transform: translateY(-1px);
    }
  }

  .copy-btn {
    font-size: 0.85rem;
    color: #4b5563;
    background: none;
    border: 1px solid #e5e7eb;
    padding: 4px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      background-color: #f3f4f6;
      color: #111827;
      border-color: #d1d5db;
    }
  }
`;
