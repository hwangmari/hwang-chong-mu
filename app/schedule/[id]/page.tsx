/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import styled from "styled-components";
import Link from "next/link";
import { addDays } from "date-fns";

// 컴포넌트 임포트
import LeftCalendar from "../components/LeftCalendar";
import RightTaskPanel from "../components/RightTaskPanel";
import * as API from "@/services/schedule";
import { ServiceSchedule } from "@/types/work-schedule";
import {
  StContainer,
  StLoadingWrapper,
} from "@/components/styled/layout.styled";

export default function ScheduleDetailPage() {
  const params = useParams();
  const boardId = params.id as string;

  const [boardInfo, setBoardInfo] = useState<{ title: string } | null>(null);
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showWeekend, setShowWeekend] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✨ [1] 숨김 상태 관리 (Set으로 관리)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  // 데이터 로드
  useEffect(() => {
    if (boardId) loadData();
  }, [boardId]);

  const loadData = async () => {
    try {
      const { board, services } = await API.fetchBoardWithData(boardId);
      setBoardInfo(board);
      setSchedules(services);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ✨ [2] 토글 핸들러
  const handleToggleHide = (id: string) => {
    setHiddenIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // 캘린더 드래그 핸들러
  const handleTaskMove = async (
    serviceId: string,
    taskId: string,
    dayDiff: number,
  ) => {
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

  // ✨ [3] 캘린더용 필터링 (숨겨진 프로젝트 제외)
  const visibleSchedules = schedules.filter((s) => !hiddenIds.has(s.id));

  if (loading) {
    return (
      <StContainer>
        <StLoadingWrapper>로딩 중... ⏳</StLoadingWrapper>
      </StContainer>
    );
  }

  return (
    <StFixedContainer>
      <StTopBar>
        <div className="left-group">
          <Link href="/schedule" className="back-link">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 19L8 12L15 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <h1 className="page-title">{boardInfo?.title || "로딩 중..."}</h1>
        </div>

        {/* 주말 보기 스위치 */}
        <StControls>
          <StSwitchLabel>
            <input
              type="checkbox"
              checked={showWeekend}
              onChange={(e) => setShowWeekend(e.target.checked)}
            />
            주말 포함
          </StSwitchLabel>
        </StControls>
      </StTopBar>

      <StContentWrapper>
        <StLeftSection>
          {/* ✨ 캘린더에는 필터링된 일정 전달 */}
          <LeftCalendar
            currentDate={currentDate}
            schedules={visibleSchedules}
            showWeekend={showWeekend}
            onMonthChange={setCurrentDate}
            onTaskMove={handleTaskMove}
          />
        </StLeftSection>

        <StRightSection>
          {/* ✨ 우측 패널에는 전체 일정 + 숨김 제어 전달 */}
          <RightTaskPanel
            boardId={boardId}
            schedules={schedules}
            onUpdateAll={setSchedules}
            hiddenIds={hiddenIds}
            onToggleHide={handleToggleHide}
          />
        </StRightSection>
      </StContentWrapper>
    </StFixedContainer>
  );
}

// --- 스타일 정의 ---
const StFixedContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
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
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #6b7280;
      transition: color 0.2s;
      &:hover {
        color: #111827;
      }
      svg {
        display: block;
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
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e7eb;
`;

const StRightSection = styled.div`
  flex: 1;
  min-width: 380px;
  max-width: 500px;
  background-color: white;
  overflow-y: auto;
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.02);
`;
