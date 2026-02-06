/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
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

  useEffect(() => {
    setSchedules(initialSchedules);
  }, [initialSchedules]);

  const updateLocalState = useCallback(
    (newSchedules: ServiceSchedule[]) => {
      setSchedules(newSchedules);
      if (onUpdateAll) onUpdateAll(newSchedules);
    },
    [onUpdateAll],
  );

  /** (이전 답변의 handleUpdateService 로직을 그대로 사용하세요) */


  /** 1. 서비스 생성 */
  const handleAddService = async () => {
    try {
      const newService = await API.createService(
        boardId,
        "새 프로젝트",
        "",
        "#3b82f6",
      );
      const nextSchedules = [...schedules, newService];
      updateLocalState(nextSchedules);
      setIsEditing(true);
    } catch (e) {
      console.error("서비스 생성 에러:", e);
      alert("프로젝트 생성 실패");
    }
  };

  /** ... (handleDeleteService, handleUpdateService 등) ... */

  const handleDeleteService = async (svcId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await API.deleteService(svcId);
      const nextSchedules = schedules.filter((s) => s.id !== svcId);
      updateLocalState(nextSchedules);
    } catch (e) {
      console.error(e);
      alert("삭제 실패");
    }
  };

  const handleUpdateService = async (svcId: string, updates: any) => {
    if (updates.isCompleted === true || updates.is_completed === true) {
      onToggleHide(svcId);
    }
    const nextSchedules = schedules.map((s) => {
      if (s.id !== svcId) return s;
      const nextIsCompleted =
        updates.isCompleted ?? updates.is_completed ?? s.isCompleted;
      return { ...s, ...updates, isCompleted: nextIsCompleted };
    });
    updateLocalState(nextSchedules);

    try {
      await API.updateService(svcId, updates);
    } catch (e) {
      console.error("서비스 업데이트 에러:", e);
    }
  };

  const handleColorChange = async (svcId: string, color: string) => {
    await handleUpdateService(svcId, { color });
  };

  const handleServiceNameChange = (svcId: string, newName: string) => {
    const nextSchedules = schedules.map((s) =>
      s.id === svcId ? { ...s, serviceName: newName } : s,
    );
    setSchedules(nextSchedules);
  };

  const handleServiceNameBlur = async (svcId: string, name: string) => {
    const nextSchedules = schedules.map((s) =>
      s.id === svcId ? { ...s, serviceName: name } : s,
    );
    updateLocalState(nextSchedules);

    try {
      await API.updateService(svcId, { serviceName: name });
    } catch (e) {
      console.error(e);
    }
  };


  const handleAddTask = async (svcId: string) => {
    try {
      const tempTask = {
        title: "새 업무",
        startDate: new Date(),
        endDate: new Date(),
      };
      const createdTask = await API.createTask(svcId, tempTask);

      const nextSchedules = schedules.map((svc) => {
        if (svc.id !== svcId) return svc;
        return { ...svc, tasks: [...svc.tasks, createdTask] };
      });
      updateLocalState(nextSchedules);
    } catch (e) {
      console.error("태스크 생성 에러:", e);
    }
  };

  const updateTask = async (svcId: string, updatedTask: TaskPhase) => {
    /** 1. 낙관적 업데이트 */
    const nextSchedules = schedules.map((svc) => {
      if (svc.id !== svcId) return svc;
      return {
        ...svc,
        tasks: svc.tasks.map((t) =>
          t.id === updatedTask.id ? updatedTask : t,
        ),
      };
    });
    updateLocalState(nextSchedules);

    /** 2. API 호출 */
    try {
      await API.updateTask(updatedTask.id, {
        title: updatedTask.title,
        startDate: updatedTask.startDate,
        endDate: updatedTask.endDate,
        isCompleted: updatedTask.isCompleted,
        memo: updatedTask.memo,
      });
    } catch (e) {
      console.error("태스크 업데이트 에러:", e);
    }
  };

  const deleteTask = async (svcId: string, taskId: string) => {
    if (!confirm("삭제하시겠습니까?")) return;

    const nextSchedules = schedules.map((svc) => {
      if (svc.id !== svcId) return svc;
      return { ...svc, tasks: svc.tasks.filter((t) => t.id !== taskId) };
    });
    updateLocalState(nextSchedules);

    try {
      await API.deleteTask(taskId);
    } catch (e) {
      console.error("태스크 삭제 에러:", e);
    }
  };

  return {
    schedules,
    isEditing,
    setIsEditing,
    handleAddService,
    handleUpdateService,
    handleDeleteService,
    handleAddTask,
    updateTask,
    deleteTask,
    handleColorChange,
    handleServiceNameChange,
    handleServiceNameBlur,
  };
}
