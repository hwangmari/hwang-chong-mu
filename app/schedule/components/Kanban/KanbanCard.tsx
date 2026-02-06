"use client";

import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import * as API from "@/services/schedule";
import { ServiceSchedule } from "@/types/work-schedule";

import TaskItem from "./card/TaskItem";
import ColorPicker from "./card/ColorPicker";
import QuickAddForm from "./card/QuickAddForm";

interface KanbanCardProps {
  svc: ServiceSchedule;
  boardId: string;
  refresh: () => void;
}

export default function KanbanCard({ svc, boardId, refresh }: KanbanCardProps) {
  const router = useRouter();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(svc.serviceName);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const sortedTasks = useMemo(() => {
    if (!svc.tasks) return [];
    return [...svc.tasks].sort(
      (a: any, b: any) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
  }, [svc.tasks]);

  const handleNameUpdate = async () => {
    if (!editName.trim() || editName === svc.serviceName) {
      setIsEditingName(false);
      return;
    }
    try {
      await API.updateService(svc.id, { serviceName: editName });
      setIsEditingName(false);
      refresh();
    } catch (e) {
      alert("이름 수정 실패");
    }
  };

  const handleColorChange = async (newColor: string) => {
    try {
      await API.updateService(svc.id, { color: newColor });
      setShowColorPicker(false);
      refresh();
    } catch (e) {
      alert("색상 변경 실패");
    }
  };

  const handleAddTask = async (title: string, start: string, end: string) => {
    try {
      await API.createTask(svc.id, {
        title,
        startDate: new Date(start),
        endDate: new Date(end),
      });
      setShowQuickAdd(false);
      refresh();
    } catch (err) {
      alert("일정 추가 실패");
    }
  };

  return (
    <StKanbanCard $color={svc.color}>
      {/* 1. 상단 (이름 및 컬러) */}
      <div className="card-top">
        <div className="color-trigger-wrapper">
          <span
            className="dot"
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="색상 변경"
          />
          {showColorPicker && (
            <ColorPicker
              onSelect={handleColorChange}
              onClose={() => setShowColorPicker(false)}
            />
          )}
        </div>

        {isEditingName ? (
          <input
            className="name-edit-input"
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameUpdate}
            onKeyDown={(e) => e.key === "Enter" && handleNameUpdate()}
          />
        ) : (
          <h4 onClick={() => setIsEditingName(true)} title="클릭해서 이름 수정">
            {svc.serviceName}
          </h4>
        )}
      </div>

      {/* 2. 업무 리스트 (TaskItem 컴포넌트 반복) */}
      {sortedTasks.length > 0 && (
        <div className="task-mini-list">
          {sortedTasks.map((t: any) => (
            <TaskItem key={t.id} task={t} refresh={refresh} />
          ))}
        </div>
      )}

      {/* 3. 하단 액션 버튼 */}
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

      {/* 4. 빠른 추가 폼 (QuickAddForm 컴포넌트) */}
      {showQuickAdd && <QuickAddForm onConfirm={handleAddTask} />}
    </StKanbanCard>
  );
}

const StKanbanCard = styled.div<{ $color: string }>`
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border-left: 5px solid ${(props) => props.$color};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;

  .card-top {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    height: 28px;
    h4 {
      font-size: 0.95rem;
      margin: 0;
      cursor: pointer;
      border-bottom: 1px dashed transparent;
      &:hover {
        border-bottom-color: #ccc;
      }
    }
    .name-edit-input {
      font-size: 0.95rem;
      padding: 2px 4px;
      border: 1px solid #3b82f6;
      border-radius: 4px;
      outline: none;
      width: 100%;
      font-weight: 600;
    }
    .color-trigger-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: ${(props) => props.$color};
      cursor: pointer;
      transition: transform 0.2s;
      &:hover {
        transform: scale(1.2);
      }
    }
  }

  .task-mini-list {
    font-size: 0.85rem;
    color: #4b5563;
    margin-bottom: 12px;
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
