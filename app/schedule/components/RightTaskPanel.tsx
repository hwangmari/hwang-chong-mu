import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import { startOfDay } from "date-fns";
import { SchedulePhase } from "@/types/work-schedule";
import { useSearchParams } from "next/navigation"; // useRouter, useParams 제거 가능

import { useScheduleActions } from "@/hooks/useScheduleActions";
import { useCardScroll } from "@/hooks/useCardScroll";
import { buildScheduleText } from "@/utils/clipboardBuilder";
import TaskList from "./Task/TaskList";

interface Props {
  boardId: string;
  schedules: SchedulePhase[];
  hiddenIds: Set<string>;
  onToggleHide: (id: string) => void;
  onUpdateAll?: (phases: SchedulePhase[]) => void;
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
  const [searchQuery, setSearchQuery] = useState("");

  const {
    schedules,
    isEditing,
    setIsEditing,
    handleUpdateService,
    ...actions
  } = useScheduleActions(initialSchedules, boardId, onToggleHide, onUpdateAll);

  const filteredSchedules = useMemo(() => {
    if (!searchQuery.trim()) return schedules;
    const q = searchQuery.trim().toLowerCase();
    return schedules
      .map((svc) => ({
        ...svc,
        tasks: svc.tasks.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            svc.phaseName.toLowerCase().includes(q),
        ),
      }))
      .filter(
        (svc) =>
          svc.phaseName.toLowerCase().includes(q) || svc.tasks.length > 0,
      );
  }, [schedules, searchQuery]);

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

      <StSearchBar>
        <StSearchInput
          type="text"
          placeholder="프로젝트 또는 일정 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <StClearButton onClick={() => setSearchQuery("")}>✕</StClearButton>
        )}
      </StSearchBar>

      <TaskList
        schedules={filteredSchedules}
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

const StSearchBar = styled.div`
  display: flex;
  align-items: center;
  padding: 0 1rem;
  padding-bottom: 0.5rem;
  background: ${({ theme }) => theme.colors.white};
  position: relative;
`;

const StSearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 8px;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray700};
  background: ${({ theme }) => theme.colors.gray50};
  transition: all 0.2s;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
    background: ${({ theme }) => theme.colors.white};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
  }
  &::placeholder {
    color: ${({ theme }) => theme.colors.gray400};
  }
`;

const StClearButton = styled.button`
  position: absolute;
  right: 1.5rem;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.gray400};
  cursor: pointer;
  font-size: 0.85rem;
  padding: 4px;
  &:hover {
    color: ${({ theme }) => theme.colors.gray700};
  }
`;

const StControlBar = styled.div`
  padding: 0 1rem;
  border-bottom: 1px solid #ebebec;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.white};
  z-index: 10;
  height: 60px;

  .mode-btn {
    padding: 6px 16px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    border: 1px solid ${({ theme }) => theme.colors.gray300};
    background-color: ${({ theme }) => theme.colors.white};
    color: ${({ theme }) => theme.colors.gray700};
    transition: all 0.2s;
    &.active {
      background-color: ${({ theme }) => theme.colors.gray900};
      color: ${({ theme }) => theme.colors.white};
      border-color: ${({ theme }) => theme.colors.gray900};
    }
    &:hover {
      transform: translateY(-1px);
    }
  }

  .copy-btn {
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.gray600};
    background: none;
    border: 1px solid ${({ theme }) => theme.colors.gray200};
    padding: 4px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      background-color: ${({ theme }) => theme.colors.gray100};
      color: ${({ theme }) => theme.colors.gray900};
      border-color: ${({ theme }) => theme.colors.gray300};
    }
  }
`;
