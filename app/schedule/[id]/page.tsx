"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import Link from "next/link";
import { addDays } from "date-fns";
// ✨ [수정 1] useParams 훅 import
import { useParams } from "next/navigation";

import LeftCalendar from "../components/LeftCalendar";
import RightTaskPanel from "../components/RightTaskPanel";
import { ServiceSchedule } from "@/types/work-schedule";
import * as API from "@/services/schedule";

export default function ScheduleDetailPage() {
  // ✨ [수정 2] Props 대신 훅으로 ID 가져오기 (Next.js 15+ 대응)
  const params = useParams();
  const id = params.id as string;

  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showWeekend, setShowWeekend] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. 초기 데이터 로드
  useEffect(() => {
    // id가 있을 때만 로드
    if (id) {
      loadServiceData();
    }
  }, [id]);

  const loadServiceData = async () => {
    try {
      const data = await API.fetchServiceById(id);
      setSchedules([data]);
    } catch (e) {
      console.error("데이터 로드 실패:", e);
      // alert("일정을 불러오지 못했습니다."); // 너무 자주 뜨면 불편하니 콘솔만 확인
    } finally {
      setLoading(false);
    }
  };

  // 2. [Handler] 캘린더 드래그 앤 드롭 (날짜 이동)
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

  // 데이터가 없을 때의 방어 로직 추가
  if (schedules.length === 0) {
    return <StLoading>데이터가 없습니다.</StLoading>;
  }

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
          <RightTaskPanel
            schedules={schedules}
            // ✨ RightTaskPanel 내부에서 자동 저장하므로 여기서는 State 동기화만 담당
            onUpdateAll={setSchedules}
          />
        </StRightSection>
      </StContentWrapper>
    </StContainer>
  );
}

// ... 스타일 코드는 그대로 유지 ...
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
