/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from "react";
import styled from "styled-components";
import { startOfDay } from "date-fns";
import { ServiceSchedule } from "@/types/work-schedule";
import { useParams, useRouter, useSearchParams } from "next/navigation";

// Hooks & Utils
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
  const router = useRouter();
  const params = useParams();
  const today = startOfDay(new Date());
  const currentYear = new Date().getFullYear();

  // 1. 데이터/API 로직 Hook - useScheduleActions에서 반환하는 함수들을 구조 분해 할당
  const {
    schedules,
    isEditing,
    setIsEditing,
    handleUpdateService,
    ...actions
  } = useScheduleActions(initialSchedules, boardId, onToggleHide, onUpdateAll);

  // 2. UI/스크롤 로직 Hook
  const { scrollAreaRef, collapsedIds, highlightId, toggleCollapse } =
    useCardScroll();

  // 3. 텍스트 복사 핸들러 - hiddenIds와 currentYear를 반영하여 텍스트 생성
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
      // 1. 해당 ID의 요소를 찾음
      const element = document.getElementById(
        `service-card-${highlightIdFromQuery}`,
      );
      if (element) {
        // 2. 부드럽게 스크롤 이동
        element.scrollIntoView({ behavior: "smooth", block: "center" });

        // 3. 시각적 하이라이트 효과 (예: 테두리 깜빡임)
        element.style.transition = "all 0.5s";
        element.style.boxShadow = "0 0 0 4px #3b82f6";
        setTimeout(() => {
          element.style.boxShadow = "none";
        }, 2000);
      }
    }
  }, [highlightIdFromQuery]);

  // ✨ 칸반 페이지로 이동하는 함수
  const goToKanban = () => {
    router.push(`/schedule/${params.id}/kanban`);
  };

  return (
    <StContainer>
      {/* 상단 컨트롤 바 */}
      <StControlBar>
        <div className="left">
          {/* ✨ 칸반 이동 버튼 추가 */}
          <button className="nav-btn" onClick={goToKanban}>
            📊 칸반보드로 보기
          </button>

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

      {/* 리스트 컴포넌트 */}
      <TaskList
        schedules={schedules}
        scrollAreaRef={scrollAreaRef as any}
        collapsedIds={collapsedIds}
        highlightId={highlightId}
        isEditing={isEditing}
        today={today}
        hiddenIds={hiddenIds}
        // 핸들러 연결
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

// --- Styles ---

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
