"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { format } from "date-fns";
import * as API from "@/services/schedule";
import { TaskPhase } from "@/types/work-schedule";

interface TaskItemProps {
  task: TaskPhase;
  refresh: () => void;
}

export default function TaskItem({ task, refresh }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [start, setStart] = useState(
    format(new Date(task.startDate), "yyyy-MM-dd"),
  );
  const [end, setEnd] = useState(format(new Date(task.endDate), "yyyy-MM-dd"));

  const handleUpdate = async () => {
    try {
      await API.updateTask(task.id, {
        title,
        startDate: new Date(start),
        endDate: new Date(end),
      });
      setIsEditing(false);
      refresh();
    } catch (e) {
      alert("일정 수정 실패");
    }
  };

  const handleDelete = async () => {
    if (!confirm("이 일정을 삭제할까요?")) return;
    try {
      await API.deleteTask(task.id);
      refresh();
    } catch (e) {
      alert("삭제 실패");
    }
  };

  if (isEditing) {
    return (
      <StEditForm>
        <input
          className="edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <div className="date-row">
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <span>~</span>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <div className="btn-row">
          <button className="save" onClick={handleUpdate}>
            저장
          </button>
          <button className="cancel" onClick={() => setIsEditing(false)}>
            취소
          </button>
          <button className="delete" onClick={handleDelete}>
            🗑️
          </button>
        </div>
      </StEditForm>
    );
  }

  return (
    <StItem onClick={() => setIsEditing(true)} title="클릭해서 수정">
      • <span className="task-title">{task.title}</span>
      <small>
        ({format(task.startDate, "MM.dd")}~{format(task.endDate, "MM.dd")})
      </small>
    </StItem>
  );
}

const StItem = styled.div`
  padding: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background-color: ${({ theme }) => theme.colors.gray100};
    color: ${({ theme }) => theme.colors.gray900};
  }
  .task-title {
    font-weight: 500;
    margin-right: 4px;
  }
  small {
    color: ${({ theme }) => theme.colors.gray400};
  }
`;

const StEditForm = styled.div`
  background: ${({ theme }) => theme.colors.gray50};
  padding: 8px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  margin-bottom: 6px;
  .edit-title {
    width: 100%;
    padding: 4px;
    font-size: 0.85rem;
    border: 1px solid ${({ theme }) => theme.colors.gray300};
    border-radius: 4px;
    margin-bottom: 4px;
  }
  .date-row {
    display: flex;
    gap: 4px;
    margin-bottom: 6px;
    input {
      flex: 1;
      padding: 2px;
      font-size: 0.75rem;
      border: 1px solid ${({ theme }) => theme.colors.gray300};
      border-radius: 4px;
    }
    span {
      font-size: 0.8rem;
      color: ${({ theme }) => theme.colors.gray500};
    }
  }
  .btn-row {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
    button {
      padding: 2px 8px;
      font-size: 0.75rem;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid transparent;
    }
    .save {
      background: ${({ theme }) => theme.colors.blue500};
      color: ${({ theme }) => theme.colors.white};
    }
    .cancel {
      background: ${({ theme }) => theme.colors.white};
      border-color: ${({ theme }) => theme.colors.gray300};
    }
    .delete {
      background: ${({ theme }) => theme.colors.rose100};
      color: ${({ theme }) => theme.colors.rose500};
      margin-left: auto;
    }
  }
`;
