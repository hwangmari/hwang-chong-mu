"use client";

import Link from "next/link";
import styled from "styled-components";

interface ScheduleHeaderProps {
  title: string;
  showWeekend: boolean;
  onToggleWeekend: (checked: boolean) => void;
  boardId: string; // ✨ 추가: 링크 이동을 위해 필요
}

export default function ScheduleHeader({
  title,
  showWeekend,
  onToggleWeekend,
  boardId,
}: ScheduleHeaderProps) {
  return (
    <StTopBar>
      <div className="left-group">
        <Link href="/schedule" className="back-link">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 19L8 12L15 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="page-title">{title}</h1>
      </div>

      <StControls>
        {/* ✨ 칸반 이동 버튼 추가 */}
        <Link href={`/schedule/${boardId}/kanban`} passHref>
          <StKanbanLink>📊 칸반보드</StKanbanLink>
        </Link>

        <StDivider />

        <StSwitchLabel>
          <input
            type="checkbox"
            checked={showWeekend}
            onChange={(e) => onToggleWeekend(e.target.checked)}
          />
          주말 포함
        </StSwitchLabel>
      </StControls>
    </StTopBar>
  );
}

// --- 스타일 정의 ---

const StTopBar = styled.header`
  height: 60px;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  flex-shrink: 0;

  .left-group {
    display: flex;
    align-items: center;
    gap: 1rem;
    .back-link {
      display: inline-flex;
      align-items: center;
      color: #6b7280;
      &:hover {
        color: #111827;
      }
    }
    .page-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #111827;
    }
  }
`;

const StControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

// ✨ 칸반 버튼 스타일
const StKanbanLink = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: #3b82f6;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 6px 12px;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background-color: #dbeafe;
    transform: translateY(-1px);
  }
`;

const StDivider = styled.div`
  width: 1px;
  height: 24px;
  background-color: #e5e7eb;
`;

const StSwitchLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  user-select: none;
  color: #374151;
  input {
    accent-color: #111827;
    width: 16px;
    height: 16px;
  }
`;
