"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import Link from "next/link";
import { addDays } from "date-fns";
import LeftCalendar from "../components/LeftCalendar";
import RightTaskPanel from "../components/RightTaskPanel";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";
import * as API from "./../schedule"; // 모든 API 함수 import

export default function ScheduleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showWeekend, setShowWeekend] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. 초기 데이터 로드
  useEffect(() => {
    loadServiceData();
  }, [id]);

  const loadServiceData = async () => {
    try {
      const data = await API.fetchServiceById(id);
      setSchedules([data]); // 현재는 하나만 보지만 배열로 관리
    } catch (e) {
      console.error("데이터 로드 실패:", e);
      alert("일정을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 2. [Handler] 서비스 정보 업데이트 (이름, 색상 등)
  const handleServiceUpdate = async (updatedService: ServiceSchedule) => {
    // 낙관적 업데이트 (UI 먼저 반영)
    setSchedules((prev) =>
      prev.map((s) => (s.id === updatedService.id ? updatedService : s)),
    );

    try {
      await API.updateService(updatedService.id, {
        name: updatedService.serviceName,
        color: updatedService.color,
      });
    } catch (e) {
      console.error("서비스 수정 실패", e);
      loadServiceData(); // 실패 시 롤백
    }
  };

  // 3. [Handler] 업무 추가/수정/삭제 (RightTaskPanel에서 호출될 통합 핸들러가 필요함)
  // 하지만 RightTaskPanel 내부 로직이 복잡하므로,
  // 여기서는 '저장' 버튼을 눌렀을 때 전체를 저장하는 것이 아니라
  // RightTaskPanel 내부에서 개별 액션(onUpdateTask 등)을 prop으로 받아 처리하는 게 좋습니다.
  // 👉 RightTaskPanel을 수정하여 API 호출을 직접 하거나, 아래처럼 개별 핸들러를 내려줍니다.

  // 이번에는 RightTaskPanel에 'onSave' 하나만 있으므로,
  // 실제로는 RightTaskPanel 내부에서 API를 호출하도록 수정하는 것이 Best Practice입니다.
  // (아래에서 RightTaskPanel 수정 가이드를 드립니다)

  // 4. [Handler] 캘린더 드래그 앤 드롭 (날짜 이동)
  const handleTaskMove = async (
    serviceId: string,
    taskId: string,
    dayDiff: number,
  ) => {
    // 현재 상태 찾기
    const service = schedules.find((s) => s.id === serviceId);
    const task = service?.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newStart = addDays(task.startDate, dayDiff);
    const newEnd = addDays(task.endDate, dayDiff);

    // 낙관적 업데이트
    setSchedules((prev) =>
      prev.map((svc) => {
        if (svc.id !== serviceId) return svc;
        return {
          ...svc,
          tasks: svc.tasks.map((t) =>
            t.id === taskId
              ? { ...t, startDate: newStart, endDate: newEnd }
              : t,
          ),
        };
      }),
    );

    // API 호출
    try {
      await API.updateTask(taskId, { startDate: newStart, endDate: newEnd });
    } catch (e) {
      console.error("일정 이동 실패", e);
      loadServiceData(); // 롤백
    }
  };

  if (loading) return <StLoading>로딩 중...</StLoading>;

  return (
    <StContainer>
      <StTopBar>
        <div className="left-group">
          <Link href="/schedule" className="back-btn">
            ← 목록
          </Link>
          <h1 className="page-title">{schedules[0]?.serviceName}</h1>
        </div>
        <StControls>
          <StSwitchLabel>
            <input
              type="checkbox"
              checked={showWeekend}
              onChange={(e) => setShowWeekend(e.target.checked)}
            />
            <span>주말 포함</span>
          </StSwitchLabel>
        </StControls>
      </StTopBar>

      <StContentWrapper>
        <StLeftSection>
          <LeftCalendar
            currentDate={currentDate}
            schedules={schedules}
            showWeekend={showWeekend}
            onMonthChange={setCurrentDate}
            onTaskMove={handleTaskMove}
          />
        </StLeftSection>

        <StRightSection>
          {/* RightTaskPanel에 API 로직을 주입하거나, 내부에서 호출하도록 변경해야 함 */}
          {/* 우선은 schedules를 넘겨주고, 내부에서 변경 시 상위 state도 같이 업데이트되도록 */}
          <RightTaskPanel
            schedules={schedules}
            onSave={(svc) => {
              /* 저장 버튼은 이제 개별 동작으로 대체될 예정 */
            }}
            // ✨ 상위 State 동기화용
            onUpdateAll={setSchedules}
          />
        </StRightSection>
      </StContentWrapper>
    </StContainer>
  );
}

// ... 스타일 코드는 기존과 동일 ...
const StContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f9fa;
  overflow: hidden;
`;
const StTopBar = styled.header`
  height: 60px;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  flex-shrink: 0;
  .left-group {
    display: flex;
    align-items: center;
    gap: 1rem;
    .back-btn {
      font-size: 0.9rem;
      color: #6b7280;
      text-decoration: none;
      font-weight: 500;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      &:hover {
        background-color: #f3f4f6;
        color: #111827;
      }
    }
    .page-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #111827;
    }
  }
`;
const StControls = styled.div`
  display: flex;
  gap: 1rem;
`;
const StSwitchLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  user-select: none;
  color: #374151;
  input {
    accent-color: #111827;
    width: 16px;
    height: 16px;
  }
`;
const StContentWrapper = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;
const StLeftSection = styled.div`
  flex: 3;
  padding: 1.5rem;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e7eb;
`;
const StRightSection = styled.div`
  flex: 1;
  min-width: 380px;
  max-width: 500px;
  padding: 1.5rem;
  background-color: white;
  overflow-y: auto;
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.02);
`;
const StLoading = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  font-weight: 600;
  color: #9ca3af;
`;
