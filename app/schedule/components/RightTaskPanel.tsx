/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from "react";
import styled, { css } from "styled-components";
import {
  format,
  isBefore,
  startOfDay,
  parse,
  isValid,
  isSameYear,
} from "date-fns";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";
import * as API from "@/services/schedule";

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
  const today = startOfDay(new Date());

  // ✨ 현재 연도 가져오기 (예: 2026)
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setLocalSchedules(schedules);
  }, [schedules]);

  // ✨ [수정] 텍스트 복사 로직 (스마트 연도 생략)
  const handleCopyText = () => {
    let text = "";
    localSchedules.forEach((svc) => {
      text += `[${svc.serviceName}]\n`;
      svc.tasks.forEach((t) => {
        const sYear = t.startDate.getFullYear();
        const eYear = t.endDate.getFullYear();

        // 1. 시작일 포맷팅 (현재 연도면 연도 생략)
        const startStr =
          sYear === currentYear
            ? format(t.startDate, "MM.dd")
            : format(t.startDate, "yyyy.MM.dd");

        let dateStr = "";

        // 2. 같은 날짜인 경우
        if (format(t.startDate, "yyyyMMdd") === format(t.endDate, "yyyyMMdd")) {
          dateStr = startStr;
        } else {
          // 3. 기간인 경우 종료일 포맷팅
          let endStr = "";
          if (sYear === eYear) {
            // 시작일과 같은 연도면 무조건 연도 생략 (중복 방지)
            endStr = format(t.endDate, "MM.dd");
          } else {
            // 다른 연도면, 현재 연도인지 체크
            endStr =
              eYear === currentYear
                ? format(t.endDate, "MM.dd")
                : format(t.endDate, "yyyy.MM.dd");
          }
          dateStr = `${startStr} ~ ${endStr}`;
        }

        text += `- ${t.title}: ${dateStr}\n`;
      });
      text += "\n";
    });

    navigator.clipboard.writeText(text).then(() => {
      alert("일정이 복사되었습니다! (현재 연도는 생략됨)");
    });
  };

  // ... (기존 핸들러들: handleColorChange ~ deleteTask 등 코드는 동일하므로 유지) ...
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
                  <h3 className="service-title-text">{service.serviceName}</h3>
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
          </StCard>
        );
      })}

      {isEditing && (
        <StAddServiceBlock onClick={handleAddService}>
          <span className="plus-icon">+</span>
          <span>새 프로젝트 카드 추가하기</span>
        </StAddServiceBlock>
      )}
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
  const [textValue, setTextValue] = useState("");
  const [titleValue, setTitleValue] = useState(task.title);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // ✨ 현재 연도
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    // 편집 모드일 땐 항상 YYYY.MM.DD 형태로 풀로 보여줌 (편집 정확성 위해)
    const startFmt = format(task.startDate, "yyyy.MM.dd");
    const endFmt = format(task.endDate, "yyyy.MM.dd");

    if (startFmt === endFmt) {
      setTextValue(startFmt);
    } else {
      setTextValue(`${startFmt}-${endFmt}`);
    }
    setTitleValue(task.title);
  }, [task.startDate, task.endDate, task.title]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextValue(val);
    const numbersOnly = val.replace(/[^0-9]/g, "");
    if (numbersOnly.length === 8) {
      const date = parse(numbersOnly, "yyyyMMdd", new Date());
      if (isValid(date))
        onUpdate(serviceId, { ...task, startDate: date, endDate: date });
    } else if (numbersOnly.length === 16) {
      const start = parse(numbersOnly.substring(0, 8), "yyyyMMdd", new Date());
      const end = parse(numbersOnly.substring(8, 16), "yyyyMMdd", new Date());
      if (isValid(start) && isValid(end))
        onUpdate(serviceId, { ...task, startDate: start, endDate: end });
    }
  };

  const handleDateInput = (field: "startDate" | "endDate", val: string) => {
    if (!val) return;
    const newDate = new Date(val);
    onUpdate(serviceId, { ...task, [field]: newDate });
  };
  const handleTitleBlur = () => {
    if (titleValue !== task.title)
      onUpdate(serviceId, { ...task, title: titleValue });
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

  // ✨ [수정] 보기 모드에서 스마트 날짜 표시 (화면 표시용)
  const getDisplayDateText = () => {
    const s = task.startDate;
    const e = task.endDate;
    const sYear = s.getFullYear();
    const eYear = e.getFullYear();

    // 1. 시작일
    const startStr =
      sYear === currentYear ? format(s, "MM.dd") : format(s, "yyyy.MM.dd");

    // 2. 같은 날이면 끝
    if (format(s, "yyyyMMdd") === format(e, "yyyyMMdd")) {
      return startStr;
    }

    // 3. 종료일
    let endStr = "";
    if (sYear === eYear) {
      endStr = format(e, "MM.dd");
    } else {
      endStr =
        eYear === currentYear ? format(e, "MM.dd") : format(e, "yyyy.MM.dd");
    }

    return `${startStr} ~ ${endStr}`;
  };

  return (
    <StTaskItem $isPast={isReadOnly}>
      <div className="task-header">
        {isReadOnly ? (
          <span className="task-title-text">{task.title}</span>
        ) : (
          <>
            <input
              type="text"
              className="task-title-input"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="업무명"
            />
            <button
              className="delete-task-btn"
              onClick={() => onDelete(serviceId, task.id)}
            >
              ×
            </button>
          </>
        )}
      </div>

      <StDateInputWrapper>
        {isReadOnly ? (
          // ✨ 스마트 포맷팅된 텍스트 노출
          <span className="date-text-display">{getDisplayDateText()}</span>
        ) : (
          <>
            <input
              type="text"
              className="date-text-input"
              value={textValue}
              onChange={handleTextChange}
              placeholder="YYYY.MM.DD"
              maxLength={21}
            />
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
                      onChange={(e) =>
                        handleDateInput("endDate", e.target.value)
                      }
                    />
                  </div>
                </StCalendarPopover>
              )}
            </div>
          </>
        )}
      </StDateInputWrapper>
    </StTaskItem>
  );
}

// ... 스타일 정의는 동일 (생략) ...
const StContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 2rem;
`;
const StControlBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
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
  min-height: 52px;
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
    .service-title-text {
      font-size: 1rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
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
    min-height: 28px;
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
    .task-title-text {
      font-size: 0.9rem;
      font-weight: 600;
      color: #374151;
      padding: 2px 0;
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
  min-height: 30px;
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
  .date-text-display {
    font-size: 0.85rem;
    color: #6b7280;
    font-family: monospace;
    letter-spacing: 0.5px;
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
