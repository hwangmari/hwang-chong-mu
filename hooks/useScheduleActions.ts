/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";
import * as API from "@/services/schedule";

export function useScheduleActions(
  initialSchedules: ServiceSchedule[],
  boardId: string,
  onToggleHide: (id: string) => void,
  onUpdateAll?: (services: ServiceSchedule[]) => void,
) {
  const [schedules, setSchedules] =
    useState<ServiceSchedule[]>(initialSchedules);
  const [isEditing, setIsEditing] = useState(false);

  // 초기 데이터 동기화
  useEffect(() => {
    setSchedules(initialSchedules);
  }, [initialSchedules]);

  // 공통 업데이트 헬퍼 (로컬 상태 반영 + 부모 컴포넌트 알림)
  const updateLocalState = (newSchedules: ServiceSchedule[]) => {
    setSchedules(newSchedules);
    if (onUpdateAll) onUpdateAll(newSchedules);
  };

  // =========================================================
  // 1.
  // =========================================================

  const handleAddService = async () => {
    try {
      const newService = await API.createService(
        boardId,
        "새 프로젝트",
        "",
        "#10b981",
      );
      updateLocalState([...schedules, newService]);
      setIsEditing(true);
    } catch (e) {
      console.error("프로젝트 생성 실패:", e);
    }
  };

  const handleUpdateService = async (svcId: string, updates: any) => {
    // ✨ 완료 체크 시 자동으로 눈감기 처리
    if (updates.is_completed === true) {
      onToggleHide(svcId);
    }

    const updatedSchedules = schedules.map((s) => {
      if (s.id !== svcId) return s;
      // DB의 is_completed와 UI의 isCompleted 매핑 처리
      const nextIsCompleted =
        updates.is_completed !== undefined
          ? updates.is_completed
          : s.isCompleted;
      return { ...s, ...updates, isCompleted: nextIsCompleted };
    });

    updateLocalState(updatedSchedules);

    try {
      await API.updateService(svcId, updates);
    } catch (e) {
      console.error("프로젝트 업데이트 실패:", e);
    }
  };

  const handleDeleteService = async (svcId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await API.deleteService(svcId);
      updateLocalState(schedules.filter((s) => s.id !== svcId));
    } catch (e) {
      console.error("프로젝트 삭제 실패:", e);
    }
  };

  const handleColorChange = async (svcId: string, color: string) => {
    handleUpdateService(svcId, { color });
  };

  const handleServiceNameChange = (svcId: string, newName: string) => {
    setSchedules(
      schedules.map((s) =>
        s.id === svcId ? { ...s, serviceName: newName } : s,
      ),
    );
  };

  const handleServiceNameBlur = async (svcId: string, name: string) => {
    handleUpdateService(svcId, { name });
  };

  // =========================================================
  // 2. 업무(Task) 관련 액션
  // =========================================================

  const handleAddTask = async (svcId: string) => {
    try {
      const newTask = await API.createTask(svcId, {
        title: "새 업무",
        startDate: new Date(),
        endDate: new Date(),
      });
      const updated = schedules.map((svc) =>
        svc.id === svcId ? { ...svc, tasks: [...svc.tasks, newTask] } : svc,
      );
      updateLocalState(updated);
    } catch (e) {
      console.error("업무 생성 실패:", e);
    }
  };

  const updateTask = async (svcId: string, updatedTask: TaskPhase) => {
    const updatedSchedules = schedules.map((svc) => {
      if (svc.id !== svcId) return svc;
      return {
        ...svc,
        tasks: svc.tasks.map((t) =>
          t.id === updatedTask.id ? updatedTask : t,
        ),
      };
    });
    updateLocalState(updatedSchedules);
    try {
      await API.updateTask(updatedTask.id, { ...updatedTask });
    } catch (e) {
      console.error("업무 업데이트 실패:", e);
    }
  };

  const deleteTask = async (svcId: string, taskId: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      await API.deleteTask(taskId);
      const updated = schedules.map((svc) => {
        if (svc.id !== svcId) return svc;
        return { ...svc, tasks: svc.tasks.filter((t) => t.id !== taskId) };
      });
      updateLocalState(updated);
    } catch (e) {
      console.error("업무 삭제 실패:", e);
    }
  };

  return {
    schedules,
    isEditing,
    setIsEditing,
    handleAddService,
    handleUpdateService,
    handleDeleteService,
    handleColorChange,
    handleServiceNameChange,
    handleServiceNameBlur,
    handleAddTask,
    updateTask,
    deleteTask,
  };
}
