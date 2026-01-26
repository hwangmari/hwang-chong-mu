/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import styled, { css } from "styled-components";
import { isBefore, startOfDay, format } from "date-fns";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";
import * as API from "@/services/schedule";
import TaskRow from "./TaskRow";

interface Props {
  boardId: string;
  schedules: ServiceSchedule[];
  onSave?: (service: ServiceSchedule) => void;
  onUpdateAll?: (services: ServiceSchedule[]) => void;
}

export default function RightTaskPanel({
  boardId,
  schedules,
  onSave,
  onUpdateAll,
}: Props) {
  const [localSchedules, setLocalSchedules] =
    useState<ServiceSchedule[]>(schedules);
  const [isEditing, setIsEditing] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 접힌 카드 ID 저장
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // 하이라이트된 카드 ID
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const today = startOfDay(new Date());
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setLocalSchedules(schedules);
  }, [schedules]);

  // 캘린더 클릭 이벤트 수신
  useEffect(() => {
    const handleScrollRequest = (e: CustomEvent<string>) => {
      const svcId = e.detail;
      setHighlightId(svcId);

      const targetElement = document.getElementById(`service-card-${svcId}`);
      const containerElement = scrollAreaRef.current;

      if (targetElement && containerElement) {
        // 1. 현재 컨테이너의 스크롤 위치와 요소들의 위치 계산
        const containerRect = containerElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        // 2. 현재 스크롤 위치(scrollTop) + (타겟의 화면상 위치 - 컨테이너의 화면상 위치)
        //    -> 이러면 타겟이 컨테이너의 맨 꼭대기에 오게 됨
        // 3. 중앙 정렬을 위해: - (컨테이너 높이 / 2) + (타겟 높이 / 2)
        const scrollTo =
          containerElement.scrollTop +
          (targetRect.top - containerRect.top) -
          containerElement.clientHeight / 2 +
          targetRect.height / 2;

        // 4. 계산된 위치로 부드럽게 이동 (컨테이너만 움직임!)
        containerElement.scrollTo({
          top: scrollTo,
          behavior: "smooth",
        });

        // 접혀있으면 펼치기
        setCollapsedIds((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(svcId)) {
            newSet.delete(svcId);
            return newSet;
          }
          return prev;
        });

        // 애니메이션 후 하이라이트 해제
        setTimeout(() => setHighlightId(null), 1500);
      }
    };

    window.addEventListener("scroll-to-service" as any, handleScrollRequest);
    return () =>
      window.removeEventListener(
        "scroll-to-service" as any,
        handleScrollRequest,
      );
  }, []);

  // 아코디언 토글 핸들러
  const toggleCollapse = (svcId: string) => {
    const newSet = new Set(collapsedIds);
    if (newSet.has(svcId)) {
      newSet.delete(svcId);
    } else {
      newSet.add(svcId);
    }
    setCollapsedIds(newSet);
  };

  // --- 핸들러 ---
  const handleCopyText = () => {
    let text = "";
    localSchedules.forEach((svc) => {
      text += `[${svc.serviceName}]\n`;
      svc.tasks.forEach((t) => {
        const sYear = t.startDate.getFullYear();
        const eYear = t.endDate.getFullYear();
        const startStr =
          sYear === currentYear
            ? format(t.startDate, "MM.dd")
            : format(t.startDate, "yyyy.MM.dd");
        let dateStr = "";
        if (format(t.startDate, "yyyyMMdd") === format(t.endDate, "yyyyMMdd")) {
          dateStr = startStr;
        } else {
          let endStr = "";
          if (sYear === eYear) {
            endStr = format(t.endDate, "MM.dd");
          } else {
            endStr =
              eYear === currentYear
                ? format(t.endDate, "MM.dd")
                : format(t.endDate, "yyyy.MM.dd");
          }
          dateStr = `${startStr} ~ ${endStr}`;
        }
        // ✨ 메모가 있으면 같이 출력
        text += `- ${t.title}: ${dateStr}`;
        if (t.memo && t.memo.trim() !== "") {
          text += ` (💬 ${t.memo})`;
        }
        text += "\n";
      });
      text += "\n";
    });
    navigator.clipboard
      .writeText(text)
      .then(() => alert("일정이 복사되었습니다! (메모 포함)"));
  };

  const handleColorChange = async (svcId: string, color: string) => {
    const updated = localSchedules.map((s) =>
      s.id === svcId ? { ...s, color } : s,
    );
    setLocalSchedules(updated);
    if (onUpdateAll) onUpdateAll(updated);
    try {
      await API.updateService(svcId, { color });
    } catch (e) {
      console.error(e);
    }
  };
  const handleServiceNameChange = (svcId: string, newName: string) => {
    const updated = localSchedules.map((s) =>
      s.id === svcId ? { ...s, serviceName: newName } : s,
    );
    setLocalSchedules(updated);
  };
  const handleServiceNameBlur = async (svcId: string, name: string) => {
    try {
      await API.updateService(svcId, { name });
    } catch (e) {
      console.error(e);
    }
  };
  const handleAddService = async () => {
    try {
      const newService = await API.createService(
        boardId,
        "새 프로젝트",
        "",
        "#10b981",
      );
      const updated = [...localSchedules, newService];
      setLocalSchedules(updated);
      if (onUpdateAll) onUpdateAll(updated);
      setIsEditing(true);
    } catch (e) {
      console.error(e);
      alert("실패");
    }
  };
  const handleDeleteService = async (svcId: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      await API.deleteService(svcId);
      const updated = localSchedules.filter((s) => s.id !== svcId);
      setLocalSchedules(updated);
      if (onUpdateAll) onUpdateAll(updated);
    } catch (e) {
      console.error(e);
    }
  };
  const handleAddTask = async (svcId: string) => {
    try {
      const newTask = await API.createTask(svcId, {
        title: "새 업무",
        startDate: new Date(),
        endDate: new Date(),
      });
      const updated = localSchedules.map((svc) => {
        if (svc.id !== svcId) return svc;
        return { ...svc, tasks: [...svc.tasks, newTask] };
      });
      setLocalSchedules(updated);
      if (onUpdateAll) onUpdateAll(updated);
    } catch (e) {
      console.error(e);
    }
  };
  const updateTask = async (svcId: string, updatedTask: TaskPhase) => {
    const updatedSchedules = localSchedules.map((svc) => {
      if (svc.id !== svcId) return svc;
      return {
        ...svc,
        tasks: svc.tasks.map((t) =>
          t.id === updatedTask.id ? updatedTask : t,
        ),
      };
    });
    setLocalSchedules(updatedSchedules);
    if (onUpdateAll) onUpdateAll(updatedSchedules);
    try {
      await API.updateTask(updatedTask.id, {
        title: updatedTask.title,
        startDate: updatedTask.startDate,
        endDate: updatedTask.endDate,
        memo: updatedTask.memo,
      });
    } catch (e) {
      console.error(e);
    }
  };
  const deleteTask = async (svcId: string, taskId: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      await API.deleteTask(taskId);
      const updated = localSchedules.map((svc) => {
        if (svc.id !== svcId) return svc;
        return { ...svc, tasks: svc.tasks.filter((t) => t.id !== taskId) };
      });
      setLocalSchedules(updated);
      if (onUpdateAll) onUpdateAll(updated);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <StContainer>
      {/* 1. 상단 고정 영역 */}
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

      {/* 2. 하단 스크롤 영역 (새로운 컴포넌트) */}
      <StScrollArea ref={scrollAreaRef}>
        {localSchedules.map((service) => {
          const activeTasks = service.tasks.filter(
            (t) => !isBefore(t.endDate, today),
          );
          const pastTasks = service.tasks.filter((t) =>
            isBefore(t.endDate, today),
          );
          const isCollapsed = collapsedIds.has(service.id);

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
                    onClick={() => toggleCollapse(service.id)}
                  >
                    ▼
                  </button>

                  {isEditing ? (
                    <input
                      type="text"
                      value={service.serviceName}
                      onChange={(e) =>
                        handleServiceNameChange(service.id, e.target.value)
                      }
                      onBlur={(e) =>
                        handleServiceNameBlur(service.id, e.target.value)
                      }
                      className="service-title-input"
                      placeholder="프로젝트명"
                    />
                  ) : (
                    <h3
                      className="service-title-text"
                      onClick={() => toggleCollapse(service.id)}
                    >
                      {service.serviceName}
                    </h3>
                  )}
                </div>
                <div className="header-right">
                  {isEditing ? (
                    <>
                      <input
                        type="color"
                        value={service.color}
                        onChange={(e) =>
                          handleColorChange(service.id, e.target.value)
                        }
                      />
                      <button
                        className="delete-service-btn"
                        onClick={() => handleDeleteService(service.id)}
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
                      onUpdate={updateTask}
                      onDelete={deleteTask}
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
                            onUpdate={updateTask}
                            onDelete={deleteTask}
                            isReadOnly={true}
                          />
                        ))}
                      </div>
                    </StPastSection>
                  )}
                  {isEditing && (
                    <StFooter>
                      <StAddButton onClick={() => handleAddTask(service.id)}>
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
          <StAddServiceBlock onClick={handleAddService}>
            <span className="plus-icon">+</span>
            <span>새 프로젝트 카드 추가하기</span>
          </StAddServiceBlock>
        )}
      </StScrollArea>
    </StContainer>
  );
}

// --- 스타일 정의 ---

// 하이라이트 애니메이션
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
// 1. 전체 컨테이너: Flex 컬럼 레이아웃 + 높이 고정
const StContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  overflow: hidden;
  position: relative;
`;

// 2. 상단 컨트롤 바: 고정 영역 (sticky 제거)
const StControlBar = styled.div`
  padding: 0 1rem;
  border-bottom: 1px solid #ebebec;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  z-index: 10;
  height: 60px;

  /* 버튼 스타일 유지 */
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

// 3. 하단 스크롤 영역: 남은 공간 모두 차지 (flex: 1)
const StScrollArea = styled.div`
  flex: 1; /* 남은 세로 공간을 꽉 채움 */
  overflow-y: auto; /* 내용이 넘치면 여기서 스크롤 발생 */

  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 1rem 2rem; /* 내부 여백 */

  /* 스크롤바 디자인 */
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
  overflow: hidden;
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
    input[type="color"] {
      border: none;
      width: 24px;
      height: 24px;
      cursor: pointer;
      background: none;
    }
    .delete-service-btn {
      border: none;
      background: none;
      cursor: pointer;
      opacity: 0.5;
      &:hover {
        opacity: 1;
      }
    }
    .color-indicator {
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }
  }
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
