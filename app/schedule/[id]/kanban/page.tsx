"use client";

import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import { useRouter, useParams } from "next/navigation";
import * as API from "@/services/schedule";
import { SchedulePhase } from "@/types/work-schedule";
import KanbanColumn from "../../components/Kanban/KanbanColumn";


export default function KanbanPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;

  const [schedules, setSchedules] = useState<SchedulePhase[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const initData = async () => {
    try {
      const svcData = await API.getServiceData(boardId);
      if (svcData && svcData.phases) setSchedules(svcData.phases);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, [boardId]);

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      await API.createPhase(boardId, newProjectName, "", "#3b82f6");
      setNewProjectName("");
      setIsAdding(false);
      initData();
    } catch (err) {
      alert("단계 생성 실패");
    }
  };

  const columns = useMemo(() => {
    const safeSchedules = Array.isArray(schedules) ? schedules : [];
    return {
      todo: safeSchedules.filter(
        (s) => !s.isCompleted && (!s.tasks || s.tasks.length === 0),
      ),
      inProgress: safeSchedules.filter(
        (s) => !s.isCompleted && (s.tasks?.length ?? 0) > 0,
      ),
      done: safeSchedules.filter((s) => s.isCompleted),
    };
  }, [schedules]);

  if (loading)
    return (
      <StLoading>
        <div className="spinner" />
        데이터 불러오는 중...
      </StLoading>
    );

  return (
    <StKanbanWrapper>
      <header className="kanban-header">
        <div className="header-content">
          <div>
            <h2>📊 단계별 진행 현황</h2>
            <p>단계명이나 세부 일정을 클릭하여 바로 수정하세요.</p>
          </div>
          <button
            className="back-btn"
            onClick={() => router.push(`/schedule/${boardId}`)}
          >
            📅 일정 뷰로 돌아가기
          </button>
        </div>
      </header>

      <StBoard>
        {/* 1. To-Do Column (커스텀 버튼 & 폼 포함) */}
        <KanbanColumn
          title="To-Do (대기)"
          count={columns.todo.length}
          items={columns.todo}
          boardId={boardId}
          refresh={initData}
          color="#9ca3af"
          actionButton={
            <StAddButton
              onClick={() => setIsAdding(true)}
              title="새 프로젝트 추가"
            >
              +
            </StAddButton>
          }
        >
          {/* ✨ 리스트 상단 입력 폼 (children으로 전달) */}
          {isAdding && (
            <StAddForm>
              <input
                autoFocus
                placeholder="단계명..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddProject()}
              />
              <div className="btns">
                <button onClick={handleAddProject}>확인</button>
                <button onClick={() => setIsAdding(false)}>취소</button>
              </div>
            </StAddForm>
          )}
        </KanbanColumn>

        {/* 2. In Progress Column */}
        <KanbanColumn
          title="In Progress (수행)"
          count={columns.inProgress.length}
          items={columns.inProgress}
          boardId={boardId}
          refresh={initData}
          color="#3b82f6"
        />

        {/* 3. Done Column */}
        <KanbanColumn
          title="Done (완료)"
          count={columns.done.length}
          items={columns.done}
          boardId={boardId}
          refresh={initData}
          color="#10b981"
        />
      </StBoard>
    </StKanbanWrapper>
  );
}


const StKanbanWrapper = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 100;
  background: ${({ theme }) => theme.colors.gray50};
  min-height: 100vh;
  overflow: auto;
  .kanban-header {
    padding: 2rem;
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
  .back-btn {
    padding: 8px 16px;
    background: ${({ theme }) => theme.colors.white};
    border: 1px solid ${({ theme }) => theme.colors.gray200};
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: 0.2s;
    &:hover {
      background: ${({ theme }) => theme.colors.gray100};
    }
  }
`;

const StBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  align-items: start;
  padding: 0 2rem 1rem;
`;

const StAddButton = styled.button`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: ${({ theme }) => theme.colors.blue500};
  color: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
  &:hover {
    background: ${({ theme }) => theme.colors.blue600};
    transform: scale(1.1);
  }
`;

const StAddForm = styled.div`
  background: ${({ theme }) => theme.colors.white};
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  input {
    width: 100%;
    padding: 8px;
    border: 1px solid ${({ theme }) => theme.colors.gray200};
    border-radius: 4px;
    margin-bottom: 8px;
    font-size: 0.9rem;
  }
  .btns {
    display: flex;
    gap: 4px;
    button {
      flex: 1;
      padding: 6px;
      cursor: pointer;
      border-radius: 4px;
      border: 1px solid ${({ theme }) => theme.colors.gray200};
      background: ${({ theme }) => theme.colors.white};
      font-size: 0.85rem;
      &:hover {
        background: ${({ theme }) => theme.colors.gray50};
      }
      &:first-child {
        background: ${({ theme }) => theme.colors.blue500};
        color: ${({ theme }) => theme.colors.white};
        border-color: ${({ theme }) => theme.colors.blue500};
        &:hover {
          background: ${({ theme }) => theme.colors.blue600};
        }
      }
    }
  }
`;

const StLoading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;
