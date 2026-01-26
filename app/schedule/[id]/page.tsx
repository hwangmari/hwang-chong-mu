"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import styled from "styled-components";
import Link from "next/link";
import { addDays } from "date-fns";
import LeftCalendar from "../components/LeftCalendar";
import RightTaskPanel from "../components/RightTaskPanel";
import * as API from "@/services/schedule";
import { ServiceSchedule } from "@/types/work-schedule";

export default function ScheduleDetailPage() {
  const params = useParams();
  const boardId = params.id as string; // 이제 id는 '보드 ID' 입니다.

  const [boardInfo, setBoardInfo] = useState<{ title: string } | null>(null);
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showWeekend, setShowWeekend] = useState(false);
  const [loading, setLoading] = useState(true);

  // 데이터 로드
  useEffect(() => {
    if (boardId) loadData();
  }, [boardId]);

  const loadData = async () => {
    try {
      // ✨ 보드와 하위 프로젝트들 모두 가져옴
      const { board, services } = await API.fetchBoardWithData(boardId);
      setBoardInfo(board);
      setSchedules(services);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 캘린더 드래그 핸들러
  const handleTaskMove = async (
    serviceId: string,
    taskId: string,
    dayDiff: number,
  ) => {
    // ... (기존 로직 동일: 낙관적 업데이트 + API 호출) ...
    const service = schedules.find((s) => s.id === serviceId);
    const task = service?.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newStart = addDays(task.startDate, dayDiff);
    const newEnd = addDays(task.endDate, dayDiff);

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

    try {
      await API.updateTask(taskId, { startDate: newStart, endDate: newEnd });
    } catch (e) {
      console.error(e);
      loadData();
    }
  };

  if (loading) return <div>로딩 중...</div>;

  return (
    <StFixedContainer>
      <StTopBar>
        <div className="left-group">
          <Link href="/schedule" className="back-btn">
            ← 목록
          </Link>
          {/* 보드 제목 표시 */}
          <h1 className="page-title">{boardInfo?.title || "로딩 중..."}</h1>
        </div>
        {/* ... (컨트롤 바 동일) ... */}
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
          {/* ✨ RightTaskPanel에 boardId를 전달해야 함 */}
          <RightTaskPanel
            boardId={boardId}
            schedules={schedules}
            onUpdateAll={setSchedules}
          />
        </StRightSection>
      </StContentWrapper>
    </StFixedContainer>
  );
}
// ... (스타일 동일)
const StFixedContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  border: 0;
  left: 0;
  z-index: 100;
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
