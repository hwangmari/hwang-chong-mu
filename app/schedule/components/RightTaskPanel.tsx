/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { startOfDay, format } from "date-fns";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";
import * as API from "@/services/schedule";
// ✨ ServiceList 컴포넌트 임포트
import ServiceList from "./ServiceList";

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

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
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
        const containerRect = containerElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        const scrollTo =
          containerElement.scrollTop +
          (targetRect.top - containerRect.top) -
          containerElement.clientHeight / 2 +
          targetRect.height / 2;

        containerElement.scrollTo({
          top: scrollTo,
          behavior: "smooth",
        });

        setCollapsedIds((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(svcId)) {
            newSet.delete(svcId);
            return newSet;
          }
          return prev;
        });

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

  // API 핸들러들
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

      {/* 2. 하단 스크롤 영역 (분리된 컴포넌트 사용) */}
      <ServiceList
        schedules={localSchedules}
        scrollAreaRef={scrollAreaRef}
        collapsedIds={collapsedIds}
        highlightId={highlightId}
        isEditing={isEditing}
        today={today}
        onToggleCollapse={toggleCollapse}
        onServiceNameChange={handleServiceNameChange}
        onServiceNameBlur={handleServiceNameBlur}
        onColorChange={handleColorChange}
        onDeleteService={handleDeleteService}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
        onAddTask={handleAddTask}
        onAddService={handleAddService}
      />
    </StContainer>
  );
}

// --- 스타일 정의 (상단 컨테이너 및 헤더만 유지) ---

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
