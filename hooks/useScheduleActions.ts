import { useState, useEffect, useCallback } from "react";
import { SchedulePhase, TaskPhase } from "@/types/work-schedule";
import * as API from "@/services/schedule";

export function useScheduleActions(
  initialPhases: SchedulePhase[],
  serviceId: string,
  onToggleHide: (id: string) => void,
  onUpdateAll?: (phases: SchedulePhase[]) => void,
) {
  const [phases, setPhases] =
    useState<SchedulePhase[]>(initialPhases);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setPhases(initialPhases);
  }, [initialPhases]);

  const updateLocalState = useCallback(
    (newPhases: SchedulePhase[]) => {
      setPhases(newPhases);
      if (onUpdateAll) onUpdateAll(newPhases);
    },
    [onUpdateAll],
  );

  const handleAddPhase = async () => {
    try {
      const newPhase = await API.createPhase(
        serviceId,
        "새 단계",
        "",
        "#3b82f6",
      );
      const nextPhases = [...phases, newPhase];
      updateLocalState(nextPhases);
      setIsEditing(true);
    } catch (e) {
      console.error("단계 생성 에러:", e);
      alert("단계 생성 실패");
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await API.deletePhase(phaseId);
      const nextPhases = phases.filter((s) => s.id !== phaseId);
      updateLocalState(nextPhases);
    } catch (e) {
      console.error(e);
      alert("삭제 실패");
    }
  };

  const handleUpdatePhase = async (phaseId: string, updates: any) => {
    if (updates.isCompleted === true || updates.is_completed === true) {
      onToggleHide(phaseId);
    }
    const nextPhases = phases.map((s) => {
      if (s.id !== phaseId) return s;
      const nextIsCompleted =
        updates.isCompleted ?? updates.is_completed ?? s.isCompleted;
      return { ...s, ...updates, isCompleted: nextIsCompleted };
    });
    updateLocalState(nextPhases);

    try {
      await API.updatePhase(phaseId, updates);
    } catch (e) {
      console.error("단계 업데이트 에러:", e);
    }
  };

  const handleColorChange = async (phaseId: string, color: string) => {
    await handleUpdatePhase(phaseId, { color });
  };

  const handlePhaseNameChange = (phaseId: string, newName: string) => {
    const nextPhases = phases.map((s) =>
      s.id === phaseId ? { ...s, phaseName: newName } : s,
    );
    setPhases(nextPhases);
  };

  const handlePhaseNameBlur = async (phaseId: string, name: string) => {
    const nextPhases = phases.map((s) =>
      s.id === phaseId ? { ...s, phaseName: name } : s,
    );
    updateLocalState(nextPhases);

    try {
      await API.updatePhase(phaseId, { phaseName: name });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTask = async (phaseId: string) => {
    try {
      const tempTask = {
        title: "새 업무",
        startDate: new Date(),
        endDate: new Date(),
      };
      const createdTask = await API.createTask(phaseId, tempTask);

      const nextPhases = phases.map((phase) => {
        if (phase.id !== phaseId) return phase;
        return { ...phase, tasks: [...phase.tasks, createdTask] };
      });
      updateLocalState(nextPhases);
    } catch (e) {
      console.error("태스크 생성 에러:", e);
    }
  };

  const updateTask = async (phaseId: string, updatedTask: TaskPhase) => {
    const nextPhases = phases.map((phase) => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        tasks: phase.tasks.map((t) =>
          t.id === updatedTask.id ? updatedTask : t,
        ),
      };
    });
    updateLocalState(nextPhases);

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

  const deleteTask = async (phaseId: string, taskId: string) => {
    if (!confirm("삭제하시겠습니까?")) return;

    const nextPhases = phases.map((phase) => {
      if (phase.id !== phaseId) return phase;
      return { ...phase, tasks: phase.tasks.filter((t) => t.id !== taskId) };
    });
    updateLocalState(nextPhases);

    try {
      await API.deleteTask(taskId);
    } catch (e) {
      console.error("태스크 삭제 에러:", e);
    }
  };

  return {
    schedules: phases,
    isEditing,
    setIsEditing,
    handleAddService: handleAddPhase,
    handleUpdateService: handleUpdatePhase,
    handleDeleteService: handleDeletePhase,
    handleAddTask,
    updateTask,
    deleteTask,
    handleColorChange,
    handleServiceNameChange: handlePhaseNameChange,
    handleServiceNameBlur: handlePhaseNameBlur,
  };
}
