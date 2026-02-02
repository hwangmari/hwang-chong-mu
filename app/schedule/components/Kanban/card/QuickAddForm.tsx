"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { format } from "date-fns";

interface QuickAddFormProps {
  onConfirm: (title: string, start: string, end: string) => void;
}

export default function QuickAddForm({ onConfirm }: QuickAddFormProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const handleSubmit = () => {
    if (!taskTitle.trim()) return;
    onConfirm(taskTitle, startDate, endDate);
    setTaskTitle(""); // 초기화
  };

  return (
    <StWrapper>
      <input
        className="title-input"
        placeholder="할 일 제목"
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
        autoFocus
      />
      <div className="date-row">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <span>~</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      <button onClick={handleSubmit}>확인</button>
    </StWrapper>
  );
}

const StWrapper = styled.div`
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #eee;
  display: flex;
  flex-direction: column;
  gap: 6px;
  .title-input {
    width: 100%;
    font-size: 0.85rem;
    padding: 6px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  .date-row {
    display: flex;
    align-items: center;
    gap: 4px;
    input {
      flex: 1;
      font-size: 0.75rem;
      padding: 4px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    span {
      color: #888;
      font-size: 0.8rem;
    }
  }
  button {
    width: 100%;
    padding: 6px;
    font-size: 0.8rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 4px;
  }
`;
