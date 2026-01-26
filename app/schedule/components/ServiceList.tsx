/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from "react";
import styled, { css } from "styled-components";
import { isBefore } from "date-fns";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";
import TaskRow from "./TaskRow";

// ✨ [NEW] 추천 컬러 팔레트 정의
const PRESET_COLORS = [
  "#FF6B6B", // Red
  "#FFA94D", // Orange
  "#FFD43B", // Yellow
  "#20C997", // Teal
  "#339AF0", // Blue
  "#5C7CFA", // Indigo
  "#845EF7", // Violet
  "#868E96", // Gray
];

interface ServiceListProps {
  schedules: ServiceSchedule[];
  scrollAreaRef: any; // Ref 타입 호환성 문제 방지
  collapsedIds: Set<string>;
  highlightId: string | null;
  isEditing: boolean;
  today: Date;

  // 핸들러들
  onToggleCollapse: (id: string) => void;
  onServiceNameChange: (id: string, name: string) => void;
  onServiceNameBlur: (id: string, name: string) => void | Promise<void>;
  onColorChange: (id: string, color: string) => void | Promise<void>;
  onDeleteService: (id: string) => void | Promise<void>;
  onUpdateTask: (svcId: string, task: TaskPhase) => void | Promise<void>;
  onDeleteTask: (svcId: string, taskId: string) => void | Promise<void>;
  onAddTask: (svcId: string) => void | Promise<void>;
  onAddService: () => void | Promise<void>;
}

export default function ServiceList({
  schedules,
  scrollAreaRef,
  collapsedIds,
  highlightId,
  isEditing,
  today,
  onToggleCollapse,
  onServiceNameChange,
  onServiceNameBlur,
  onColorChange,
  onDeleteService,
  onUpdateTask,
  onDeleteTask,
  onAddTask,
  onAddService,
}: ServiceListProps) {
  // ✨ [NEW] 컬러 피커가 열린 서비스 ID 관리
  const [activeColorPickerId, setActiveColorPickerId] = useState<string | null>(
    null,
  );
  const pickerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 컬러 피커 닫기
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

  return (
    <StScrollArea ref={scrollAreaRef}>
      {schedules.map((service) => {
        // 날짜 순 정렬
        const activeTasks = service.tasks
          .filter((t) => !isBefore(t.endDate, today))
          .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        const pastTasks = service.tasks
          .filter((t) => isBefore(t.endDate, today))
          .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        const isCollapsed = collapsedIds.has(service.id);
        const isPickerOpen = activeColorPickerId === service.id;

        return (
          <StCard
            key={service.id}
            id={`service-card-${service.id}`}
            $isCollapsed={isCollapsed}
            $isHighlighted={highlightId === service.id}
          >
            <StCardHeader $color={service.color}>
              <div className="header-left">
                <button
                  className={`accordion-btn ${isCollapsed ? "collapsed" : ""}`}
                  onClick={() => onToggleCollapse(service.id)}
                >
                  ▼
                </button>

                {isEditing ? (
                  <input
                    type="text"
                    value={service.serviceName}
                    onChange={(e) =>
                      onServiceNameChange(service.id, e.target.value)
                    }
                    onBlur={(e) =>
                      onServiceNameBlur(service.id, e.target.value)
                    }
                    className="service-title-input"
                    placeholder="프로젝트명"
                  />
                ) : (
                  <h3
                    className="service-title-text"
                    onClick={() => onToggleCollapse(service.id)}
                  >
                    {service.serviceName}
                  </h3>
                )}
              </div>

              <div className="header-right">
                {isEditing ? (
                  <>
                    {/* ✨ [NEW] 커스텀 컬러 피커 */}
                    <div style={{ position: "relative" }}>
                      <StColorTrigger
                        $color={service.color}
                        onClick={() =>
                          setActiveColorPickerId(
                            isPickerOpen ? null : service.id,
                          )
                        }
                      />
                      {isPickerOpen && (
                        <StColorPopover ref={pickerRef}>
                          <div className="preset-grid">
                            {PRESET_COLORS.map((color) => (
                              <StColorChip
                                key={color}
                                $color={color}
                                $isSelected={service.color === color}
                                onClick={() => {
                                  onColorChange(service.id, color);
                                  setActiveColorPickerId(null); // 선택 후 닫기
                                }}
                              />
                            ))}
                          </div>
                          <div className="custom-picker-row">
                            <span>직접 선택:</span>
                            <input
                              type="color"
                              value={service.color}
                              onChange={(e) =>
                                onColorChange(service.id, e.target.value)
                              }
                            />
                          </div>
                        </StColorPopover>
                      )}
                    </div>

                    <button
                      className="delete-service-btn"
                      onClick={() => onDeleteService(service.id)}
                    >
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

            {!isCollapsed && (
              <StCardBody>
                {activeTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    serviceId={service.id}
                    onUpdate={onUpdateTask}
                    onDelete={onDeleteTask}
                    isReadOnly={!isEditing}
                  />
                ))}

                {pastTasks.length > 0 && (
                  <StPastSection>
                    <summary>지난 일정 보기 ({pastTasks.length})</summary>
                    <div className="past-list">
                      {pastTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          serviceId={service.id}
                          onUpdate={onUpdateTask}
                          onDelete={onDeleteTask}
                          isReadOnly={true}
                        />
                      ))}
                    </div>
                  </StPastSection>
                )}
                {isEditing && (
                  <StFooter>
                    <StAddButton onClick={() => onAddTask(service.id)}>
                      + 업무 추가
                    </StAddButton>
                  </StFooter>
                )}
              </StCardBody>
            )}
          </StCard>
        );
      })}

      {isEditing && (
        <StAddServiceBlock onClick={onAddService}>
          <span className="plus-icon">+</span>
          <span>새 프로젝트 카드 추가하기</span>
        </StAddServiceBlock>
      )}
    </StScrollArea>
  );
}

// --- 스타일 정의 ---

const highlightAnimation = css`
  animation: flash 1.5s ease-out;
  @keyframes flash {
    0% {
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
      border-color: #3b82f6;
      background-color: #eff6ff;
    }
    100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
      background-color: white;
    }
  }
`;

const StScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 1rem 2rem;
  padding-right: 8px;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #e5e7eb;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
`;

const StCard = styled.div<{ $isCollapsed?: boolean; $isHighlighted?: boolean }>`
  flex-shrink: 0;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  scroll-margin-top: 20px;
  ${({ $isCollapsed }) =>
    $isCollapsed &&
    css`
      background-color: #fcfcfc;
    `}
  ${({ $isHighlighted }) => $isHighlighted && highlightAnimation}
`;

const StCardHeader = styled.div<{ $color: string }>`
  padding: 10px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
  border-left: 6px solid ${({ $color }) => $color};
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 52px;

  .header-left {
    flex: 1;
    margin-right: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    .accordion-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.8rem;
      color: #6b7280;
      transition: transform 0.2s;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      &:hover {
        background-color: #e5e7eb;
        color: #374151;
      }
      &.collapsed {
        transform: rotate(-90deg);
      }
    }
    .service-title-input {
      width: 100%;
      font-weight: 700;
      background: transparent;
      border: none;
      font-size: 1rem;
      &:focus {
        outline: none;
        background: white;
      }
    }
    .service-title-text {
      font-size: 1rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
      cursor: pointer;
      &:hover {
        opacity: 0.8;
      }
    }
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    .delete-service-btn {
      border: none;
      background: none;
      cursor: pointer;
      opacity: 0.5;
      font-size: 1.1rem;
      &:hover {
        opacity: 1;
        transform: scale(1.1);
      }
    }
    .color-indicator {
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }
  }
`;

// ✨ [NEW] 컬러 선택 버튼 (트리거)
const StColorTrigger = styled.div<{ $color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 0 0 1px #d1d5db;
  transition: transform 0.2s;
  &:hover {
    transform: scale(1.1);
  }
`;

// ✨ [NEW] 컬러 팝업 (Popover)
const StColorPopover = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 50;
  width: 180px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .preset-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .custom-picker-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #6b7280;
    padding-top: 8px;
    border-top: 1px dashed #e5e7eb;

    input[type="color"] {
      border: none;
      width: 24px;
      height: 24px;
      padding: 0;
      background: none;
      cursor: pointer;
    }
  }
`;

// ✨ [NEW] 컬러 칩 (동그라미)
const StColorChip = styled.div<{ $color: string; $isSelected: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  cursor: pointer;
  position: relative;
  transition: transform 0.1s;

  &:hover {
    transform: scale(1.15);
  }

  /* 선택된 색상은 테두리로 표시 */
  ${({ $isSelected }) =>
    $isSelected &&
    css`
      box-shadow:
        0 0 0 2px white,
        0 0 0 4px #3b82f6;
      z-index: 1;
    `}
`;

const StCardBody = styled.div`
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: slideDown 0.2s ease-out;
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
const StPastSection = styled.details`
  margin-top: 8px;
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
  summary {
    font-size: 0.85rem;
    font-weight: 600;
    color: #6b7280;
    cursor: pointer;
    user-select: none;
    margin-bottom: 12px;
    list-style: none;
    display: flex;
    align-items: center;
    gap: 6px;
    &::before {
      content: "▶";
      font-size: 0.6rem;
      transition: transform 0.2s;
    }
  }
  &[open] summary::before {
    transform: rotate(90deg);
  }
  .past-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    background-color: #f9fafb;
    padding: 12px;
    border-radius: 8px;
  }
`;
const StFooter = styled.div`
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const StAddButton = styled.button`
  background-color: white;
  color: #6b7280;
  border: 1px dashed #d1d5db;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background-color: #f9fafb;
    color: #111827;
  }
`;
const StAddServiceBlock = styled.button`
  width: 100%;
  padding: 1.5rem;
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
  .plus-icon {
    font-size: 1.5rem;
  }
  &:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
    color: #3b82f6;
  }
`;
