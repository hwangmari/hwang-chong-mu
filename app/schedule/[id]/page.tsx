"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import styled from "styled-components";
import { addDays, format, isWithinInterval, startOfDay, endOfDay } from "date-fns";

import LeftCalendar from "../components/LeftCalendar";
import RightTaskPanel from "../components/RightTaskPanel";
import ScheduleHeader, { MemberFilter } from "../components/ScheduleHeader";
import QuickTaskModal from "../components/QuickTaskModal";
import IssuePanel from "../components/IssuePanel";
import * as API from "@/services/schedule";
import { SchedulePhase, ScheduleIssue } from "@/types/work-schedule";
import {
  StContainer,
  StLoadingWrapper,
} from "@/components/styled/layout.styled";

export default function ScheduleDetailPage() {
  const params = useParams();
  const serviceId = params.id as string;

  const [serviceInfo, setServiceInfo] = useState<{ title: string } | null>(null);
  const [phases, setPhases] = useState<SchedulePhase[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showWeekend, setShowWeekend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [quickTaskDate, setQuickTaskDate] = useState<Date | null>(null);
  const [sharedPhases, setSharedPhases] = useState<SchedulePhase[]>([]);
  const [memberFilters, setMemberFilters] = useState<MemberFilter[]>([]);
  const [isSharedPart, setIsSharedPart] = useState(false);
  const [previewDate, setPreviewDate] = useState<Date | null>(null);
  const [issues, setIssues] = useState<ScheduleIssue[]>([]);

  // 캘린더 우클릭 커스텀 이벤트 리스닝
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setQuickTaskDate(new Date(detail));
      }
    };
    window.addEventListener("schedule-quick-add", handler);
    return () => window.removeEventListener("schedule-quick-add", handler);
  }, []);

  const loadData = useCallback(async () => {
    if (!serviceId) return;
    try {
      const { service, phases: loadedPhases } = await API.fetchServiceWithData(serviceId);
      setServiceInfo(service);
      setPhases(loadedPhases);

      // 이슈 로딩
      API.fetchServiceIssues(serviceId).then(setIssues).catch(() => {});

      // 공용 파트 여부 확인 및 멤버 일정 로딩
      if (service.workspace_id) {
        const { data: ws } = await (await import("@/lib/supabase")).supabase
          .from("schedule_workspaces")
          .select("type, member_ids")
          .eq("id", service.workspace_id)
          .single();

        if (ws?.type === "shared") {
          setIsSharedPart(true);
          const shared = await API.fetchSharedCalendarPhases(service.workspace_id);
          setSharedPhases(shared);

          // 멤버 필터 초기화 (중복 제거)
          const memberMap = new Map<string, MemberFilter>();
          shared.forEach((phase) => {
            if (phase.memberId && phase.memberName && !memberMap.has(phase.memberId)) {
              memberMap.set(phase.memberId, {
                id: phase.memberId,
                name: phase.memberName,
                color: phase.memberColor || phase.color,
                visible: true,
              });
            }
          });
          setMemberFilters(Array.from(memberMap.values()));
        } else {
          setIsSharedPart(false);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const onFocus = () => {
      setTimeout(() => loadData(), 100);
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("visibilitychange", onFocus);

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
    phaseId: string,
    taskId: string,
    dayDiff: number,
  ) => {
    setPhases((prev) =>
      prev.map((phase) => {
        if (phase.id !== phaseId) return phase;
        return {
          ...phase,
          tasks: phase.tasks.map((t) => {
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

  const handleToggleMember = (memberId: string) => {
    setMemberFilters((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, visible: !m.visible } : m,
      ),
    );
  };

  // 공용 캘린더: 서비스 자체 단계 + 멤버 개인 단계 합침, 멤버 필터 적용
  const allPhases = useMemo(() => {
    if (!isSharedPart) return phases;

    const visibleMemberIds = new Set(
      memberFilters.filter((m) => m.visible).map((m) => m.id),
    );

    const filteredShared = sharedPhases.filter(
      (phase) => !phase.memberId || visibleMemberIds.has(phase.memberId),
    );

    const existingIds = new Set(phases.map((s) => s.id));
    const merged = [
      ...phases,
      ...filteredShared.filter((s) => !existingIds.has(s.id)),
    ];
    return merged;
  }, [phases, sharedPhases, memberFilters, isSharedPart]);

  const visiblePhases = useMemo(() => {
    return allPhases.filter((s) => !hiddenIds.has(s.id));
  }, [allPhases, hiddenIds]);

  const previewTasks = useMemo(() => {
    if (!previewDate) return [];
    const dayStart = startOfDay(previewDate);
    const dayEnd = endOfDay(previewDate);
    const tasks: { phaseName: string; color: string; title: string; memberName?: string }[] = [];
    visiblePhases.forEach((phase) => {
      phase.tasks.forEach((t) => {
        if (t.isCompleted) return;
        if (
          isWithinInterval(dayStart, { start: startOfDay(t.startDate), end: endOfDay(t.endDate) })
        ) {
          tasks.push({
            phaseName: phase.phaseName,
            color: phase.color,
            title: t.title,
            memberName: phase.memberName,
          });
        }
      });
    });
    return tasks;
  }, [previewDate, visiblePhases]);

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
        title={serviceInfo?.title || "서비스 일정"}
        showWeekend={showWeekend}
        onToggleWeekend={setShowWeekend}
        boardId={serviceId}
        memberFilters={isSharedPart ? memberFilters : undefined}
        onToggleMember={isSharedPart ? handleToggleMember : undefined}
      />

      <StContentWrapper>
        <StLeftSection>
          <LeftCalendar
            currentDate={currentDate}
            schedules={visiblePhases}
            showWeekend={showWeekend}
            onMonthChange={setCurrentDate}
            onTaskMove={handleTaskMove}
            onDayClick={(day) => setQuickTaskDate(day)}
            onDayPreview={(day) =>
              setPreviewDate((prev) =>
                prev && format(prev, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
                  ? null
                  : day,
              )
            }
          />
        </StLeftSection>

        <StRightSection>
          <RightTaskPanel
            boardId={serviceId}
            schedules={isSharedPart ? allPhases : phases}
            onUpdateAll={setPhases}
            hiddenIds={hiddenIds}
            onToggleHide={handleToggleHide}
          />
          <IssuePanel
            serviceId={serviceId}
            issues={issues}
            onReload={() =>
              API.fetchServiceIssues(serviceId).then(setIssues).catch(() => {})
            }
          />
        </StRightSection>
      </StContentWrapper>

      {previewDate && (
        <StDayPreview>
          <StPreviewHeader>
            <span>{format(previewDate, "M월 d일 (eee)")}</span>
            <StPreviewClose onClick={() => setPreviewDate(null)}>✕</StPreviewClose>
          </StPreviewHeader>
          {previewTasks.length === 0 ? (
            <StPreviewEmpty>등록된 일정이 없습니다.</StPreviewEmpty>
          ) : (
            <StPreviewList>
              {previewTasks.map((t, i) => (
                <StPreviewItem key={i}>
                  <StPreviewDot $color={t.color} />
                  <div>
                    <StPreviewSvc>{t.phaseName}{t.memberName ? ` · ${t.memberName}` : ""}</StPreviewSvc>
                    <StPreviewTitle>{t.title}</StPreviewTitle>
                  </div>
                </StPreviewItem>
              ))}
            </StPreviewList>
          )}
          <StPreviewAction onClick={() => { setQuickTaskDate(previewDate); setPreviewDate(null); }}>
            + 이 날짜에 일정 추가
          </StPreviewAction>
        </StDayPreview>
      )}

      {quickTaskDate && (
        <QuickTaskModal
          date={quickTaskDate}
          phases={phases}
          serviceId={serviceId}
          onClose={() => setQuickTaskDate(null)}
          onCreated={loadData}
        />
      )}
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

const StDayPreview = styled.div`
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  width: 320px;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border: 1px solid #e5e7eb;
  z-index: 200;
  overflow: hidden;

  @media (max-width: 767px) {
    left: 1rem;
    right: 1rem;
    width: auto;
    bottom: 1rem;
  }
`;

const StPreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.95rem;
  font-weight: 800;
  color: #111827;
`;

const StPreviewClose = styled.button`
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 2px 6px;
  border-radius: 4px;
  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const StPreviewEmpty = styled.p`
  padding: 1.25rem 1rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.85rem;
`;

const StPreviewList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem 0;
`;

const StPreviewItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.4rem 1rem;
`;

const StPreviewDot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
  margin-top: 5px;
`;

const StPreviewSvc = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  color: #9ca3af;
`;

const StPreviewTitle = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
`;

const StPreviewAction = styled.button`
  display: block;
  width: 100%;
  padding: 0.7rem;
  text-align: center;
  background: #f9fafb;
  border: none;
  border-top: 1px solid #f3f4f6;
  color: #3b82f6;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #eff6ff;
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
