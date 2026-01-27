"use client";

import Link from "next/link";
import styled from "styled-components";

interface ScheduleHeaderProps {
  title: string;
  showWeekend: boolean;
  onToggleWeekend: (checked: boolean) => void;
}

export default function ScheduleHeader({
  title,
  showWeekend,
  onToggleWeekend,
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

// --- 스타일 정의 (페이지에서 가져옴) ---

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
      gap: 4px;
      color: #6b7280;
      transition: color 0.2s;
      &:hover {
        color: #111827;
      }
      svg {
        display: block;
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
  gap: 1rem;
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
