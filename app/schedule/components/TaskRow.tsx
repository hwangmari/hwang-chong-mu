/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from "react";
import styled, { css } from "styled-components";
import { format, parse, isValid } from "date-fns";
import { TaskPhase } from "@/types/work-schedule";

import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

interface TaskRowProps {
  task: TaskPhase;
  serviceId: string;
  onUpdate: (svcId: string, task: TaskPhase) => void;
  onDelete: (svcId: string, taskId: string) => void;
  isReadOnly?: boolean;
}

const MemoIcon = () => <ChatBubbleOutlineIcon fontSize="small" />;

export default function TaskRow({
  task,
  serviceId,
  onUpdate,
  onDelete,
  isReadOnly = false,
}: TaskRowProps) {
  // --- 상태 관리 ---
  const [textValue, setTextValue] = useState("");
  const [titleValue, setTitleValue] = useState(task.title);
  const [memoValue, setMemoValue] = useState(task.memo || "");
  const [showMemo, setShowMemo] = useState(!!task.memo);

  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();

  // --- 데이터 동기화 ---
  useEffect(() => {
    const startFmt = format(task.startDate, "yyyy.MM.dd");
    const endFmt = format(task.endDate, "yyyy.MM.dd");
    if (startFmt === endFmt) {
      setTextValue(startFmt);
    } else {
      setTextValue(`${startFmt}-${endFmt}`);
    }

    setTitleValue(task.title);
    setMemoValue(task.memo || "");
  }, [task]);

  // --- 핸들러 ---
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextValue(val);
    const numbersOnly = val.replace(/[^0-9]/g, "");

    if (numbersOnly.length === 8) {
      const date = parse(numbersOnly, "yyyyMMdd", new Date());
      if (isValid(date))
        onUpdate(serviceId, { ...task, startDate: date, endDate: date });
    } else if (numbersOnly.length === 16) {
      const start = parse(numbersOnly.substring(0, 8), "yyyyMMdd", new Date());
      const end = parse(numbersOnly.substring(8, 16), "yyyyMMdd", new Date());
      if (isValid(start) && isValid(end))
        onUpdate(serviceId, { ...task, startDate: start, endDate: end });
    }
  };

  const handleDateInput = (field: "startDate" | "endDate", val: string) => {
    if (!val) return;
    const newDate = new Date(val);
    onUpdate(serviceId, { ...task, [field]: newDate });
  };

  const handleTitleBlur = () => {
    if (titleValue !== task.title)
      onUpdate(serviceId, { ...task, title: titleValue });
  };

  const handleMemoBlur = () => {
    if (memoValue !== (task.memo || "")) {
      onUpdate(serviceId, { ...task, memo: memoValue });
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDisplayDateText = () => {
    const s = task.startDate;
    const e = task.endDate;
    const sYear = s.getFullYear();
    const eYear = e.getFullYear();

    const startStr =
      sYear === currentYear ? format(s, "MM.dd") : format(s, "yyyy.MM.dd");
    if (format(s, "yyyyMMdd") === format(e, "yyyyMMdd")) return startStr;

    let endStr = "";
    if (sYear === eYear) {
      endStr = format(e, "MM.dd");
    } else {
      endStr =
        eYear === currentYear ? format(e, "MM.dd") : format(e, "yyyy.MM.dd");
    }
    return `${startStr} ~ ${endStr}`;
  };

  return (
    <StTaskItem $isPast={isReadOnly}>
      {/* 1. 헤더 (제목 + 아이콘 + 삭제버튼) */}
      <div className="task-header">
        {isReadOnly ? (
          <div className="read-mode-header">
            <span className="task-title-text">{task.title}</span>
            {/* 보기 모드: 메모 있으면 아이콘 표시 */}
            {task.memo && (
              <button
                className="memo-icon-read active"
                onClick={() => setShowMemo(!showMemo)}
                title="메모 보기"
              >
                <MemoIcon />
              </button>
            )}
          </div>
        ) : (
          <>
            <input
              type="text"
              className="task-title-input"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="업무명"
            />
            {/* ✨ SVG 아이콘 버튼 */}
            <button
              className={`memo-toggle-btn ${memoValue ? "active" : ""}`}
              onClick={() => setShowMemo(!showMemo)}
              tabIndex={-1}
              title="이슈/메모 입력"
            >
              <MemoIcon />
            </button>
            <button
              className="delete-task-btn"
              onClick={() => onDelete(serviceId, task.id)}
            >
              ×
            </button>
          </>
        )}
      </div>

      {/* 2. 날짜 입력 */}
      <StDateInputWrapper>
        {isReadOnly ? (
          <span className="date-text-display">{getDisplayDateText()}</span>
        ) : (
          <>
            <input
              type="text"
              className="date-text-input"
              value={textValue}
              onChange={handleTextChange}
              placeholder="YYYY.MM.DD"
              maxLength={21}
            />
            <div className="calendar-popover-container" ref={calendarRef}>
              <button
                className="calendar-toggle-btn"
                onClick={() => setShowCalendar(!showCalendar)}
                tabIndex={-1}
              >
                📅
              </button>
              {showCalendar && (
                <StCalendarPopover>
                  <div className="popover-row">
                    <label>Start</label>
                    <input
                      type="date"
                      value={format(task.startDate, "yyyy-MM-dd")}
                      onChange={(e) =>
                        handleDateInput("startDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="popover-row">
                    <label>End</label>
                    <input
                      type="date"
                      value={format(task.endDate, "yyyy-MM-dd")}
                      onChange={(e) =>
                        handleDateInput("endDate", e.target.value)
                      }
                    />
                  </div>
                </StCalendarPopover>
              )}
            </div>
          </>
        )}
      </StDateInputWrapper>

      {/* 3. 메모 영역 */}
      {(showMemo || (isReadOnly && memoValue && showMemo)) && (
        <StMemoArea>
          {isReadOnly ? (
            <p className="memo-text">{memoValue}</p>
          ) : (
            <textarea
              className="memo-input"
              value={memoValue}
              onChange={(e) => setMemoValue(e.target.value)}
              onBlur={handleMemoBlur}
              placeholder="이슈 사항이나 메모를 입력하세요..."
              rows={2}
            />
          )}
        </StMemoArea>
      )}
    </StTaskItem>
  );
}

// --- 스타일 정의 ---

const StTaskItem = styled.div<{ $isPast?: boolean }>`
  display: flex;
  flex-direction: column;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e5e7eb;
  ${({ $isPast }) =>
    $isPast &&
    css`
      opacity: 0.7;
    `}
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .task-header {
    display: flex;
    align-items: center;
    gap: 8px;

    .read-mode-header {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
    }
    .task-title-input {
      flex: 1;
      font-size: 0.9rem;
      font-weight: 600;
      border: none;
      background: transparent;
      padding: 2px 0;
      &:focus {
        border-bottom: 1px solid #3b82f6;
        outline: none;
      }
    }
    .task-title-text {
      font-size: 0.9rem;
      font-weight: 600;
      color: #374151;
      padding: 2px 0;
    }

    .delete-task-btn {
      color: #9ca3af;
      font-size: 1.2rem;
      cursor: pointer;
      background: none;
      border: none;
      &:hover {
        color: #ef4444;
      }
    }

    /* ✨ 메모 버튼 스타일 (SVG 대응) */
    .memo-toggle-btn,
    .memo-icon-read {
      background: none;
      border: none;
      cursor: pointer;
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      /* 기본 색상: 회색 */
      color: #d1d5db;

      &:hover {
        color: #9ca3af;
        transform: scale(1.1);
      }

      /* 활성화(메모 있음) 상태: 노란/주황색 계열 */
      &.active {
        color: #f59e0b; /* Amber-500 */
        filter: drop-shadow(0 1px 2px rgba(245, 158, 11, 0.3));
        opacity: 1;
      }
    }
  }
`;

const StDateInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  .date-text-input {
    flex: 1;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 6px 8px;
    font-size: 0.85rem;
    color: #374151;
    font-family: monospace;
    letter-spacing: 0.5px;
    &:focus {
      border-color: #3b82f6;
      outline: none;
    }
    &:disabled {
      background-color: #f3f4f6;
      color: #9ca3af;
    }
  }
  .date-text-display {
    font-size: 0.85rem;
    color: #6b7280;
    font-family: monospace;
    letter-spacing: 0.5px;
  }
  .calendar-popover-container {
    position: relative;
  }
  .calendar-toggle-btn {
    background: none;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
    &:hover {
      background-color: #f3f4f6;
      border-color: #9ca3af;
    }
  }
`;

const StCalendarPopover = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  z-index: 50;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  width: 220px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  .popover-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
    }
    input[type="date"] {
      border: 1px solid #d1d5db;
      border-radius: 4px;
      padding: 4px;
      font-size: 0.8rem;
    }
  }
`;

const StMemoArea = styled.div`
  margin-top: 4px;
  padding: 8px;
  background-color: #fffbeb;
  border-radius: 6px;
  border: 1px solid #fcd34d;
  animation: fadeIn 0.2s ease-in-out;
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .memo-input {
    width: 100%;
    border: none;
    background: transparent;
    resize: none;
    font-size: 0.85rem;
    color: #4b5563;
    line-height: 1.4;
    &:focus {
      outline: none;
    }
  }
  .memo-text {
    font-size: 0.85rem;
    color: #92400e;
    white-space: pre-wrap;
    margin: 0;
    line-height: 1.4;
  }
`;
