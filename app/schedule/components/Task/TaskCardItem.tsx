/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { isBefore } from "date-fns";
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
} from "./TaskList.styles"; // 경로가 맞는지 확인해주세요 (보통 ../TaskList.styles.ts)
import TaskCardItemRow from "./TaskCardItemRow";

interface Props {
  service: ServiceSchedule;
  isCollapsed: boolean;
  isHighlighted: boolean;
  isHidden: boolean;
  isEditing: boolean;
  today: Date;
  isPickerOpen: boolean;

  // ✨ [수정] 부모(TaskList)에서 useRef(null)로 시작하므로 null 허용 필요
  pickerRef: React.RefObject<HTMLDivElement | null>;

  // Handlers
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

// ✨ 컴포넌트 이름: TaskCardItem
export default function TaskCardItem({
  service,
  isCollapsed,
  isHighlighted,
  isHidden,
  isEditing,
  today,
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
  const activeTasks = service.tasks
    .filter((t) => !isBefore(t.endDate, today))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const pastTasks = service.tasks
    .filter((t) => isBefore(t.endDate, today))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

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
          {activeTasks.map((task) => (
            <TaskCardItemRow
              key={task.id}
              task={task}
              serviceId={service.id}
              // ✨ TaskCardItemRow는 (id, task)를 반환하므로 첫 번째 인자 무시(_)
              onUpdate={(_, updatedTask) => onUpdateTask(updatedTask)}
              onDelete={(_, taskId) => onDeleteTask(taskId)}
              isReadOnly={!isEditing}
            />
          ))}

          {pastTasks.length > 0 && (
            <StPastSection>
              <summary>지난 일정 보기 ({pastTasks.length})</summary>
              <div className="past-list">
                {pastTasks.map((task) => (
                  <TaskCardItemRow
                    key={task.id}
                    task={task}
                    serviceId={service.id}
                    onUpdate={(_, updatedTask) => onUpdateTask(updatedTask)}
                    onDelete={(_, taskId) => onDeleteTask(taskId)}
                    isReadOnly={true}
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
