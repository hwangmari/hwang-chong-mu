// components/habit/TodoList.tsx
import { useState } from "react";
import styled from "styled-components";
import { format } from "date-fns";
import { GoalItem } from "./useMonthlyTracker";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import AddIcon from "@mui/icons-material/Add";

// 🎨 농도 조절 헬퍼 (중복이지만 간단하니까 여기도 둠)
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface Props {
  selectedDate: Date;
  items: GoalItem[];
  completedIds: number[];
  themeColor: string;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onAdd: (title: string) => void;
}

export default function TodoList({
  selectedDate,
  items,
  completedIds,
  themeColor,
  onToggle,
  onDelete,
  onAdd,
}: Props) {
  const [newItemTitle, setNewItemTitle] = useState("");

  const handleAdd = () => {
    onAdd(newItemTitle);
    setNewItemTitle("");
  };

  const completionRate = Math.round(
    (completedIds.length / (items.length || 1)) * 100
  );

  return (
    <StDailySection>
      <StDailyTitle>
        <span>📅 {format(selectedDate, "M월 d일")}</span>
        <StProgressBadge $color={themeColor}>{completionRate}%</StProgressBadge>
      </StDailyTitle>

      <StTodoList>
        {items.map((item) => (
          <StTodoItem
            key={item.id}
            onClick={() => onToggle(item.id)}
            $done={completedIds.includes(item.id)}
            $activeColor={hexToRgba(themeColor, 0.15)}
          >
            <StCheckCircle
              $done={completedIds.includes(item.id)}
              $color={themeColor}
            >
              {completedIds.includes(item.id) ? (
                <CheckCircleIcon sx={{ fontSize: 20, color: themeColor }} />
              ) : (
                <RadioButtonUncheckedIcon
                  sx={{ fontSize: 20, color: "#d1d5db" }}
                />
              )}
            </StCheckCircle>
            <StTodoText
              $done={completedIds.includes(item.id)}
              $color={themeColor}
            >
              {item.title}
            </StTodoText>
            <StDeleteButton
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 20 }} />{" "}
              {/* ✅ 이모지 대신 아이콘 */}
            </StDeleteButton>
          </StTodoItem>
        ))}

        <StInputWrapper>
          <StInput
            placeholder="+ 새로운 목표 추가"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            $focusColor={themeColor}
          />
          <StAddButton
            onClick={handleAdd}
            disabled={!newItemTitle.trim()}
            $bgColor={themeColor}
          >
            <AddIcon sx={{ fontSize: 20, marginRight: "4px" }} /> 추가
          </StAddButton>
        </StInputWrapper>
      </StTodoList>
    </StDailySection>
  );
}

// ✨ 스타일 정의
const StDailySection = styled.div`
  border-top: 1px solid #f3f4f6;
  padding-top: 1.5rem;
`;
const StDailyTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-weight: 700;
  color: #374151;
`;
const StProgressBadge = styled.span<{ $color: string }>`
  background: #f8fafc;
  color: ${({ $color }) => $color};
  border: 1px solid ${({ $color }) => $color}40;
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 700;
`;
const StTodoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;
const StTodoItem = styled.div<{ $done: boolean; $activeColor: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${({ $done, $activeColor }) =>
    $done ? $activeColor : "#f9fafb"};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    filter: brightness(0.95);
  }
`;
const StCheckCircle = styled.div<{ $done: boolean; $color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid ${({ $done, $color }) => ($done ? $color : "#d1d5db")};
  background: ${({ $done, $color }) => ($done ? $color : "transparent")};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
`;
const StTodoText = styled.span<{ $done: boolean; $color: string }>`
  font-weight: 500;
  font-size: 0.95rem;
  color: ${({ $done, $color }) => ($done ? $color : "#4b5563")};
  text-decoration: ${({ $done }) => ($done ? "line-through" : "none")};
  flex: 1;
`;
const StDeleteButton = styled.button`
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  opacity: 0.3;
  padding: 4px;
  transition: opacity 0.2s;
  &:hover {
    opacity: 1;
  }
`;
const StInputWrapper = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 0.5rem;
`;
const StInput = styled.input<{ $focusColor: string }>`
  flex: 1;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 0.9rem;
  outline: none;
  &:focus {
    border-color: ${({ $focusColor }) => $focusColor};
  }
`;
const StAddButton = styled.button<{ $bgColor: string }>`
  background: ${({ $bgColor }) => $bgColor};
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0 1rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.9;
  }
  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
  }
`;
