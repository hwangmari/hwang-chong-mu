"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ServiceSchedule } from "@/types/work-schedule";
import { fetchServices } from "../../services/schedule";

export default function ScheduleListPage() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // 데이터 불러오기
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchServices();
      setServices(data);
    } catch (e) {
      console.error("Failed to load services", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StContainer>
        <StLoadingWrapper>로딩 중... ⏳</StLoadingWrapper>
      </StContainer>
    );
  }

  return (
    <StContainer>
      <StHeader>
        <div className="text-group">
          <h1>📅 일정 관리 </h1>
          <p>관리할 프로젝트를 선택하거나 새로 만들어보세요.</p>
        </div>
        <Link href="/schedule/create">
          <StCreateButton>+ 새 일정 관리 만들기</StCreateButton>
        </Link>
      </StHeader>

      <StGrid>
        {services.map((svc) => (
          <StServiceCard
            key={svc.id}
            $color={svc.color}
            onClick={() => router.push(`/schedule/${svc.id}`)}
          >
            <div className="card-header">
              <StColorDot $color={svc.color} />
              <h3>{svc.serviceName}</h3>
            </div>
            <p className="desc">프로젝트 일정 관리</p>
            <div className="footer">
              <span>바로가기 →</span>
            </div>
          </StServiceCard>
        ))}

        {services.length === 0 && (
          <StEmptyCard>
            <p>아직 등록된 일정이 없습니다.</p>
            <Link href="/schedule/create">시작하기</Link>
          </StEmptyCard>
        )}
      </StGrid>
    </StContainer>
  );
}

// ... 스타일 코드는 기존과 동일 ...
const StContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
`;
const StHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f3f4f6;
  .text-group {
    h1 {
      font-size: 1.75rem;
      font-weight: 800;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    p {
      color: #6b7280;
      font-size: 0.95rem;
    }
  }
`;
const StCreateButton = styled.button`
  background-color: #111827;
  color: white;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s;
  &:hover {
    background-color: #000;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;
const StGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;
const StServiceCard = styled.div<{ $color: string }>`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  &:hover {
    border-color: ${({ $color }) => $color};
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    h3 {
      color: ${({ $color }) => $color};
    }
  }
  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 0.75rem;
    h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1f2937;
      transition: color 0.2s;
    }
  }
  .desc {
    color: #4b5563;
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 2rem;
    min-height: 2.7rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .footer {
    display: flex;
    justify-content: flex-end;
    font-size: 0.75rem;
    color: #9ca3af;
  }
`;
const StColorDot = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
`;
const StEmptyCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #e5e7eb;
  border-radius: 16px;
  padding: 2rem;
  color: #9ca3af;
  gap: 0.5rem;
  a {
    color: #3b82f6;
    font-weight: 600;
    text-decoration: underline;
  }
`;
const StLoadingWrapper = styled.div`
  min-height: 50vh;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  color: #9ca3af;
  font-weight: 600;
`;
