/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";
import {
  StCard,
  StCardBody,
  StPastSection,
  StFooter,
  StAddButton,
  StHiddenMessage,
} from "./TaskList.styles";
import TaskCardItemRow from "./TaskCardItemRow";
import TaskCardHeader from "./TaskCardHeader"; // ✨ 추가

interface Props {
  service: ServiceSchedule;
  isCollapsed: boolean;
  isHighlighted: boolean;
  isHidden: boolean;
  isEditing: boolean;
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
  onUpdateService: (id: string, updates: any) => void;
}

export default function TaskCardItem(props: Props) {
  const {
    service,
    isCollapsed,
    isHighlighted,
    isHidden,
    isEditing,
    onUpdateTask,
    onDeleteTask,
    onAddTask,
    onUpdateService,
  } = props;

  const [frozenTaskIds, setFrozenTaskIds] = useState<string[]>([]);

  useEffect(() => {
    if (isEditing) {
      const currentIds = [...service.tasks]
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
        .map((t) => t.id);
      setFrozenTaskIds(currentIds);
    } else {
      setFrozenTaskIds([]);
    }
  }, [isEditing]);

  const handleToggleComplete = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;

    onUpdateService(service.id, {
      is_completed: isChecked,
      is_hidden: isChecked,
    });
  };

  const getSortedTasks = (tasks: TaskPhase[]) => {
    if (isEditing && frozenTaskIds.length > 0) {
      return [...tasks].sort((a, b) => {
        const indexA = frozenTaskIds.indexOf(a.id);
        const indexB = frozenTaskIds.indexOf(b.id);
        return (indexA === -1 ? 1 : indexA) - (indexB === -1 ? 1 : indexB);
      });
    }
    return [...tasks].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime(),
    );
  };

  const activeTasks = getSortedTasks(
    service.tasks.filter((t) => !t.isCompleted),
  );
  const completedTasks = getSortedTasks(
    service.tasks.filter((t) => t.isCompleted),
  );

  return (
    <StCard
      id={`service-card-${service.id}`}
      $isCollapsed={isCollapsed}
      $isHighlighted={isHighlighted}
      $isHidden={isHidden}
      $isCompleted={service.isCompleted}
    >
      <TaskCardHeader {...props} onToggleComplete={handleToggleComplete} />

      {!isCollapsed && (
        <StCardBody>
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

      {/* {!isCollapsed && isHidden && (
        <StHiddenMessage>🙈 캘린더에서 숨겨진 일정입니다.</StHiddenMessage>
      )} */}
    </StCard>
  );
}
