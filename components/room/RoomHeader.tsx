import { format, addDays } from "date-fns";

interface Props {
  title: string;
  startDate: string;
  endDate?: string;
}

export default function RoomHeader({ title, startDate, endDate }: Props) {
  const start = new Date(startDate);

  // 🔥 수정됨: endDate가 있으면 그걸 쓰고, 없으면 기존처럼 3주(21일) 뒤로 계산
  const end = endDate ? new Date(endDate) : addDays(start, 21);

  return (
    <div className="text-center mb-6 mt-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 flex items-center justify-center gap-2">
          🐰 황총무의 약속 잡기
        </h1>
        <div className="mt-3 bg-white px-4 py-2 rounded-full shadow-sm inline-block border border-gray-200">
          {title}
        </div>
      </div>
      <div className="">
        <div className="text-xs text-gray-500 ">
          기간: {format(start, "yyyy-MM-dd")} ~ {format(end, "yyyy-MM-dd")}
        </div>
      </div>
    </div>
  );
}
