import { format, addMonths } from "date-fns";
import styled from "styled-components";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: "single" | "double";
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onChangeViewMode: (mode: "single" | "double") => void;
}

export default function CalendarHeader({
  currentDate,
  viewMode,
  onPrevMonth,
  onNextMonth,
  onChangeViewMode,
}: CalendarHeaderProps) {
  return (
    <StHeaderContainer>
      <div className="nav-group">
        <button className="nav-btn" onClick={onPrevMonth}>
          <ChevronLeftIcon fontSize="small" />
        </button>
        <span className="month-title">
          {format(currentDate, "yyyy년 M월")}
          {viewMode === "double" &&
            ` - ${format(addMonths(currentDate, 1), "M월")}`}
        </span>
        <button className="nav-btn" onClick={onNextMonth}>
          <ChevronRightIcon fontSize="small" />
        </button>
      </div>

      <StViewToggle>
        <button
          className={viewMode === "single" ? "active" : ""}
          onClick={() => onChangeViewMode("single")}
        >
          1개월
        </button>
        <button
          className={viewMode === "double" ? "active" : ""}
          onClick={() => onChangeViewMode("double")}
        >
          2개월
        </button>
      </StViewToggle>
    </StHeaderContainer>
  );
}


const StHeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0;

  .nav-group {
    display: flex;
    align-items: center;
    .month-title {
      width: 190px;
      font-size: 1.25rem;
      font-weight: 800;
      color: #111827;
      text-align: center;
    }
    .nav-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid #e5e7eb;
      background: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      &:hover {
        background-color: #f3f4f6;
        color: #111827;
      }
    }
  }
`;

const StViewToggle = styled.div`
  display: flex;
  background: #f3f4f6;
  padding: 4px;
  border-radius: 8px;
  gap: 4px;

  button {
    padding: 6px 12px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #6b7280;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;

    &.active {
      background-color: white;
      color: #111827;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    &:hover:not(.active) {
      color: #374151;
    }
  }
`;
