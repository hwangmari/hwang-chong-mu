import { format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { UserVote } from "@/types";

interface Props {
  date: Date | null;
  participants: UserVote[];
  onClose: () => void;
  onConfirm: () => void;
}

export default function BottomSheet({
  date,
  participants,
  onClose,
  onConfirm,
}: Props) {
  if (!date) return null; // date가 없으면 안 그림

  // 헬퍼 함수
  const getUnavailablePeople = (d: Date) =>
    participants.filter((p) =>
      p.unavailableDates.some((ud) => isSameDay(ud, d))
    );
  const getAvailablePeople = (d: Date) =>
    participants.filter(
      (p) => !p.unavailableDates.some((ud) => isSameDay(ud, d))
    );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[540px] bg-white z-50 rounded-t-[2rem] p-8 pb-12 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-transform duration-300 animate-fade-in-up">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

        <div className="text-center mb-8">
          <p className="text-gray-400 text-sm font-bold mb-2">
            이 날짜로 정할까요?
          </p>
          <h3 className="text-3xl font-black text-gray-900">
            {format(date, "M월 d일 (E)", { locale: ko })}
          </h3>

          <div className="flex justify-center gap-4 mt-4">
            <div className="text-xs bg-gray-100 px-3 py-1 rounded-lg text-gray-500 font-bold">
              참석 {getAvailablePeople(date).length}명
            </div>
            <div className="text-xs bg-red-50 px-3 py-1 rounded-lg text-red-400 font-bold">
              불참 {getUnavailablePeople(date).length}명
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition shadow-lg"
          >
            확정하기 🔨
          </button>
        </div>
      </div>
    </>
  );
}
