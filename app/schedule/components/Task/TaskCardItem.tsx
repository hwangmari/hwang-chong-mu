/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
// import { isBefore } from "date-fns"; // ✨ 이제 날짜 비교로 나누지 않으므로 제거 가능 (정렬용으론 사용 안함)
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";
import EyeIcon from "./EyeIcon";
import ColorPicker from "./ColorPicker";
import {
  StCard,
  StCardHeader,
  StColorTrigger,
  StCardBody,
  StPastSection,
  StFooter,
  StAddButton,
  StHiddenMessage,
} from "./TaskList.styles";
import TaskCardItemRow from "./TaskCardItemRow";

interface Props {
  service: ServiceSchedule;
  isCollapsed: boolean;
  isHighlighted: boolean;
  isHidden: boolean;
  isEditing: boolean;
  today: Date;
  isPickerOpen: boolean;
  pickerRef: React.RefObject<HTMLDivElement | null>;

  onToggleCollapse: () => void;
  onToggleHide: () => void;
  onOpenPicker: () => void;
  onClosePicker: () => void;

  onServiceNameChange: (name: string) => void;
  onServiceNameBlur: (name: string) => void;
  onColorChange: (color: string) => void;
  onDeleteService: () => void;
  onUpdateTask: (task: TaskPhase) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: () => void;
}

export default function TaskCardItem({
  service,
  isCollapsed,
  isHighlighted,
  isHidden,
  isEditing,
  // today, // ✨ 오늘 날짜 기준 분리가 아니므로 사용 안 함
  isPickerOpen,
  pickerRef,

  onToggleCollapse,
  onToggleHide,
  onOpenPicker,
  onClosePicker,
  onServiceNameChange,
  onServiceNameBlur,
  onColorChange,
  onDeleteService,
  onUpdateTask,
  onDeleteTask,
  onAddTask,
}: Props) {
  const [frozenTaskIds, setFrozenTaskIds] = useState<string[]>([]);

  // 수정 모드 진입 시 순서 고정 로직 (기존 유지)
  useEffect(() => {
    if (isEditing) {
      const currentIds = [...service.tasks]
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
        .map((t) => t.id);
      setFrozenTaskIds(currentIds);
    } else {
      setFrozenTaskIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const getSortedTasks = (tasks: TaskPhase[]) => {
    if (isEditing && frozenTaskIds.length > 0) {
      return [...tasks].sort((a, b) => {
        const indexA = frozenTaskIds.indexOf(a.id);
        const indexB = frozenTaskIds.indexOf(b.id);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
    return [...tasks].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime(),
    );
  };

  // ✨ [수정] 날짜(isBefore)가 아닌, 완료 여부(!isCompleted)로 활성 태스크 필터링
  const activeTasks = getSortedTasks(
    service.tasks.filter((t) => !t.isCompleted),
  );

  // ✨ [수정] 완료 여부(isCompleted)로 완료 태스크 필터링
  const completedTasks = getSortedTasks(
    service.tasks.filter((t) => t.isCompleted),
  );

  return (
    <StCard
      id={`service-card-${service.id}`}
      $isCollapsed={isCollapsed}
      $isHighlighted={isHighlighted}
      $isHidden={isHidden}
    >
      <StCardHeader $color={isHidden ? "#d1d5db" : service.color}>
        <div className="header-left">
          <button
            className={`accordion-btn ${isCollapsed ? "collapsed" : ""}`}
            onClick={onToggleCollapse}
          >
            ▼
          </button>

          {isEditing ? (
            <input
              type="text"
              value={service.serviceName}
              onChange={(e) => onServiceNameChange(e.target.value)}
              onBlur={(e) => onServiceNameBlur(e.target.value)}
              className="service-title-input"
              placeholder="프로젝트명"
            />
          ) : (
            <h3 className="service-title-text" onClick={onToggleCollapse}>
              {service.serviceName}
            </h3>
          )}
        </div>

        <div className="header-right">
          <button
            className={`visibility-btn ${isHidden ? "hidden" : ""}`}
            onClick={onToggleHide}
            title={isHidden ? "일정 켜기" : "일정 끄기"}
          >
            <EyeIcon isHidden={isHidden} />
          </button>

          {isEditing ? (
            <>
              <div style={{ position: "relative" }}>
                <StColorTrigger $color={service.color} onClick={onOpenPicker} />
                {isPickerOpen && (
                  <ColorPicker
                    ref={pickerRef}
                    selectedColor={service.color}
                    onSelect={(color) => {
                      onColorChange(color);
                      onClosePicker();
                    }}
                  />
                )}
              </div>

              <button className="delete-service-btn" onClick={onDeleteService}>
                🗑️
              </button>
            </>
          ) : (
            <div
              className="color-indicator"
              style={{ backgroundColor: service.color }}
            />
          )}
        </div>
      </StCardHeader>

      {!isCollapsed && !isHidden && (
        <StCardBody>
          {/* 진행 중인 일정 */}
          {activeTasks.map((task) => (
            <TaskCardItemRow
              key={task.id}
              task={task}
              serviceId={service.id}
              onUpdate={(_, updatedTask) => onUpdateTask(updatedTask)}
              onDelete={(_, taskId) => onDeleteTask(taskId)}
              isReadOnly={!isEditing}
            />
          ))}

          {/* ✨ 완료된 일정 (기존 PastSection 재활용) */}
          {completedTasks.length > 0 && (
            <StPastSection>
              <summary>완료된 일정 보기 ({completedTasks.length})</summary>
              <div className="past-list">
                {completedTasks.map((task) => (
                  <TaskCardItemRow
                    key={task.id}
                    task={task}
                    serviceId={service.id}
                    onUpdate={(_, updatedTask) => onUpdateTask(updatedTask)}
                    onDelete={(_, taskId) => onDeleteTask(taskId)}
                    isReadOnly={true} // 완료된 항목은 읽기 전용처럼 보이거나, 수정 가능해도 됨
                  />
                ))}
              </div>
            </StPastSection>
          )}

          {isEditing && (
            <StFooter>
              <StAddButton onClick={onAddTask}>+ 업무 추가</StAddButton>
            </StFooter>
          )}
        </StCardBody>
      )}

      {!isCollapsed && isHidden && (
        <StHiddenMessage>🙈 캘린더에서 숨겨진 일정입니다.</StHiddenMessage>
      )}
    </StCard>
  );
}
