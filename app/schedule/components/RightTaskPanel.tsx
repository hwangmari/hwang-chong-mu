/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import styled from "styled-components";
import { isBefore, startOfDay, format } from "date-fns";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";
import * as API from "@/services/schedule";
// ✨ 분리된 컴포넌트 import
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
  const today = startOfDay(new Date());
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setLocalSchedules(schedules);
  }, [schedules]);

  // --- 텍스트 복사 (메모 내용도 포함하고 싶다면 수정 가능) ---
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

        // 메모가 있으면 텍스트에도 포함할지 여부 (현재는 포함 안 함)
        // const memoStr = t.memo ? ` (Note: ${t.memo})` : "";
        text += `- ${t.title}: ${dateStr}\n`;
      });
      text += "\n";
    });

    navigator.clipboard.writeText(text).then(() => {
      alert("일정이 복사되었습니다!");
    });
  };

  // --- 서비스 관련 핸들러들 (기존 동일) ---
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

  // --- 업무 관련 핸들러들 (하위로 전달됨) ---
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
        memo: updatedTask.memo, // 👈 ✨ 이 부분이 꼭 있어야 함!
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
              {/* ✨ 분리된 TaskRow 사용 */}
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

// ... 스타일 정의는 기존과 동일 ...
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
