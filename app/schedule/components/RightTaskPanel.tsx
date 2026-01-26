/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from "react";
import styled, { css } from "styled-components";
import { format, isBefore, startOfDay, parse, isValid } from "date-fns";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";
import * as API from "../../../services/schedule"; // 👈 API 함수 불러오기

interface Props {
  schedules: ServiceSchedule[];
  onSave?: (service: ServiceSchedule) => void; // 이제 자동 저장이므로 선택 사항
  onUpdateAll?: (services: ServiceSchedule[]) => void;
}

export default function RightTaskPanel({
  schedules,
  onSave,
  onUpdateAll,
}: Props) {
  const [localSchedules, setLocalSchedules] =
    useState<ServiceSchedule[]>(schedules);
  const today = startOfDay(new Date());

  useEffect(() => {
    setLocalSchedules(schedules);
  }, [schedules]);

  // =========================================================
  // 1. 서비스(큰 카드) 관련 핸들러
  // =========================================================

  // [색상] 변경 즉시 DB 저장
  const handleColorChange = async (svcId: string, color: string) => {
    // 1. 로컬 상태 선반영 (UI 반응성)
    const updated = localSchedules.map((s) =>
      s.id === svcId ? { ...s, color } : s,
    );
    setLocalSchedules(updated);
    if (onUpdateAll) onUpdateAll(updated);

    // 2. DB 업데이트
    try {
      await API.updateService(svcId, { color });
    } catch (e) {
      console.error("색상 변경 실패", e);
    }
  };

  // [이름] 입력 중에는 로컬만 변경 (onBlur에서 DB 저장)
  const handleServiceNameChange = (svcId: string, newName: string) => {
    const updated = localSchedules.map((s) =>
      s.id === svcId ? { ...s, serviceName: newName } : s,
    );
    setLocalSchedules(updated);
  };

  // [이름] 포커스 나갈 때 DB 저장
  const handleServiceNameBlur = async (svcId: string, name: string) => {
    try {
      await API.updateService(svcId, { name });
    } catch (e) {
      console.error("서비스명 수정 실패", e);
    }
  };

  // [추가] 새 서비스 생성
  const handleAddService = async () => {
    try {
      // DB 생성 요청
      const newService = await API.createService("새 프로젝트", "", "#10b981");

      const updated = [...localSchedules, newService];
      setLocalSchedules(updated);
      if (onUpdateAll) onUpdateAll(updated);
    } catch (e) {
      console.error("서비스 생성 실패", e);
      alert("프로젝트 생성 중 오류가 발생했습니다.");
    }
  };

  // [삭제] 서비스 삭제
  const handleDeleteService = async (svcId: string) => {
    if (
      !confirm(
        "프로젝트 전체를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.",
      )
    )
      return;

    try {
      await API.deleteService(svcId);

      const updated = localSchedules.filter((s) => s.id !== svcId);
      setLocalSchedules(updated);
      if (onUpdateAll) onUpdateAll(updated);
    } catch (e) {
      console.error("서비스 삭제 실패", e);
    }
  };

  // =========================================================
  // 2. 업무(Task) 관련 핸들러
  // =========================================================

  // [추가] 업무 생성
  const handleAddTask = async (svcId: string) => {
    try {
      // DB 생성 요청
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
      console.error("업무 추가 실패", e);
    }
  };

  // [수정] 업무 업데이트 (TaskRow에서 호출)
  const updateTask = async (svcId: string, updatedTask: TaskPhase) => {
    // 1. 로컬 선반영
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

    // 2. DB 업데이트
    try {
      await API.updateTask(updatedTask.id, {
        title: updatedTask.title,
        startDate: updatedTask.startDate,
        endDate: updatedTask.endDate,
      });
    } catch (e) {
      console.error("업무 수정 실패", e);
    }
  };

  // [삭제] 업무 삭제
  const deleteTask = async (svcId: string, taskId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await API.deleteTask(taskId);

      const updated = localSchedules.map((svc) => {
        if (svc.id !== svcId) return svc;
        return { ...svc, tasks: svc.tasks.filter((t) => t.id !== taskId) };
      });
      setLocalSchedules(updated);
      if (onUpdateAll) onUpdateAll(updated);
    } catch (e) {
      console.error("업무 삭제 실패", e);
    }
  };

  return (
    <StContainer>
      {localSchedules.map((service) => {
        const activeTasks = service.tasks.filter(
          (t) => !isBefore(t.endDate, today),
        );
        const pastTasks = service.tasks.filter((t) =>
          isBefore(t.endDate, today),
        );

        return (
          <StCard key={service.id}>
            <StCardHeader $color={service.color}>
              <div className="header-left">
                <input
                  type="text"
                  value={service.serviceName}
                  onChange={(e) =>
                    handleServiceNameChange(service.id, e.target.value)
                  }
                  // ✨ 포커스가 나갈 때 저장 (API 호출)
                  onBlur={(e) =>
                    handleServiceNameBlur(service.id, e.target.value)
                  }
                  className="service-title-input"
                  placeholder="프로젝트명"
                />
              </div>
              <div className="header-right">
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
              </div>
            </StCardHeader>

            <StCardBody>
              {/* 진행 중인 업무 */}
              {activeTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  serviceId={service.id}
                  onUpdate={updateTask}
                  onDelete={deleteTask}
                />
              ))}

              {/* 지난 업무 */}
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
                        isReadOnly
                      />
                    ))}
                  </div>
                </StPastSection>
              )}

              <StFooter>
                <StAddButton onClick={() => handleAddTask(service.id)}>
                  + 업무 추가
                </StAddButton>
                {/* 자동 저장이 되므로 저장 버튼은 '완료' 의미로 두거나 숨겨도 됩니다. */}
                <StSaveButton onClick={() => onSave && onSave(service)}>
                  저장됨
                </StSaveButton>
              </StFooter>
            </StCardBody>
          </StCard>
        );
      })}

      <StAddServiceBlock onClick={handleAddService}>
        <span className="plus-icon">+</span>
        <span>새 프로젝트 카드 추가하기</span>
      </StAddServiceBlock>
    </StContainer>
  );
}

// =========================================================
// TaskRow 컴포넌트
// =========================================================
function TaskRow({
  task,
  serviceId,
  onUpdate,
  onDelete,
  isReadOnly = false,
}: {
  task: TaskPhase;
  serviceId: string;
  onUpdate: (svcId: string, t: TaskPhase) => void;
  onDelete: (svcId: string, tId: string) => void;
  isReadOnly?: boolean;
}) {
  // 텍스트 날짜 입력값 ("20260101-20260105")
  const [textValue, setTextValue] = useState("");
  // ✨ 타이틀 입력값 (API 과호출 방지용 로컬 state)
  const [titleValue, setTitleValue] = useState(task.title);

  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // 상위 task 변경 시 로컬 state 동기화
  useEffect(() => {
    const startStr = format(task.startDate, "yyyyMMdd");
    const endStr = format(task.endDate, "yyyyMMdd");
    setTextValue(`${startStr}-${endStr}`);
    setTitleValue(task.title);
  }, [task.startDate, task.endDate, task.title]);

  // 날짜 텍스트 변경
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextValue(val);

    const regex = /^(\d{8})-(\d{8})$/;
    const match = val.match(regex);

    if (match) {
      const start = parse(match[1], "yyyyMMdd", new Date());
      const end = parse(match[2], "yyyyMMdd", new Date());

      if (isValid(start) && isValid(end)) {
        onUpdate(serviceId, { ...task, startDate: start, endDate: end });
      }
    }
  };

  // 날짜 캘린더 변경
  const handleDateInput = (field: "startDate" | "endDate", val: string) => {
    if (!val) return;
    const newDate = new Date(val);
    onUpdate(serviceId, { ...task, [field]: newDate });
  };

  // ✨ 타이틀 변경 (포커스 나갈 때만 업데이트 호출)
  const handleTitleBlur = () => {
    if (titleValue !== task.title) {
      onUpdate(serviceId, { ...task, title: titleValue });
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <StTaskItem $isPast={isReadOnly}>
      {/* 1. 업무명 & 삭제 버튼 */}
      <div className="task-header">
        <input
          type="text"
          className="task-title-input"
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onBlur={handleTitleBlur} // ✨ 여기서 API 호출 트리거
          placeholder="업무명"
          disabled={isReadOnly}
        />
        {!isReadOnly && (
          <button
            className="delete-task-btn"
            onClick={() => onDelete(serviceId, task.id)}
          >
            ×
          </button>
        )}
      </div>

      {/* 2. 날짜 입력 영역 */}
      <StDateInputWrapper>
        <input
          type="text"
          className="date-text-input"
          value={textValue}
          onChange={handleTextChange}
          placeholder="YYYYMMDD-YYYYMMDD"
          maxLength={17}
          disabled={isReadOnly}
        />

        {!isReadOnly && (
          <div className="calendar-popover-container" ref={calendarRef}>
            <button
              className="calendar-toggle-btn"
              onClick={() => setShowCalendar(!showCalendar)}
              title="날짜 선택"
            >
              📅
            </button>

            {showCalendar && (
              <StCalendarPopover>
                <div className="popover-row">
                  <label>Start</label>
                  <input
                    type="date"
                    value={format(task.startDate, "yyyy-MM-dd")}
                    onChange={(e) =>
                      handleDateInput("startDate", e.target.value)
                    }
                  />
                </div>
                <div className="popover-row">
                  <label>End</label>
                  <input
                    type="date"
                    value={format(task.endDate, "yyyy-MM-dd")}
                    onChange={(e) => handleDateInput("endDate", e.target.value)}
                  />
                </div>
              </StCalendarPopover>
            )}
          </div>
        )}
      </StDateInputWrapper>
    </StTaskItem>
  );
}

// ... 스타일 정의는 기존과 동일 ...
const StContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 2rem;
`;
const StCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: visible;
  background-color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
`;
const StCardHeader = styled.div<{ $color: string }>`
  padding: 10px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
  border-left: 6px solid ${({ $color }) => $color};
  display: flex;
  justify-content: space-between;
  align-items: center;
  .header-left {
    flex: 1;
    margin-right: 10px;
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
  }
`;
const StCardBody = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
const StTaskItem = styled.div<{ $isPast?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #e5e7eb;
  ${({ $isPast }) =>
    $isPast &&
    css`
      opacity: 0.6;
      filter: grayscale(100%);
      pointer-events: none;
    `} &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .task-header {
    display: flex;
    align-items: center;
    gap: 8px;
    .task-title-input {
      flex: 1;
      font-size: 0.9rem;
      font-weight: 600;
      border: none;
      background: transparent;
      &:focus {
        border-bottom: 1px solid #3b82f6;
        outline: none;
      }
    }
    .delete-task-btn {
      color: #9ca3af;
      font-size: 1.2rem;
      cursor: pointer;
      background: none;
      border: none;
      &:hover {
        color: #ef4444;
      }
    }
  }
`;
const StDateInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  .date-text-input {
    flex: 1;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 6px 8px;
    font-size: 0.85rem;
    color: #374151;
    font-family: monospace;
    letter-spacing: 0.5px;
    &:focus {
      border-color: #3b82f6;
      outline: none;
    }
    &:disabled {
      background-color: #f3f4f6;
      color: #9ca3af;
    }
  }
  .calendar-popover-container {
    position: relative;
  }
  .calendar-toggle-btn {
    background: none;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
    &:hover {
      background-color: #f3f4f6;
      border-color: #9ca3af;
    }
  }
`;
const StCalendarPopover = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  z-index: 50;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  width: 220px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  .popover-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
    }
    input[type="date"] {
      border: 1px solid #d1d5db;
      border-radius: 4px;
      padding: 4px;
      font-size: 0.8rem;
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
const StSaveButton = styled.button`
  background-color: #1f2937;
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  &:hover {
    background-color: #000;
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
