import { format, isSameDay } from "date-fns";
import { UserVote } from "@/types";

interface Props {
  dates: (Date | null)[];
  participants: UserVote[];
  currentUnavailable: Date[];
  step: "VOTING" | "CONFIRM";
  currentName: string;
  finalDate: Date | null;
  includeWeekend: boolean;
  onToggleDate: (date: Date) => void;
  // candidateDate 제거됨
}

export default function CalendarGrid({
  dates,
  participants,
  currentUnavailable,
  step,
  currentName,
  finalDate,
  includeWeekend,
  onToggleDate,
}: Props) {
  const getUnavailableCount = (date: Date) =>
    participants.filter((p) =>
      p.unavailableDates.some((ud) => isSameDay(ud, date))
    ).length;

  return (
    <div
      className={`w-full bg-white p-4 sm:p-6 rounded-[2rem] shadow-lg border-2 mb-6 transition-colors ${
        step === "CONFIRM"
          ? "border-gray-900 shadow-gray-300"
          : "border-gray-100"
      }`}
    >
      <div
        className={`grid ${
          includeWeekend ? "grid-cols-7" : "grid-cols-5"
        } mb-3 pb-2 border-b border-gray-100`}
      >
        {(includeWeekend
          ? ["일", "월", "화", "수", "목", "금", "토"]
          : ["월", "화", "수", "목", "금"]
        ).map((day) => (
          <div
            key={day}
            className="text-center text-xs sm:text-sm font-extrabold text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      <div
        className={`grid ${
          includeWeekend ? "grid-cols-7" : "grid-cols-5"
        } gap-3`}
      >
        {dates.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} />;

          const unavailableCount = getUnavailableCount(date);
          const totalParticipants = participants.length;
          const intensity =
            totalParticipants > 0 ? unavailableCount / totalParticipants : 0;

          const isMySelection =
            step === "VOTING" &&
            currentUnavailable.some((d) => isSameDay(d, date));
          const isFinalSelected =
            step === "CONFIRM" && finalDate && isSameDay(finalDate, date);
          const isBestDate = step === "CONFIRM" && unavailableCount === 0;
          const isTypingMode = step === "VOTING" && currentName.length > 0;
          const baseColor = isTypingMode ? "209, 213, 219" : "251, 113, 133";

          return (
            <button
              key={index}
              onClick={() => onToggleDate(date)}
              className={`
                aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center transition-all border relative
                ${
                  isMySelection
                    ? "border-2 border-black bg-white z-10"
                    : "border-transparent"
                }
                ${
                  isFinalSelected
                    ? "!bg-gray-900 !border-gray-900 !text-white transform scale-110 shadow-xl z-20"
                    : ""
                }
                ${!isFinalSelected && isBestDate ? "ring-2 ring-gray-400" : ""} 
              `}
              style={{
                backgroundColor: isFinalSelected
                  ? undefined
                  : isMySelection
                  ? "white"
                  : `rgba(${baseColor}, ${intensity * 0.9})`,
              }}
            >
              <span
                className={`text-sm sm:text-base font-bold ${
                  isMySelection ? "!text-black" : ""
                } ${
                  !isMySelection && !isFinalSelected && unavailableCount > 0
                    ? "text-white"
                    : ""
                } ${isFinalSelected ? "text-white" : ""} ${
                  !isMySelection && !isFinalSelected && unavailableCount === 0
                    ? "text-gray-500"
                    : ""
                }`}
              >
                {format(date, "d")}
              </span>
              {!isFinalSelected && unavailableCount > 0 && (
                <span
                  className={`absolute -top-1 -right-1 text-white text-[9px] sm:text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm ${
                    isTypingMode ? "bg-gray-400" : "bg-rose-400"
                  }`}
                >
                  {unavailableCount}
                </span>
              )}
              {step === "CONFIRM" &&
                unavailableCount === 0 &&
                !isFinalSelected && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full shadow-sm z-30 whitespace-nowrap">
                    추천👍
                  </span>
                )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
