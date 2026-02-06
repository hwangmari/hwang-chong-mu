"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import styled from "styled-components";
import { addDays } from "date-fns";

import LeftCalendar from "../components/LeftCalendar";
import RightTaskPanel from "../components/RightTaskPanel";
import ScheduleHeader from "../components/ScheduleHeader";
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
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    if (!boardId) return;
    try {
      const { board, services } = await API.fetchBoardWithData(boardId);
      setBoardInfo(board);
      setSchedules(services);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const onFocus = () => {
      setTimeout(() => loadData(), 100);
    };

    window.addEventListener("focus", onFocus); // 탭 이동 후 복귀 시
    window.addEventListener("visibilitychange", onFocus); // 브라우저 최소화 후 복귀 시

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("visibilitychange", onFocus);
    };
  }, [loadData]);

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
              loadData(); // 에러 시 롤백용 재조회
            });

            return { ...t, startDate: updatedStart, endDate: updatedEnd };
          }),
        };
      }),
    );
  };

  const visibleSchedules = useMemo(() => {
    return schedules.filter((s) => !hiddenIds.has(s.id));
  }, [schedules, hiddenIds]);

  if (loading) {
    return (
      <StContainer>
        <StLoadingWrapper>로딩 중... ⏳</StLoadingWrapper>
      </StContainer>
    );
  }

  return (
    <StFixedContainer>
      <ScheduleHeader
        title={boardInfo?.title || "프로젝트 일정"}
        showWeekend={showWeekend}
        onToggleWeekend={setShowWeekend}
        boardId={boardId}
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
            onUpdateAll={setSchedules} // ✨ 하위 컴포넌트 업데이트 시 상태 반영
            hiddenIds={hiddenIds}
            onToggleHide={handleToggleHide}
          />
        </StRightSection>
      </StContentWrapper>
    </StFixedContainer>
  );
}

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

  @media ${({ theme }) => theme.media.mobile} {
    flex-direction: column;
    overflow: auto;
  }
`;

const StLeftSection = styled.div`
  flex: 3;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e7eb;

  @media ${({ theme }) => theme.media.mobile} {
    flex: none;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }
`;

const StRightSection = styled.div`
  flex: 1;
  min-width: 380px;
  max-width: 500px;
  background-color: white;
  overflow-y: auto;
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.02);

  @media ${({ theme }) => theme.media.mobile} {
    flex: none;
    min-width: 100%;
    max-width: 100%;
    box-shadow: none;
  }
`;
