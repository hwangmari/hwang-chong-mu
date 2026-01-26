"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import Link from "next/link";
import { useRouter } from "next/navigation";
// ✨ [수정] fetchBoards import
import { fetchBoards } from "@/services/schedule";
import { StLoadingWrapper } from "@/components/styled/layout.styled";

// 보드 타입 정의 (간단하게)
type ScheduleBoard = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
};

export default function ScheduleListPage() {
  const router = useRouter();
  const [boards, setBoards] = useState<ScheduleBoard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // ✨ [수정] 보드 목록 가져오기
      const data = await fetchBoards();
      setBoards(data);
    } catch (e) {
      console.error("Failed to load boards", e);
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
          <h1>📅 내 일정관리 보드</h1>
          <p>관리할 대시보드를 선택하거나 새로 만들어보세요.</p>
        </div>
        <Link href="/schedule/create">
          <StCreateButton>+ 새 일정관리 만들기</StCreateButton>
        </Link>
      </StHeader>

      <StGrid>
        {boards.map((board) => (
          <StServiceCard
            key={board.id}
            $color="#111827" // 보드는 기본 검정색 테마
            onClick={() => router.push(`/schedule/${board.id}`)}
          >
            <div className="card-header">
              <StColorDot $color="#3b82f6" />
              <h3>{board.title}</h3>
            </div>
            <p className="desc">{board.description || "설명 없음"}</p>
            <div className="footer">
              <span>입장하기 →</span>
            </div>
          </StServiceCard>
        ))}

        {boards.length === 0 && (
          <StEmptyCard>
            <p>아직 생성된 일정관리 보드가 없습니다.</p>
            <Link href="/schedule/create">새로 만들기</Link>
          </StEmptyCard>
        )}
      </StGrid>
    </StContainer>
  );
}

// ... 스타일 코드는 그대로 두셔도 됩니다 ...
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
