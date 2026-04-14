"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import styled from "styled-components";
import { addDays, format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import Link from "next/link";

import LeftCalendar from "../components/LeftCalendar";
import * as API from "@/services/schedule";
import { SchedulePhase, ScheduleServiceData, ScheduleIssue } from "@/types/work-schedule";
import { PartCalendarPhase } from "@/services/schedule";
import { StLoadingWrapper } from "@/components/styled/layout.styled";

interface ServiceFilter {
  id: string;
  title: string;
  color: string;
  visible: boolean;
}

function PartCalendarInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partId = searchParams.get("partId");

  const [partInfo, setPartInfo] = useState<{ name: string } | null>(null);
  const [phases, setPhases] = useState<PartCalendarPhase[]>([]);
  const [services, setServices] = useState<ScheduleServiceData[]>([]);
  const [serviceFilters, setServiceFilters] = useState<ServiceFilter[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showWeekend, setShowWeekend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewDate, setPreviewDate] = useState<Date | null>(null);
  const [issues, setIssues] = useState<ScheduleIssue[]>([]);

  const loadData = useCallback(async () => {
    if (!partId) return;
    try {
      // 파트 정보 로딩
      const store = await API.fetchScheduleStore();
      const part = store.parts.find((p) => p.id === partId);
      if (part) setPartInfo({ name: part.name });

      // 모든 서비스의 단계 로딩
      const { phases: allPhases, services: allServices } =
        await API.fetchPartAllPhases(partId);
      setPhases(allPhases);
      setServices(allServices);

      // 이슈 로딩
      API.fetchPartIssues(partId).then(setIssues).catch(() => {});

      // 서비스 필터 초기화 (각 서비스별 대표 색상)
      const colorPalette = [
        "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
        "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
      ];
      setServiceFilters(
        allServices.map((svc, idx) => ({
          id: svc.id,
          title: svc.title,
          color: colorPalette[idx % colorPalette.length],
          visible: true,
        })),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [partId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleService = (serviceId: string) => {
    setServiceFilters((prev) =>
      prev.map((f) =>
        f.id === serviceId ? { ...f, visible: !f.visible } : f,
      ),
    );
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
            }).catch(() => loadData());
            return { ...t, startDate: updatedStart, endDate: updatedEnd };
          }),
        };
      }),
    );
  };

  // 서비스 필터 적용
  const visiblePhases = useMemo(() => {
    const visibleServiceIds = new Set(
      serviceFilters.filter((f) => f.visible).map((f) => f.id),
    );
    return phases.filter(
      (p) => visibleServiceIds.has(p.serviceId) && !p.isHidden,
    );
  }, [phases, serviceFilters]);

  // 미리보기 태스크
  const previewTasks = useMemo(() => {
    if (!previewDate) return [];
    const dayStart = startOfDay(previewDate);
    const tasks: { phaseName: string; serviceTitle: string; color: string; title: string }[] = [];
    visiblePhases.forEach((phase) => {
      phase.tasks.forEach((t) => {
        if (t.isCompleted) return;
        if (
          isWithinInterval(dayStart, {
            start: startOfDay(t.startDate),
            end: endOfDay(t.endDate),
          })
        ) {
          tasks.push({
            phaseName: phase.phaseName,
            serviceTitle: phase.serviceTitle,
            color: phase.color,
            title: t.title,
          });
        }
      });
    });
    return tasks;
  }, [previewDate, visiblePhases]);

  if (!partId) {
    return <StLoadingWrapper>파트를 찾을 수 없습니다.</StLoadingWrapper>;
  }

  if (loading) {
    return (
      <StFixedContainer>
        <StLoadingWrapper>로딩 중... ⏳</StLoadingWrapper>
      </StFixedContainer>
    );
  }

  return (
    <StFixedContainer>
      {/* 헤더 */}
      <StTopBar>
        <div className="left-group">
          <Link
            href={`/schedule?workspaceId=${partId}`}
            className="back-link"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 19L8 12L15 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <h1 className="page-title">
            {partInfo?.name || "파트"} — 통합 캘린더
          </h1>
        </div>
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
        {/* 왼쪽: 캘린더 */}
        <StLeftSection>
          <LeftCalendar
            currentDate={currentDate}
            schedules={visiblePhases}
            showWeekend={showWeekend}
            onMonthChange={setCurrentDate}
            onTaskMove={handleTaskMove}
            onDayPreview={(day) =>
              setPreviewDate((prev) =>
                prev && format(prev, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
                  ? null
                  : day,
              )
            }
          />
        </StLeftSection>

        {/* 오른쪽: 서비스 필터 패널 */}
        <StRightPanel>
          <StPanelTitle>서비스 필터</StPanelTitle>
          <StFilterList>
            {serviceFilters.map((f) => (
              <StFilterItem
                key={f.id}
                $active={f.visible}
                $color={f.color}
                onClick={() => handleToggleService(f.id)}
              >
                <StFilterDot $color={f.color} $active={f.visible} />
                <StFilterName $active={f.visible}>{f.title}</StFilterName>
                <StFilterCount>
                  {phases.filter((p) => p.serviceId === f.id && !p.isCompleted).length}개 단계
                </StFilterCount>
              </StFilterItem>
            ))}
            {serviceFilters.length === 0 && (
              <StEmptyFilter>등록된 서비스가 없습니다.</StEmptyFilter>
            )}
          </StFilterList>

          <StDivider />

          <StPanelTitle>서비스 바로가기</StPanelTitle>
          <StServiceLinks>
            {services.map((svc) => (
              <StServiceLink
                key={svc.id}
                onClick={() => router.push(`/schedule/${svc.id}`)}
              >
                {svc.title}
                <span>→</span>
              </StServiceLink>
            ))}
          </StServiceLinks>

          {/* 이슈 섹션 */}
          {issues.filter((i) => i.status !== "resolved").length > 0 && (
            <>
              <StDivider />
              <StPanelTitle>
                활성 이슈
                <StIssueBadge>
                  {issues.filter((i) => i.status !== "resolved").length}
                </StIssueBadge>
              </StPanelTitle>
              <StIssueList>
                {issues
                  .filter((i) => i.status !== "resolved")
                  .sort((a, b) => {
                    const order = { blocker: 0, warning: 1, normal: 2 };
                    return order[a.severity] - order[b.severity];
                  })
                  .map((issue) => {
                    const svc = services.find((s) => s.id === issue.serviceId);
                    return (
                      <StIssueItem key={issue.id} $severity={issue.severity}>
                        <StIssueSeverityDot $severity={issue.severity} />
                        <div>
                          <StIssueServiceName>{svc?.title || "알 수 없음"}</StIssueServiceName>
                          <StIssueTitle>{issue.title}</StIssueTitle>
                        </div>
                      </StIssueItem>
                    );
                  })}
              </StIssueList>
            </>
          )}
        </StRightPanel>
      </StContentWrapper>

      {/* 날짜 미리보기 */}
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
                    <StPreviewSvc>{t.serviceTitle} · {t.phaseName}</StPreviewSvc>
                    <StPreviewTitle>{t.title}</StPreviewTitle>
                  </div>
                </StPreviewItem>
              ))}
            </StPreviewList>
          )}
        </StDayPreview>
      )}
    </StFixedContainer>
  );
}

export default function PartCalendarPage() {
  return (
    <Suspense fallback={<StLoadingWrapper>로딩 중... ⏳</StLoadingWrapper>}>
      <PartCalendarInner />
    </Suspense>
  );
}

// ── Styled Components ──

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
  background-color: ${({ theme }) => theme.colors.gray100};
  overflow: hidden;
`;

const StTopBar = styled.header`
  min-height: 60px;
  background-color: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
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
      color: ${({ theme }) => theme.colors.gray500};
      &:hover { color: ${({ theme }) => theme.colors.gray900}; }
    }
    .page-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: ${({ theme }) => theme.colors.gray900};
    }
  }

  @media (max-width: 767px) {
    flex-direction: column;
    padding: 0.75rem 1rem;
    gap: 0.5rem;
    align-items: flex-start;
  }
`;

const StControls = styled.div`
  display: flex;
  align-items: center;
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
  color: ${({ theme }) => theme.colors.gray700};
  input {
    accent-color: ${({ theme }) => theme.colors.gray900};
    width: 16px;
    height: 16px;
  }
`;

const StContentWrapper = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;

  @media (max-width: 767px) {
    flex-direction: column;
    overflow: auto;
  }
`;

const StLeftSection = styled.div`
  flex: 3;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${({ theme }) => theme.colors.gray200};

  @media (max-width: 767px) {
    flex: none;
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
  }
`;

const StRightPanel = styled.div`
  flex: 1;
  min-width: 300px;
  max-width: 380px;
  background: ${({ theme }) => theme.colors.white};
  overflow-y: auto;
  padding: 1.5rem;
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.02);

  @media (max-width: 767px) {
    flex: none;
    min-width: 100%;
    max-width: 100%;
    box-shadow: none;
  }
`;

const StPanelTitle = styled.h3`
  font-size: 0.85rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray500};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
`;

const StFilterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StFilterItem = styled.button<{ $active: boolean; $color: string }>`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.6rem;
  border: 1px solid ${({ $active, $color }) => ($active ? `${$color}40` : "#e5e7eb")};
  background: ${({ $active, $color }) => ($active ? `${$color}08` : "#f9fafb")};
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;

  &:hover {
    border-color: ${({ $color }) => $color};
  }
`;

const StFilterDot = styled.div<{ $color: string; $active: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $active, $color, theme }) => ($active ? $color : theme.colors.gray300)};
  flex-shrink: 0;
`;

const StFilterName = styled.span<{ $active: boolean }>`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${({ $active, theme }) => ($active ? theme.colors.gray700 : theme.colors.gray400)};
  flex: 1;
`;

const StFilterCount = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 600;
`;

const StEmptyFilter = styled.div`
  padding: 1rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.gray400};
  font-size: 0.85rem;
`;

const StDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.gray100};
  margin: 1.25rem 0;
`;

const StServiceLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const StServiceLink = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.55rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray700};
  transition: all 0.2s;

  span {
    color: ${({ theme }) => theme.colors.gray400};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.blue500};
    color: ${({ theme }) => theme.colors.blue500};
    span { color: ${({ theme }) => theme.colors.blue500}; }
  }
`;

// ── 이슈 ──

const StIssueBadge = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.rose500};
  background: ${({ theme }) => theme.colors.rose50};
  padding: 1px 7px;
  border-radius: 9999px;
  margin-left: 6px;
`;

const StIssueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const StIssueItem = styled.div<{ $severity: string }>`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  border-radius: 0.5rem;
  background: ${({ $severity, theme }) => $severity === "blocker" ? theme.colors.rose50 : $severity === "warning" ? theme.colors.amber50 : theme.colors.gray50};
  border: 1px solid ${({ $severity, theme }) => $severity === "blocker" ? theme.colors.rose200 : $severity === "warning" ? theme.colors.amber200 : theme.colors.gray200};
`;

const StIssueSeverityDot = styled.div<{ $severity: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
  background: ${({ $severity, theme }) => $severity === "blocker" ? theme.colors.rose500 : $severity === "warning" ? theme.colors.amber500 : theme.colors.green500};
`;

const StIssueServiceName = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StIssueTitle = styled.div`
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray700};
`;

// ── 미리보기 ──

const StDayPreview = styled.div`
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  width: 340px;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 1rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border: 1px solid ${({ theme }) => theme.colors.gray200};
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
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StPreviewClose = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.gray400};
  cursor: pointer;
  font-size: 0.9rem;
  padding: 2px 6px;
  border-radius: 4px;
  &:hover {
    background: ${({ theme }) => theme.colors.gray100};
    color: ${({ theme }) => theme.colors.gray700};
  }
`;

const StPreviewEmpty = styled.p`
  padding: 1.25rem 1rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.gray400};
  font-size: 0.85rem;
`;

const StPreviewList = styled.div`
  max-height: 240px;
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
  color: ${({ theme }) => theme.colors.gray400};
`;

const StPreviewTitle = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray700};
`;
