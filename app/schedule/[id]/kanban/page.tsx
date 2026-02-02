/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import { useRouter, useParams } from "next/navigation";
import * as API from "@/services/schedule";
import { ServiceSchedule } from "@/types/work-schedule";
import { format } from "date-fns";

export default function KanbanPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;

  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const initData = async () => {
    try {
      const boardData = await API.getBoardData(boardId);
      if (boardData && boardData.services) setSchedules(boardData.services);
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
      await API.createService(boardId, newProjectName, "", "#3b82f6");
      setNewProjectName("");
      setIsAdding(false);
      initData();
    } catch (err) {
      alert("생성 실패");
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
        데이터 분석 중...
      </StLoading>
    );

  return (
    <StKanbanWrapper>
      <header className="kanban-header">
        <div className="header-content">
          <div>
            <h2>📊 프로젝트 진행 현황</h2>
            <p>칸반에서 직접 프로젝트를 추가하고 관리하세요.</p>
          </div>
          <button
            className="back-btn"
            onClick={() => router.push(`/schedule/${boardId}`)}
          >
            📅 일정 뷰로 돌아가기
          </button>
        </div>
      </header>

      {/* ✨ 다시 돌아온 3단 레이아웃 보드 */}
      <StBoard>
        <StColumn>
          <div
            className="column-header"
            style={{ borderTop: `4px solid #9ca3af` }}
          >
            <h3>
              To-Do (대기) <span>{columns.todo.length}</span>
            </h3>
            <button
              className="add-project-btn"
              onClick={() => setIsAdding(true)}
            >
              +
            </button>
          </div>

          {isAdding && (
            <StAddForm>
              <input
                autoFocus
                placeholder="새 프로젝트 명..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddProject()}
              />
              <div className="btns">
                <button onClick={handleAddProject}>추가</button>
                <button onClick={() => setIsAdding(false)}>취소</button>
              </div>
            </StAddForm>
          )}

          <div className="card-list">
            {columns.todo.map((svc) => (
              <ProjectCard
                key={svc.id}
                svc={svc}
                boardId={boardId}
                refresh={initData}
              />
            ))}
          </div>
        </StColumn>

        <KanbanColumn
          title="In Progress (수행)"
          items={columns.inProgress}
          boardId={boardId}
          refresh={initData}
          color="#3b82f6"
        />
        <KanbanColumn
          title="Done (완료)"
          items={columns.done}
          boardId={boardId}
          refresh={initData}
          color="#10b981"
        />
      </StBoard>
    </StKanbanWrapper>
  );
}

function ProjectCard({ svc, boardId, refresh }: any) {
  const router = useRouter();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");

  const handleQuickAddTask = async () => {
    if (!taskTitle) return;
    try {
      await API.createTask(svc.id, {
        title: taskTitle,
        startDate: new Date(),
        endDate: new Date(),
      });
      setTaskTitle("");
      setShowQuickAdd(false);
      refresh();
    } catch (err) {
      alert("일정 추가 실패");
    }
  };

  return (
    <StProjectCard $color={svc.color}>
      <div className="card-top">
        <span className="dot" />
        <h4>{svc.serviceName}</h4>
      </div>

      {svc.tasks?.length > 0 && (
        <div className="task-mini-list">
          {svc.tasks.map((t: any) => (
            <div key={t.id} className="task-item">
              • {t.title} <small>({format(t.startDate, "MM.dd")})</small>
            </div>
          ))}
        </div>
      )}

      <div className="card-actions">
        <button
          className="main-btn"
          onClick={() =>
            router.push(`/schedule/${boardId}?highlightId=${svc.id}`)
          }
        >
          상세 편집
        </button>
        <button
          className="sub-btn"
          onClick={() => setShowQuickAdd(!showQuickAdd)}
        >
          {svc.tasks?.length > 0 ? "+ 일정" : "일정 잡기"}
        </button>
      </div>

      {showQuickAdd && (
        <StQuickAdd>
          <input
            placeholder="할 일..."
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuickAddTask()}
          />
          <button onClick={handleQuickAddTask}>확인</button>
        </StQuickAdd>
      )}
    </StProjectCard>
  );
}

function KanbanColumn({ title, items, boardId, refresh, color }: any) {
  return (
    <StColumn>
      <div
        className="column-header"
        style={{ borderTop: `4px solid ${color}` }}
      >
        <h3>
          {title} <span>{items.length}</span>
        </h3>
      </div>
      <div className="card-list">
        {items.map((svc: any) => (
          <ProjectCard
            key={svc.id}
            svc={svc}
            boardId={boardId}
            refresh={refresh}
          />
        ))}
      </div>
    </StColumn>
  );
}

// --- Styles ---

const StKanbanWrapper = styled.div`
  padding: 2rem;
  background: #f9fafb;
  min-height: 100vh;
  .kanban-header {
    margin-bottom: 2rem;
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
  .back-btn {
    padding: 8px 16px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }
`;

// ✨ 잃어버렸던 그 스타일!
const StBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  align-items: start;
`;

const StColumn = styled.div`
  background-color: #f3f4f6;
  border-radius: 12px;
  padding: 1rem;
  min-height: 600px;
  .column-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    margin-bottom: 1rem;
    h3 {
      font-size: 1.1rem;
      span {
        color: #9ca3af;
        font-size: 0.9rem;
        margin-left: 0.5rem;
      }
    }
    .add-project-btn {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: none;
      background: #3b82f6;
      color: white;
      cursor: pointer;
      font-size: 1.2rem;
    }
  }
  .card-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const StProjectCard = styled.div<{ $color: string }>`
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border-left: 5px solid ${(props) => props.$color};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  .card-top {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    h4 {
      font-size: 0.95rem;
      margin: 0;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${(props) => props.$color};
    }
  }
  .task-mini-list {
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 12px;
    .task-item {
      margin-bottom: 2px;
    }
  }
  .card-actions {
    display: flex;
    gap: 6px;
    button {
      flex: 1;
      padding: 6px;
      font-size: 0.8rem;
      border-radius: 4px;
      cursor: pointer;
    }
    .main-btn {
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
    }
    .sub-btn {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #3b82f6;
      font-weight: 600;
    }
  }
`;

const StAddForm = styled.div`
  background: white;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 1rem;
  input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 8px;
  }
  .btns {
    display: flex;
    gap: 4px;
    button {
      flex: 1;
      padding: 6px;
      cursor: pointer;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
  }
`;

const StQuickAdd = styled.div`
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #eee;
  display: flex;
  gap: 4px;
  input {
    flex: 1;
    font-size: 0.8rem;
    padding: 4px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  button {
    padding: 4px 8px;
    font-size: 0.8rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
`;

const StLoading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f4f6;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;
