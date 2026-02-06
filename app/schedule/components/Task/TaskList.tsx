/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from "react";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";
import {
  StScrollArea,
  StAddServiceBlock,
  StCompletedSection,
} from "./TaskList.styles";
import TaskCardItem from "./TaskCardItem";

interface TaskListProps {
  schedules: ServiceSchedule[];
  scrollAreaRef: any;
  collapsedIds: Set<string>;
  highlightId: string | null;
  isEditing: boolean;
  today: Date;
  hiddenIds: Set<string>;

  // Handlers
  onToggleHide: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onServiceNameChange: (id: string, name: string) => void;
  onServiceNameBlur: (id: string, name: string) => void | Promise<void>;
  onColorChange: (id: string, color: string) => void | Promise<void>;
  onDeleteService: (id: string) => void | Promise<void>;
  onUpdateTask: (svcId: string, task: TaskPhase) => void | Promise<void>;
  onDeleteTask: (svcId: string, taskId: string) => void | Promise<void>;
  onAddTask: (svcId: string) => void | Promise<void>;
  onAddService: () => void | Promise<void>;
  onUpdateService: (id: string, updates: any) => void | Promise<void>;
}

export default function TaskList({
  schedules,
  scrollAreaRef,
  collapsedIds,
  highlightId,
  isEditing,
  hiddenIds,
  onToggleHide,
  onToggleCollapse,
  onServiceNameChange,
  onServiceNameBlur,
  onColorChange,
  onDeleteService,
  onUpdateTask,
  onDeleteTask,
  onAddTask,
  onAddService,
  onUpdateService,
}: TaskListProps) {
  const [activeColorPickerId, setActiveColorPickerId] = useState<string | null>(
    null,
  );
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // ✨ 1. 분류 로직 확립
  // 진행 중인 프로젝트 (메인 리스트)
  const mainSchedules = schedules.filter((s) => !s.isCompleted);
  // 완료된 프로젝트 (하단 고정)
  const allCompletedSchedules = schedules.filter((s) => s.isCompleted);

  // 컬러피커 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setActiveColorPickerId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 카드 렌더링 헬퍼 (중복 방지)
  const renderTaskCard = (service: ServiceSchedule) => (
    <TaskCardItem
      key={service.id}
      service={service}
      isCollapsed={collapsedIds.has(service.id)}
      isHighlighted={highlightId === service.id}
      isHidden={service.isHidden}
      isEditing={isEditing}
      isPickerOpen={activeColorPickerId === service.id}
      pickerRef={pickerRef}
      onOpenPicker={() =>
        setActiveColorPickerId(
          activeColorPickerId === service.id ? null : service.id,
        )
      }
      onClosePicker={() => setActiveColorPickerId(null)}
      onToggleCollapse={() => onToggleCollapse(service.id)}
      onToggleHide={() => onToggleHide(service.id)}
      onServiceNameChange={(name) => onServiceNameChange(service.id, name)}
      onServiceNameBlur={(name) => onServiceNameBlur(service.id, name)}
      onColorChange={(color) => onColorChange(service.id, color)}
      onDeleteService={() => onDeleteService(service.id)}
      onUpdateTask={(task) => onUpdateTask(service.id, task)}
      onDeleteTask={(taskId) => onDeleteTask(service.id, taskId)}
      onAddTask={() => onAddTask(service.id)}
      onUpdateService={onUpdateService}
    />
  );

  return (
    <StScrollArea ref={scrollAreaRef}>
      {/* 1. 메인 리스트 (진행 중) */}
      {mainSchedules.map(renderTaskCard)}

      {/* 2. 완료 프로젝트 (더 보기 섹션) */}
      {allCompletedSchedules.length > 0 && (
        <StCompletedSection>
          <button
            className="toggle-btn"
            onClick={() => setIsCompletedOpen(!isCompletedOpen)}
          >
            {isCompletedOpen ? (
              <span className="toggle-label">
                <ExpandLessIcon fontSize="inherit" />
                완료 프로젝트 접기
              </span>
            ) : (
              <span className="toggle-label">
                <ExpandMoreIcon fontSize="inherit" />
                완료 프로젝트 더 보기 ({allCompletedSchedules.length})
              </span>
            )}
          </button>

          {isCompletedOpen && (
            <div className="completed-list">
              {allCompletedSchedules.map(renderTaskCard)}
            </div>
          )}
        </StCompletedSection>
      )}

      {isEditing && (
        <StAddServiceBlock onClick={onAddService}>
          <span className="plus-icon">+</span>
          <span>새 프로젝트 카드 추가하기</span>
        </StAddServiceBlock>
      )}
    </StScrollArea>
  );
}
