/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import styled from "styled-components";
import { addDays } from "date-fns";

// 컴포넌트 임포트
import LeftCalendar from "../components/LeftCalendar";
import RightTaskPanel from "../components/RightTaskPanel";
import ScheduleHeader from "../components/ScheduleHeader"; // ✨ [NEW] 추가됨
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

  // 숨김 상태 관리
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

  const handleToggleHide = (id: string) => {
    setHiddenIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleTaskMove = async (
    serviceId: string,
    taskId: string,
    dayDiff: number,
  ) => {
    // ... (드래그 로직 기존과 동일)
    const newStart = addDays(new Date(), dayDiff); // (임시) 실제로는 기존 날짜 기반 계산 필요

    setSchedules((prev) =>
      prev.map((svc) => {
        if (svc.id !== serviceId) return svc;
        return {
          ...svc,
          tasks: svc.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const updatedStart = addDays(t.startDate, dayDiff);
            const updatedEnd = addDays(t.endDate, dayDiff);

            API.updateTask(taskId, {
              startDate: updatedStart,
              endDate: updatedEnd,
            }).catch((e) => {
              console.error(e);
              loadData();
            });

            return { ...t, startDate: updatedStart, endDate: updatedEnd };
          }),
        };
      }),
    );
  };

  // 캘린더 데이터 필터링 예시
  const visibleSchedules = schedules.filter((s) => {
    return !hiddenIds.has(s.id);
  });

  if (loading) {
    return (
      <StContainer>
        <StLoadingWrapper>로딩 중... ⏳</StLoadingWrapper>
      </StContainer>
    );
  }

  return (
    <StFixedContainer>
      {/* ✨ 헤더 컴포넌트로 교체 */}
      <ScheduleHeader
        title={boardInfo?.title || "로딩 중..."}
        showWeekend={showWeekend}
        onToggleWeekend={setShowWeekend}
      />

      <StContentWrapper>
        <StLeftSection>
          <LeftCalendar
            currentDate={currentDate}
            schedules={visibleSchedules}
            showWeekend={showWeekend}
            onMonthChange={setCurrentDate}
            onTaskMove={handleTaskMove}
          />
        </StLeftSection>

        <StRightSection>
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
