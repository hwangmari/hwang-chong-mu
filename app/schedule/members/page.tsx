"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import Link from "next/link";

import * as API from "@/services/schedule";
import { MemberWorkload } from "@/types/work-schedule";
import { StLoadingWrapper } from "@/components/styled/layout.styled";

function MembersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partId = searchParams.get("partId");

  const [partName, setPartName] = useState("");
  const [workloads, setWorkloads] = useState<MemberWorkload[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!partId) return;
    try {
      const store = await API.fetchScheduleStore();
      const part = store.parts.find((p) => p.id === partId);
      if (part) setPartName(part.name);

      const data = await API.fetchMemberWorkloads(partId);
      setWorkloads(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [partId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!partId) {
    return <StLoadingWrapper>파트를 찾을 수 없습니다.</StLoadingWrapper>;
  }

  if (loading) {
    return (
      <StPage>
        <StLoadingWrapper>로딩 중... ⏳</StLoadingWrapper>
      </StPage>
    );
  }

  const totalMembers = workloads.length;
  const totalActive = workloads.reduce((sum, w) => sum + w.activeTasks, 0);
  const totalCompleted = workloads.reduce((sum, w) => sum + w.completedTasks, 0);

  return (
    <StPage>
      <StHeader>
        <div className="text-group">
          <Link href={`/schedule?workspaceId=${partId}`} className="back-link">
            ← 돌아가기
          </Link>
          <h1>👥 {partName} — 멤버 리소스</h1>
          <p>멤버별 투입 현황과 업무 부하를 확인합니다.</p>
        </div>
      </StHeader>

      {/* 요약 카드 */}
      <StSummaryRow>
        <StSummaryCard>
          <StSummaryValue>{totalMembers}</StSummaryValue>
          <StSummaryLabel>전체 멤버</StSummaryLabel>
        </StSummaryCard>
        <StSummaryCard>
          <StSummaryValue $color="#3b82f6">{totalActive}</StSummaryValue>
          <StSummaryLabel>진행 중 업무</StSummaryLabel>
        </StSummaryCard>
        <StSummaryCard>
          <StSummaryValue $color="#10b981">{totalCompleted}</StSummaryValue>
          <StSummaryLabel>완료 업무</StSummaryLabel>
        </StSummaryCard>
      </StSummaryRow>

      {/* 멤버 카드 리스트 */}
      <StMemberGrid>
        {workloads.map((w) => {
          const progressPct =
            w.totalTasks > 0
              ? Math.round((w.completedTasks / w.totalTasks) * 100)
              : 0;

          return (
            <StMemberCard key={w.user.id}>
              <StMemberHeader>
                <StAvatar>{w.user.name[0]}</StAvatar>
                <div>
                  <StMemberName>{w.user.name}</StMemberName>
                  <StMemberMeta>
                    {w.services.length}개 서비스 · {w.activeTasks}개 진행 중
                  </StMemberMeta>
                </div>
              </StMemberHeader>

              {/* 진행률 바 */}
              {w.totalTasks > 0 && (
                <StProgressSection>
                  <StProgressBar>
                    <StProgressFill $pct={progressPct} />
                  </StProgressBar>
                  <StProgressText>
                    {w.completedTasks}/{w.totalTasks} 완료 ({progressPct}%)
                  </StProgressText>
                </StProgressSection>
              )}

              {/* 서비스별 단계 */}
              {w.services.length > 0 ? (
                <StServiceList>
                  {w.services.map((svc) => (
                    <StServiceBlock key={svc.serviceId}>
                      <StServiceHeader
                        onClick={() => router.push(`/schedule/${svc.serviceId}`)}
                      >
                        {svc.serviceTitle}
                        <span className="arrow">→</span>
                      </StServiceHeader>
                      <StPhaseList>
                        {svc.phases.map((phase) => (
                          <StPhaseItem key={phase.phaseId}>
                            <StPhaseDot $color={phase.color} />
                            <StPhaseInfo>
                              <span className="name">{phase.phaseName}</span>
                              <span className="count">
                                {phase.activeTasks > 0 && (
                                  <StActiveCount>{phase.activeTasks} 진행</StActiveCount>
                                )}
                                {phase.completedTasks > 0 && (
                                  <StCompletedCount>{phase.completedTasks} 완료</StCompletedCount>
                                )}
                              </span>
                            </StPhaseInfo>
                          </StPhaseItem>
                        ))}
                      </StPhaseList>
                    </StServiceBlock>
                  ))}
                </StServiceList>
              ) : (
                <StNoWork>배정된 업무가 없습니다.</StNoWork>
              )}
            </StMemberCard>
          );
        })}

        {workloads.length === 0 && (
          <StEmpty>등록된 멤버가 없습니다.</StEmpty>
        )}
      </StMemberGrid>
    </StPage>
  );
}

export default function MembersPage() {
  return (
    <Suspense fallback={<StLoadingWrapper>로딩 중... ⏳</StLoadingWrapper>}>
      <MembersPageInner />
    </Suspense>
  );
}

// ── Styled Components ──

const StPage = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 2rem 1.5rem 3rem;
`;

const StHeader = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid ${({ theme }) => theme.colors.gray100};
  .text-group {
    .back-link {
      display: inline-block;
      color: ${({ theme }) => theme.colors.gray400};
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      margin-bottom: 0.5rem;
      &:hover { color: ${({ theme }) => theme.colors.blue600}; }
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 800;
      color: ${({ theme }) => theme.colors.gray900};
      margin-bottom: 0.25rem;
    }
    p {
      color: ${({ theme }) => theme.colors.gray500};
      font-size: 0.9rem;
    }
  }
`;

const StSummaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StSummaryCard = styled.div`
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 1rem;
  padding: 1.25rem;
  text-align: center;
`;

const StSummaryValue = styled.div<{ $color?: string }>`
  font-size: 2rem;
  font-weight: 800;
  color: ${({ $color, theme }) => $color || theme.colors.gray900};
`;

const StSummaryLabel = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray500};
  margin-top: 0.25rem;
`;

const StMemberGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.25rem;
`;

const StMemberCard = styled.div`
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
`;

const StMemberHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const StAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.gray900};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 800;
  flex-shrink: 0;
`;

const StMemberName = styled.div`
  font-size: 1.05rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StMemberMeta = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: 600;
`;

const StProgressSection = styled.div`
  margin-bottom: 1rem;
`;

const StProgressBar = styled.div`
  height: 6px;
  background: ${({ theme }) => theme.colors.gray100};
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
`;

const StProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ $pct }) =>
    $pct >= 80 ? "#10b981" : $pct >= 50 ? "#3b82f6" : "#f59e0b"};
  border-radius: 3px;
  transition: width 0.3s;
`;

const StProgressText = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: 600;
`;

const StServiceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const StServiceBlock = styled.div`
  background: ${({ theme }) => theme.colors.gray50};
  border-radius: 0.6rem;
  padding: 0.6rem;
`;

const StServiceHeader = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background: none;
  border: none;
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray700};
  cursor: pointer;
  padding: 0 0 0.4rem;
  .arrow {
    color: ${({ theme }) => theme.colors.gray400};
    font-size: 0.8rem;
  }
  &:hover {
    color: ${({ theme }) => theme.colors.blue600};
    .arrow { color: ${({ theme }) => theme.colors.blue600}; }
  }
`;

const StPhaseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StPhaseItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
`;

const StPhaseDot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const StPhaseInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  .name {
    font-size: 0.8rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray600};
  }
  .count {
    display: flex;
    gap: 6px;
  }
`;

const StActiveCount = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: #3b82f6;
  background: #eff6ff;
  padding: 1px 6px;
  border-radius: 4px;
`;

const StCompletedCount = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: #10b981;
  background: #ecfdf5;
  padding: 1px 6px;
  border-radius: 4px;
`;

const StNoWork = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.gray400};
  font-size: 0.85rem;
  padding: 1rem 0;
`;

const StEmpty = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  color: ${({ theme }) => theme.colors.gray400};
  font-size: 0.9rem;
  padding: 3rem;
  border: 2px dashed ${({ theme }) => theme.colors.gray200};
  border-radius: 1rem;
`;
