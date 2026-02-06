/* eslint-disable react-hooks/set-state-in-effect */
import React, { useRef, useState, useEffect } from "react";
import { format, parse, isValid } from "date-fns";
import { StDateInputWrapper, StCalendarPopover } from "./TaskList.styles";

interface DateInputProps {
  startDate: Date;
  endDate: Date;
  onUpdate: (start: Date, end: Date) => void;
  isReadOnly?: boolean;
}

export default function DateInput({
  startDate,
  endDate,
  onUpdate,
  isReadOnly,
}: DateInputProps) {
  const [textValue, setTextValue] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const startFmt = format(startDate, "yyyy.MM.dd");
    const endFmt = format(endDate, "yyyy.MM.dd");
    if (startFmt === endFmt) {
      setTextValue(startFmt);
    } else {
      setTextValue(`${startFmt}-${endFmt}`);
    }
  }, [startDate, endDate]);

  /** 외부 클릭 시 달력 닫기 */
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

  /** 텍스트 입력 핸들러 (8자리 or 16자리 숫자 입력 시 자동 변환) */
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextValue(val);
    const numbersOnly = val.replace(/[^0-9]/g, "");

    if (numbersOnly.length === 8) {
      const date = parse(numbersOnly, "yyyyMMdd", new Date());
      if (isValid(date)) onUpdate(date, date);
    } else if (numbersOnly.length === 16) {
      const start = parse(numbersOnly.substring(0, 8), "yyyyMMdd", new Date());
      const end = parse(numbersOnly.substring(8, 16), "yyyyMMdd", new Date());
      if (isValid(start) && isValid(end)) onUpdate(start, end);
    }
  };

  const handleDatePick = (field: "start" | "end", val: string) => {
    if (!val) return;
    const newDate = new Date(val);
    if (field === "start") onUpdate(newDate, endDate);
    else onUpdate(startDate, newDate);
  };

  /** 읽기 전용 모드 디스플레이 텍스트 */
  const getDisplayDateText = () => {
    const sYear = startDate.getFullYear();
    const eYear = endDate.getFullYear();
    const startStr =
      sYear === currentYear
        ? format(startDate, "MM.dd")
        : format(startDate, "yyyy.MM.dd");

    if (format(startDate, "yyyyMMdd") === format(endDate, "yyyyMMdd"))
      return startStr;

    let endStr = "";
    if (sYear === eYear) {
      endStr = format(endDate, "MM.dd");
    } else {
      endStr =
        eYear === currentYear
          ? format(endDate, "MM.dd")
          : format(endDate, "yyyy.MM.dd");
    }
    return `${startStr} ~ ${endStr}`;
  };

  if (isReadOnly) {
    return <span className="date-text-display">{getDisplayDateText()}</span>;
  }

  return (
    <StDateInputWrapper ref={calendarRef}>
      <input
        type="text"
        className="date-text-input"
        value={textValue}
        onChange={handleTextChange}
        placeholder="YYYY.MM.DD"
        maxLength={21}
      />
      <button
        className="calendar-toggle-btn"
        onClick={() => setShowCalendar(!showCalendar)}
        tabIndex={-1}
        title="달력 열기"
      >
        📅
      </button>

      {showCalendar && (
        <StCalendarPopover>
          <div className="popover-row">
            <label>시작일 (Start)</label>
            <input
              type="date"
              value={format(startDate, "yyyy-MM-dd")}
              onChange={(e) => handleDatePick("start", e.target.value)}
            />
          </div>
          <div className="popover-row">
            <label>종료일 (End)</label>
            <input
              type="date"
              value={format(endDate, "yyyy-MM-dd")}
              onChange={(e) => handleDatePick("end", e.target.value)}
            />
          </div>
        </StCalendarPopover>
      )}
    </StDateInputWrapper>
  );
}
