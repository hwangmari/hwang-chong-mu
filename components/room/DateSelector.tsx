import { useState, useMemo } from "react";
import { eachDayOfInterval, addWeeks, isSameDay } from "date-fns";

const DateSelector = () => {
  // 1. 3주치 날짜 생성
  const today = new Date();
  const threeWeeksLater = addWeeks(today, 3);
  const allDates = useMemo(
    () => eachDayOfInterval({ start: today, end: threeWeeksLater }),
    [today, threeWeeksLater]
  );

  // 2. 선택된 날짜들을 담는 배열
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  // ✅ 핵심 기능: 모두 선택 / 모두 해제
  const handleSelectAll = () => setSelectedDates(allDates);
  const handleDeselectAll = () => setSelectedDates([]);

  // 날짜 토글 함수
  const toggleDate = (date: Date) => {
    const isSelected = selectedDates.some((d) => isSameDay(d, date));
    if (isSelected) {
      setSelectedDates((prev) => prev.filter((d) => !isSameDay(d, date)));
    } else {
      setSelectedDates((prev) => [...prev, date]);
    }
  };

  return (
    <div>
      {/* 상단 컨트롤 버튼 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSelectAll}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold hover:bg-blue-200"
        >
          🙆‍♂️ 다 돼요! (전체 선택)
        </button>
        <button
          onClick={handleDeselectAll}
          className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-bold hover:bg-gray-200"
        >
          🙅‍♂️ 싹 비우기 (초기화)
        </button>
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-2">
        {allDates.map((date) => {
          const isSelected = selectedDates.some((d) => isSameDay(d, date));
          return (
            <button
              key={date.toString()}
              onClick={() => toggleDate(date)}
              className={`p-2 rounded-lg transition ${
                isSelected
                  ? "bg-blue-500 text-white" // 선택됨
                  : "bg-gray-50 text-gray-400" // 선택 안됨
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};
