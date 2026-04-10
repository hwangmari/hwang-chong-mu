"use client";

import Link from "next/link";
import styled from "styled-components";

export interface MemberFilter {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

interface ScheduleHeaderProps {
  title: string;
  showWeekend: boolean;
  onToggleWeekend: (checked: boolean) => void;
  boardId: string;
  memberFilters?: MemberFilter[];
  onToggleMember?: (memberId: string) => void;
}

export default function ScheduleHeader({
  title,
  showWeekend,
  onToggleWeekend,
  boardId,
  memberFilters,
  onToggleMember,
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
        {memberFilters && memberFilters.length > 0 && onToggleMember && (
          <>
            <StMemberFilters>
              {memberFilters.map((m) => (
                <StMemberChip
                  key={m.id}
                  $active={m.visible}
                  $color={m.color}
                  onClick={() => onToggleMember(m.id)}
                >
                  <StMemberDot $color={m.color} $active={m.visible} />
                  {m.name}
                </StMemberChip>
              ))}
            </StMemberFilters>
            <StDivider />
          </>
        )}

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

const StTopBar = styled.header`
  min-height: 60px;
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
    min-width: 0;
    .back-link {
      display: inline-flex;
      align-items: center;
      color: #6b7280;
      flex-shrink: 0;
      &:hover {
        color: #111827;
      }
    }
    .page-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  @media (max-width: 767px) {
    flex-direction: column;
    padding: 0.75rem 1rem;
    gap: 0.5rem;
    align-items: flex-start;
  }
`;

const StControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 767px) {
    gap: 0.5rem;
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

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

const StMemberFilters = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

const StMemberChip = styled.button<{ $active: boolean; $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 700;
  border: 1px solid ${({ $active, $color }) => ($active ? $color : "#e5e7eb")};
  background: ${({ $active, $color }) => ($active ? `${$color}12` : "#f9fafb")};
  color: ${({ $active, $color }) => ($active ? $color : "#9ca3af")};
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: ${({ $color }) => $color};
    opacity: 0.85;
  }
`;

const StMemberDot = styled.div<{ $color: string; $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $active, $color }) => ($active ? $color : "#d1d5db")};
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
