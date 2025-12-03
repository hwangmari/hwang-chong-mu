import { format, addDays, parseISO } from "date-fns";

interface Props {
  title: string;
  startDate: string;
  includeWeekend: boolean;
  onToggleWeekend: () => void;
}

export default function RoomHeader({
  title,
  startDate,
  includeWeekend,
  onToggleWeekend,
}: Props) {
  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 flex items-center justify-center gap-2">
          🐰 황총무의 약속 잡기
        </h1>
        <div className="mt-3 bg-white px-4 py-2 rounded-full shadow-sm inline-block border border-gray-200">
          <span className="text-gray-400 font-bold mr-2 text-xs">PROJECT</span>
          <span className="text-gray-900 font-extrabold text-base sm:text-lg break-keep">
            {title}
          </span>
        </div>
      </div>

      <div className="mb-4 text-center">
        <p className="text-xs text-gray-400 font-bold">
          기간: {startDate} ~{" "}
          {format(addDays(parseISO(startDate), 20), "yyyy-MM-dd")}
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-xs font-bold text-gray-400">
            주말 포함 보기
          </span>
          <button
            onClick={onToggleWeekend}
            className={`relative w-8 h-4 rounded-full transition-colors duration-300 border ${
              includeWeekend
                ? "bg-gray-800 border-gray-800"
                : "bg-gray-200 border-gray-200"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                includeWeekend ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </>
  );
}
