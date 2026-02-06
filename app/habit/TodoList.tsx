import { useState } from "react";
import styled from "styled-components";
import { format } from "date-fns";
import { GoalItem } from "./useMonthlyTracker"; //

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import AddIcon from "@mui/icons-material/Add";

/** 🎨 농도 조절 헬퍼 */
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

  onHoverItem: (id: number | null) => void;
}

export default function TodoList({
  selectedDate,
  items,
  completedIds,
  themeColor,
  onToggle,
  onDelete,
  onAdd,
  onHoverItem,
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📅 {format(selectedDate, "M월 d일")}</span>
          {/* 100% 달성 시 축하 이모지 보여주기 */}
          {completionRate === 100 && items.length > 0 && <span>🎉</span>}
        </div>

        {/* 기존 뱃지 스타일을 조금 더 심플하게 숫자만 표시 */}
        <StRateText $color={themeColor}>{completionRate}% 달성</StRateText>
      </StDailyTitle>
      {/* ✅ [추가] 시각적 만족감을 주는 게이지 바 */}
      <StProgressBarBg>
        <StProgressBarFill $width={completionRate} $color={themeColor} />
      </StProgressBarBg>
      <StTodoList>
        {items.map((item) => (
          <StTodoItem
            key={item.id}

            onMouseEnter={() => onHoverItem(item.id)}
            onMouseLeave={() => onHoverItem(null)}
            $done={completedIds.includes(item.id)}
            $activeColor={hexToRgba(themeColor, 0.15)}
          >
            {/* ✅ 체크박스 아이콘을 클릭했을 때만 토글되도록 변경 */}
            <StCheckCircle
              onClick={(e) => {
                e.stopPropagation(); // 이벤트가 부모로 퍼지는 것 방지
                onToggle(item.id);
              }}
              $done={completedIds.includes(item.id)}
              $color={themeColor}
            >
              {completedIds.includes(item.id) ? (
                <CheckCircleIcon sx={{ fontSize: 20, color: "white" }} />
              ) : (
                <RadioButtonUncheckedIcon sx={{ fontSize: 20 }} />
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
              <DeleteOutlineIcon sx={{ fontSize: 20 }} />
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
  /* cursor: pointer; -> 기존 포인터는 유지해도 좋지만, 텍스트 클릭 시 아무 일도 안 일어난다는 걸 알리기 위해 default로 바꿔도 됨 */
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
  cursor: pointer; /* ✅ 여기에 포인터 추가 (여기가 클릭 가능 영역임을 표시) */
  flex-shrink: 0; /* 아이콘 찌그러짐 방지 */
`;

const StTodoText = styled.span<{ $done: boolean; $color: string }>`
  font-weight: 500;
  font-size: 0.95rem;
  color: ${({ $done, $color }) => ($done ? $color : "#4b5563")};
  text-decoration: ${({ $done }) => ($done ? "line-through" : "none")};
  flex: 1;
  /* cursor: help; // 원한다면 텍스트에 마우스 올리면 '확인용'이라는 의미로 커서 변경 가능 */
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

const StRateText = styled.span<{ $color: string }>`
  font-size: 0.8rem;
  color: ${({ $color }) => $color};
  font-weight: 800;
`;

/** 🌑 게이지 배경 (회색 트랙) */
const StProgressBarBg = styled.div`
  width: 100%;
  height: 6px;
  background-color: #f1f5f9;
  border-radius: 3px;
  margin-bottom: 1.5rem; /* 리스트와의 간격 */
  overflow: hidden; /* 넘치는 부분 자르기 */
`;

/** 🌕 게이지 채움 (실제 퍼센트) */
const StProgressBarFill = styled.div<{ $width: number; $color: string }>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  background-color: ${({ $color }) => $color};
  border-radius: 3px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); /* 슥- 차오르는 애니메이션 */
`;
