/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import styled from "styled-components";
import { ServiceSchedule } from "@/types/work-schedule";
import KanbanCard from "./KanbanCard";

interface KanbanColumnProps {
  title: string;
  count: number;
  items: ServiceSchedule[];
  boardId: string;
  refresh: () => void;
  color: string;
  actionButton?: React.ReactNode; // 헤더 오른쪽에 넣을 버튼 (예: + 버튼)
  children?: React.ReactNode; // 리스트 상단에 넣을 콘텐츠 (예: 입력 폼)
}

export default function KanbanColumn({
  title,
  count,
  items,
  boardId,
  refresh,
  color,
  actionButton,
  children,
}: KanbanColumnProps) {
  return (
    <StColumn>
      <div
        className="column-header"
        style={{ borderTop: `4px solid ${color}` }}
      >
        <h3>
          {title} <span>{count}</span>
        </h3>
        {actionButton && <div className="action-area">{actionButton}</div>}
      </div>

      {/* 입력 폼 등이 들어갈 자리 */}
      {children}

      <div className="card-list">
        {items.map((svc) => (
          <KanbanCard
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

const StColumn = styled.div`
  background-color: #f3f4f6;
  border-radius: 12px;

  min-height: 600px;

  .column-header {
    position: sticky;
    top: 0;
    padding: 1rem;
    background-color: #f3f4f6;
    z-index: 100;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: 8px;

      span {
        color: #9ca3af;
        font-size: 0.9rem;
        font-weight: 500;
        background: #e5e7eb;
        padding: 2px 8px;
        border-radius: 12px;
      }
    }

    .action-area {
      display: flex;
      align-items: center;
    }
  }

  .card-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
  }
`;
