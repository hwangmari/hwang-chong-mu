import { useState, useEffect } from "react";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";
import * as API from "@/services/schedule";

export function useScheduleActions(
  initialSchedules: ServiceSchedule[],
  boardId: string,
  onUpdateAll?: (services: ServiceSchedule[]) => void, // ✨ 부모 업데이트 함수
) {
  const [schedules, setSchedules] =
    useState<ServiceSchedule[]>(initialSchedules);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setSchedules(initialSchedules);
  }, [initialSchedules]);

  // 공통 업데이트 헬퍼 (로컬 상태 + 부모 동기화)
  const updateLocalState = (newSchedules: ServiceSchedule[]) => {
    setSchedules(newSchedules);
    if (onUpdateAll) onUpdateAll(newSchedules); // ✨ 핵심: 부모에게 알림
  };

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
      console.error(e);
      alert("프로젝트 생성 실패");
    }
  };

  const handleDeleteService = async (svcId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await API.deleteService(svcId);
      updateLocalState(schedules.filter((s) => s.id !== svcId));
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
      const updated = schedules.map((svc) =>
        svc.id === svcId ? { ...svc, tasks: [...svc.tasks, newTask] } : svc,
      );
      updateLocalState(updated);
    } catch (e) {
      console.error(e);
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
      console.error(e);
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
      console.error(e);
    }
  };

  const handleColorChange = async (svcId: string, color: string) => {
    const updated = schedules.map((s) =>
      s.id === svcId ? { ...s, color } : s,
    );
    updateLocalState(updated);
    try {
      await API.updateService(svcId, { color });
    } catch (e) {
      console.error(e);
    }
  };

  // 입력 중에는 로컬 상태만 변경 (타이핑 성능 위해)
  const handleServiceNameChange = (svcId: string, newName: string) => {
    const updated = schedules.map((s) =>
      s.id === svcId ? { ...s, serviceName: newName } : s,
    );
    setSchedules(updated);
    // 💡 필요하다면 여기서도 updateLocalState(updated)를 호출해 즉시 반영할 수 있습니다.
  };

  // 포커스 아웃 시: 서버 저장 + 부모 동기화(확정)
  const handleServiceNameBlur = async (svcId: string, name: string) => {
    // ✨ [수정됨] 여기서 부모에게도 변경된 이름을 전파해야 함!
    const updated = schedules.map((s) =>
      s.id === svcId ? { ...s, serviceName: name } : s,
    );
    updateLocalState(updated); // 부모와 동기화

    try {
      await API.updateService(svcId, { name });
    } catch (e) {
      console.error(e);
    }
  };

  return {
    schedules,
    isEditing,
    setIsEditing,
    handleAddService,
    handleDeleteService,
    handleAddTask,
    updateTask,
    deleteTask,
    handleColorChange,
    handleServiceNameChange,
    handleServiceNameBlur,
  };
}
