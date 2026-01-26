"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchBoards, updateBoard, deleteBoard } from "@/services/schedule";
import { StLoadingWrapper } from "@/components/styled/layout.styled";
import ServiceCard from "./components/ServiceCard";
// ✨ 분리된 컴포넌트 import

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

  // 현재 편집 중인 카드 ID (하나만 편집 가능하도록)
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchBoards();
      setBoards(data);
    } catch (e) {
      console.error("Failed to load boards", e);
    } finally {
      setLoading(false);
    }
  };

  // --- 핸들러 (상태 관리 & API 호출) ---

  const handleUpdate = async (
    boardId: string,
    title: string,
    description: string,
  ) => {
    try {
      await updateBoard(boardId, { title, description });

      setBoards((prev) =>
        prev.map((b) => (b.id === boardId ? { ...b, title, description } : b)),
      );
      setEditingId(null); // 편집 종료
    } catch (error) {
      console.error(error);
      alert("수정 실패");
    }
  };

  const handleDelete = async (boardId: string) => {
    if (
      !confirm(
        "정말 이 보드를 삭제하시겠습니까?\n포함된 모든 일정이 삭제됩니다.",
      )
    )
      return;
    try {
      await deleteBoard(boardId);
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
    } catch (error) {
      console.error(error);
      alert("삭제 실패");
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
          <ServiceCard
            key={board.id}
            board={board}
            isEditing={editingId === board.id}
            onEnter={() => router.push(`/schedule/${board.id}`)}
            onStartEdit={() => setEditingId(board.id)}
            onCancelEdit={() => setEditingId(null)}
            onSave={handleUpdate}
            onDelete={handleDelete}
          />
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

// --- 스타일 (StServiceCard 등은 삭제됨) ---

const StContainer = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
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
