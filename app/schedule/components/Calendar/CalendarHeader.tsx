import { format, addMonths } from "date-fns";
import styled from "styled-components";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: "single" | "double";
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onChangeViewMode: (mode: "single" | "double") => void;
}

export default function CalendarHeader({
  currentDate,
  viewMode,
  onPrevMonth,
  onNextMonth,
  onToday,
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
        <StTodayButton onClick={onToday}>오늘</StTodayButton>
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
      color: ${({ theme }) => theme.colors.gray900};
      text-align: center;
    }
    .nav-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid ${({ theme }) => theme.colors.gray200};
      background: ${({ theme }) => theme.colors.white};
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${({ theme }) => theme.colors.gray500};
      &:hover {
        background-color: ${({ theme }) => theme.colors.gray100};
        color: ${({ theme }) => theme.colors.gray900};
      }
    }
  }
`;

const StTodayButton = styled.button`
  margin-left: 8px;
  padding: 5px 14px;
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray700};
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background-color: ${({ theme }) => theme.colors.gray100};
    border-color: ${({ theme }) => theme.colors.gray300};
    color: ${({ theme }) => theme.colors.gray900};
  }
`;

const StViewToggle = styled.div`
  display: flex;
  background: ${({ theme }) => theme.colors.gray100};
  padding: 4px;
  border-radius: 8px;
  gap: 4px;

  button {
    padding: 6px 12px;
    font-size: 0.85rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray500};
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;

    &.active {
      background-color: ${({ theme }) => theme.colors.white};
      color: ${({ theme }) => theme.colors.gray900};
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    &:hover:not(.active) {
      color: ${({ theme }) => theme.colors.gray700};
    }
  }
`;
