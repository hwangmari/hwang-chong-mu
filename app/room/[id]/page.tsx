"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  format,
  addDays,
  isSameDay,
  parseISO,
  startOfDay,
  getDay,
} from "date-fns";
import { ko } from "date-fns/locale";

// --- [1] 타입 정의 ---
type UserVote = {
  id?: string;
  name: string;
  unavailableDates: Date[];
};

type ModalState = {
  isOpen: boolean;
  type: "alert" | "confirm";
  message: string;
  onConfirm?: () => void;
};

export default function RoomDetail() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();

  // --- [2] 상태 관리 ---
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"VOTING" | "CONFIRM">("VOTING");

  const [room, setRoom] = useState<any>(null);
  const [includeWeekend, setIncludeWeekend] = useState(false);

  const [currentName, setCurrentName] = useState("");
  const [currentUnavailable, setCurrentUnavailable] = useState<Date[]>([]);
  const [participants, setParticipants] = useState<UserVote[]>([]);

  const [finalDate, setFinalDate] = useState<Date | null>(null);

  // ★ NEW: 바텀 시트를 위한 '임시 선택 날짜' 상태
  const [candidateDate, setCandidateDate] = useState<Date | null>(null);

  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "alert",
    message: "",
  });

  // --- [3] 데이터 불러오기 (Polling 포함) ---
  const fetchData = useCallback(async () => {
    if (!roomId) return;
    try {
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();
      if (roomError) throw roomError;
      setRoom(roomData);

      const { data: partData, error: partError } = await supabase
        .from("participants")
        .select("*")
        .eq("room_id", roomId);
      if (partError) throw partError;

      const formattedParticipants = partData.map((p: any) => ({
        id: p.id,
        name: p.name,
        unavailableDates: (p.unavailable_dates || []).map((d: string) =>
          startOfDay(parseISO(d))
        ),
      }));
      setParticipants(formattedParticipants);
      setLoading(false);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    }
  }, [roomId]);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(() => fetchData(), 3000); // 3초마다 갱신
    return () => clearInterval(intervalId);
  }, [fetchData]);

  // --- [4] 날짜 계산 로직 ---
  const startDate = room?.start_date
    ? startOfDay(parseISO(room.start_date))
    : startOfDay(new Date());

  const rawDates = Array.from({ length: 21 }, (_, i) => addDays(startDate, i));
  const displayDates = includeWeekend
    ? rawDates
    : rawDates.filter((date) => {
        const day = getDay(date);
        return day !== 0 && day !== 6;
      });

  let emptyCount = 0;
  if (displayDates.length > 0) {
    const firstDayIndex = getDay(displayDates[0]);
    if (includeWeekend) emptyCount = firstDayIndex;
    else emptyCount = firstDayIndex - 1 < 0 ? 0 : firstDayIndex - 1;
  }
  const calendarGrid = [...Array(emptyCount).fill(null), ...displayDates];

  // --- [5] 헬퍼 함수 ---
  const getUnavailableCount = (date: Date) =>
    participants.filter((p) =>
      p.unavailableDates.some((ud) => isSameDay(ud, date))
    ).length;

  const getAvailablePeople = (date: Date) =>
    participants.filter(
      (p) => !p.unavailableDates.some((ud) => isSameDay(ud, date))
    );

  const getUnavailablePeople = (date: Date) =>
    participants.filter((p) =>
      p.unavailableDates.some((ud) => isSameDay(ud, date))
    );

  // --- [6] 팝업 제어 ---
  const showAlert = (msg: string) =>
    setModal({ isOpen: true, type: "alert", message: msg });
  const showConfirm = (msg: string, onConfirmAction: () => void) =>
    setModal({
      isOpen: true,
      type: "confirm",
      message: msg,
      onConfirm: onConfirmAction,
    });
  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));
  const handleModalConfirm = () => {
    if (modal.onConfirm) modal.onConfirm();
    closeModal();
  };

  // --- [7] 이벤트 핸들러 ---
  const toggleDate = (date: Date) => {
    if (step === "VOTING") {
      if (!currentName) return showAlert("이름을 먼저 입력해주세요! 🐰");
      setCurrentUnavailable((prev) => {
        const isSelected = prev.some((d) => isSameDay(d, date));
        return isSelected
          ? prev.filter((d) => !isSameDay(d, date))
          : [...prev, date];
      });
    } else if (step === "CONFIRM") {
      // ★ 변경: 바로 finalDate를 박는 게 아니라, '후보군(Candidate)'에 넣고 바텀시트 오픈
      setCandidateDate(date);
    }
  };

  const handleConfirmFinalDate = () => {
    if (candidateDate) {
      setFinalDate(candidateDate); // 진짜 확정
      setCandidateDate(null); // 바텀 시트 닫기
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmitVote = () => {
    if (!currentName) return showAlert("이름을 입력해주세요!");
    const saveAction = async () => {
      try {
        const dateStrings = currentUnavailable.map((d) =>
          format(d, "yyyy-MM-dd")
        );
        await supabase
          .from("participants")
          .delete()
          .eq("room_id", roomId)
          .eq("name", currentName);
        const { error } = await supabase.from("participants").insert([
          {
            room_id: roomId,
            name: currentName,
            unavailable_dates: dateStrings,
          },
        ]);
        if (error) throw error;
        showAlert(`${currentName}님 일정 저장 완료! 📝`);
        setCurrentName("");
        setCurrentUnavailable([]);
        fetchData();
      } catch (e) {
        console.error(e);
        showAlert("저장 중 오류가 발생했어요 ㅠㅠ");
      }
    };
    if (currentUnavailable.length === 0) {
      showConfirm(
        "선택한 '안되는 날'이 없어요.\n모든 날짜가 가능하신가요?",
        saveAction
      );
    } else {
      saveAction();
    }
  };

  const handleEditUser = (user: UserVote) => {
    showConfirm(`${user.name}님의 일정을\n수정하시겠습니까?`, () => {
      setCurrentName(user.name);
      setCurrentUnavailable(user.unavailableDates);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const handleRescueUser = (user: UserVote) => {
    showConfirm(`${user.name}님의 일정을\n다시 조율하시겠습니까?`, () => {
      setStep("VOTING");
      setFinalDate(null);
      setCurrentName(user.name);
      setCurrentUnavailable(user.unavailableDates);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const handleGoToConfirm = () => {
    if (participants.length === 0)
      return showAlert("참여자가 최소 1명은 있어야 해요!");
    showConfirm("투표를 마감하고\n최종 날짜를 정하시겠습니까?", () =>
      setStep("CONFIRM")
    );
  };

  const handleReset = () => {
    showConfirm("확정된 날짜를 취소하고 다시 투표화면으로 갈까요?", () => {
      setStep("VOTING");
      setFinalDate(null);
    });
  };

  // --- 렌더링 ---
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] text-gray-400 font-bold">
        로딩중...🐰
      </div>
    );
  if (!room)
    return <div className="text-center mt-20">방이 존재하지 않습니다 😢</div>;

  return (
    <main className="min-h-screen bg-[#F3F4F6] flex flex-col items-center py-10 px-4 pb-40 font-sans text-gray-900 relative">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800 flex items-center justify-center gap-2">
          🐰 황총무의 약속 잡기
        </h1>
        <div className="mt-3 bg-white px-5 py-2 rounded-full shadow-sm inline-block border border-gray-200">
          <span className="text-gray-400 font-bold mr-2 text-xs">PROJECT</span>
          <span className="text-gray-900 font-extrabold text-lg">
            {room.name}
          </span>
        </div>
      </div>

      {/* Date Info */}
      <div className="mb-4 text-center">
        <p className="text-xs text-gray-400 font-bold">
          기간: {room.start_date} ~{" "}
          {format(addDays(parseISO(room.start_date), 20), "yyyy-MM-dd")} (3주간)
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-xs font-bold text-gray-400">
            주말 포함 보기
          </span>
          <button
            onClick={() => setIncludeWeekend(!includeWeekend)}
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

      {/* VOTING Input */}
      {step === "VOTING" && (
        <div className="w-full max-w-md flex gap-2 mb-4 animate-fade-in">
          <div className="flex-1 bg-white p-3 rounded-[1.5rem] shadow-sm border border-gray-200 flex items-center gap-3">
            <span className="bg-gray-100 text-gray-600 p-2 rounded-full text-lg">
              👤
            </span>
            <input
              type="text"
              placeholder="이름 입력"
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
              className="flex-1 bg-transparent outline-none font-bold text-gray-900 placeholder-gray-300 min-w-0"
            />
          </div>
          <button
            onClick={handleSubmitVote}
            className="bg-gray-200 text-gray-600 font-bold rounded-[1.5rem] px-5 hover:bg-gray-300 hover:text-gray-800 transition shadow-sm whitespace-nowrap"
          >
            저장 💾
          </button>
        </div>
      )}

      {/* Guide Text */}
      <div className="mb-2 text-center">
        {step === "VOTING" ? (
          <p className="text-gray-500 text-sm font-bold">
            {currentName
              ? `${currentName}님, 안되는 날을 선택해주세요!`
              : "👇 이름을 입력하고 일정을 등록하세요!"}
          </p>
        ) : (
          <p className="text-gray-900 text-lg font-extrabold">
            👑 최종 약속 날짜를 선택해주세요!
          </p>
        )}
      </div>

      {/* Calendar */}
      <div
        className={`w-full max-w-md bg-white p-6 rounded-[2rem] shadow-lg border-2 mb-6 transition-colors ${
          step === "CONFIRM"
            ? "border-gray-900 shadow-gray-300"
            : "border-gray-100"
        }`}
      >
        <div
          className={`grid ${
            includeWeekend ? "grid-cols-7" : "grid-cols-5"
          } mb-4 pb-2 border-b border-gray-100`}
        >
          {(includeWeekend
            ? ["일", "월", "화", "수", "목", "금", "토"]
            : ["월", "화", "수", "목", "금"]
          ).map((day, i) => (
            <div
              key={day}
              className="text-center text-sm font-extrabold text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        <div
          className={`grid ${
            includeWeekend ? "grid-cols-7" : "grid-cols-5"
          } gap-2`}
        >
          {calendarGrid.map((date, index) => {
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
            // 바텀시트 후보로 선택된 날짜 강조 (검은 테두리)
            const isCandidate = candidateDate && isSameDay(candidateDate, date);

            const isTypingMode = step === "VOTING" && currentName.length > 0;
            const baseColor = isTypingMode ? "209, 213, 219" : "251, 113, 133";

            return (
              <button
                key={index}
                onClick={() => toggleDate(date)}
                className={`
                  aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border relative
                  ${
                    isMySelection || isCandidate
                      ? "border-2 border-black bg-white z-10"
                      : "border-transparent"
                  }
                  ${
                    isFinalSelected
                      ? "!bg-gray-900 !border-gray-900 !text-white transform scale-110 shadow-xl z-20"
                      : ""
                  }
                  ${
                    !isFinalSelected && isBestDate ? "ring-2 ring-gray-400" : ""
                  } 
                `}
                style={{
                  backgroundColor: isFinalSelected
                    ? undefined
                    : isMySelection || isCandidate
                    ? "white"
                    : `rgba(${baseColor}, ${intensity * 0.9})`,
                }}
              >
                <span
                  className={`text-sm font-bold ${
                    isMySelection || isCandidate ? "!text-black" : ""
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
                    className={`absolute -top-1 -right-1 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm ${
                      isTypingMode ? "bg-gray-400" : "bg-rose-400"
                    }`}
                  >
                    {unavailableCount}
                  </span>
                )}
                {step === "CONFIRM" &&
                  unavailableCount === 0 &&
                  !isFinalSelected && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-sm z-30 whitespace-nowrap">
                      추천👍
                    </span>
                  )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Result Card */}
      {!finalDate && (
        <div className="w-full max-w-md flex flex-col gap-3 mb-24">
          {/* 참여 현황 리스트 (생략 없이 그대로 둠) */}
          <h3 className="text-gray-900 font-bold ml-2 text-sm">
            👥 참여 현황 ({participants.length}명)
          </h3>
          {participants.length === 0 ? (
            <div className="text-center p-6 text-gray-400 bg-white rounded-2xl text-sm border border-dashed border-gray-300">
              아직 등록된 일정이 없어요.
            </div>
          ) : (
            participants.map((user, idx) => (
              <div
                key={idx}
                onClick={() => handleEditUser(user)}
                className="group bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:border-gray-400 hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs">
                    {user.name.slice(0, 1)}
                  </div>
                  <span className="font-bold text-gray-700">{user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition">
                    수정 ✎
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg font-bold">
                    {user.unavailableDates.length}일 불가
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {finalDate && step === "CONFIRM" && (
        <div className="w-full max-w-md bg-white p-6 rounded-[2rem] shadow-2xl border-4 border-gray-900 text-center animate-fade-in-up mb-24">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
            약속 날짜 확정!
          </h2>
          <div className="bg-gray-50 p-6 rounded-2xl mb-6 mt-4 border border-gray-100">
            <div className="text-gray-500 font-bold mb-1 text-xs">
              {room.name}
            </div>
            <div className="text-3xl font-black text-gray-900">
              {format(finalDate, "M월 d일 (E)", { locale: ko })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-left mb-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="text-gray-400 font-bold text-xs mb-2">
                참석 가능 🙆‍♂️
              </div>
              <div className="flex flex-wrap gap-1">
                {getAvailablePeople(finalDate).length > 0 ? (
                  getAvailablePeople(finalDate).map((p, i) => (
                    <span
                      key={i}
                      className="bg-white text-gray-800 text-xs px-2 py-1 rounded-lg border border-gray-200 font-bold"
                    >
                      {p.name}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-300 text-xs">없음</span>
                )}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
              <div className="text-red-400 font-bold text-xs mb-2">
                아쉽지만 불참 🙅‍♂️
              </div>
              <div className="flex flex-wrap gap-1">
                {getUnavailablePeople(finalDate).length > 0 ? (
                  getUnavailablePeople(finalDate).map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleRescueUser(p)}
                      className="bg-white text-red-400 text-xs px-2 py-1 rounded-lg border border-red-100 font-bold hover:bg-red-100 hover:scale-105 transition cursor-pointer"
                    >
                      {p.name} ✎
                    </button>
                  ))
                ) : (
                  <span className="text-gray-400 text-xs">전원 참석!</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="text-gray-400 underline text-sm hover:text-gray-600"
          >
            처음부터 다시 만들기
          </button>
        </div>
      )}

      {step === "VOTING" && (
        <div className="fixed bottom-0 left-6 right-6 m-auto max-w-md z-30 bg-gradient-to-t from-[#F3F4F6] via-[#F3F4F6] to-transparent pb-10">
          <button
            onClick={handleGoToConfirm}
            className="w-full py-4 bg-gray-900 text-white font-extrabold rounded-[1.5rem] hover:bg-black transition shadow-xl text-lg flex items-center justify-center gap-2"
          >
            <span>투표 마감하고 날짜 정하기</span>
            <span>🐰</span>
          </button>
        </div>
      )}

      {/* ★ NEW: 확정 확인용 바텀 시트 (Bottom Sheet) ★ */}
      {step === "CONFIRM" && (
        <>
          {/* 1. 배경 (Backdrop) - 시트가 열렸을 때만 보임 */}
          <div
            className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
              candidateDate ? "opacity-100 visible" : "opacity-0 invisible"
            }`}
            onClick={() => setCandidateDate(null)} // 배경 누르면 닫기
          />

          {/* 2. 시트 본문 (Sheet) - 아래에서 위로 올라옴 */}
          <div
            className={`fixed bottom-0 w-full max-w-md bg-white z-50 rounded-t-[2rem] p-8 pb-12 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-transform duration-300 transform ${
              candidateDate ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />{" "}
            {/* 핸들 바 */}
            <div className="text-center mb-8">
              <p className="text-gray-400 text-sm font-bold mb-2">
                이 날짜로 정할까요?
              </p>
              <h3 className="text-3xl font-black text-gray-900">
                {candidateDate
                  ? format(candidateDate, "M월 d일 (E)", { locale: ko })
                  : ""}
              </h3>

              {candidateDate && (
                <div className="flex justify-center gap-4 mt-4">
                  <div className="text-xs bg-gray-100 px-3 py-1 rounded-lg text-gray-500 font-bold">
                    참석 {getAvailablePeople(candidateDate).length}명
                  </div>
                  <div className="text-xs bg-red-50 px-3 py-1 rounded-lg text-red-400 font-bold">
                    불참 {getUnavailablePeople(candidateDate).length}명
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCandidateDate(null)}
                className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition"
              >
                취소
              </button>
              <button
                onClick={handleConfirmFinalDate}
                className="flex-1 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition shadow-lg"
              >
                확정하기 🔨
              </button>
            </div>
          </div>
        </>
      )}

      {/* 기존 모달 (Alert/Confirm) */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm p-6 rounded-[2rem] shadow-2xl transform transition-all scale-100 animate-bounce-small">
            <div className="text-center">
              <div className="text-4xl mb-4">🐰</div>
              <h3 className="text-lg font-extrabold text-gray-900 whitespace-pre-line mb-2 leading-relaxed">
                {modal.message}
              </h3>
              <div className="flex gap-3 mt-6">
                {modal.type === "confirm" && (
                  <button
                    onClick={closeModal}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
                  >
                    취소
                  </button>
                )}
                <button
                  onClick={handleModalConfirm}
                  className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition shadow-lg"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
