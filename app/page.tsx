"use client";

import { useState, useEffect } from "react";
import {
  format,
  addDays,
  isSameDay,
  parseISO,
  startOfDay,
  getDay,
} from "date-fns";
import { ko } from "date-fns/locale";

// --- [1] 타입 정의 (데이터 구조) ---
type UserVote = {
  name: string;
  unavailableDates: Date[];
};

type ModalState = {
  isOpen: boolean;
  type: "alert" | "confirm";
  message: string;
  onConfirm?: () => void;
};

export default function Home() {
  // --- [2] 상태 관리 (State) ---

  // 단계: 설정(SETUP) -> 투표(VOTING) -> 확정(CONFIRM)
  const [step, setStep] = useState<"SETUP" | "VOTING" | "CONFIRM">("SETUP");

  // 약속 기본 정보
  const [meetingTitle, setMeetingTitle] = useState("");
  const [startDateStr, setStartDateStr] = useState("");
  const [includeWeekend, setIncludeWeekend] = useState(false); // 기본값: 주말 제외

  // 사용자 입력 및 투표 데이터
  const [currentName, setCurrentName] = useState("");
  const [currentUnavailable, setCurrentUnavailable] = useState<Date[]>([]);
  const [participants, setParticipants] = useState<UserVote[]>([]);
  const [finalDate, setFinalDate] = useState<Date | null>(null);

  // 커스텀 팝업 상태
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "alert",
    message: "",
  });

  // 초기화 (오늘 날짜 자동 지정)
  useEffect(() => {
    setStartDateStr(format(new Date(), "yyyy-MM-dd"));
  }, []);

  // --- [3] 날짜 계산 로직 (Core Logic) ---
  const startDate = startDateStr
    ? startOfDay(parseISO(startDateStr))
    : startOfDay(new Date());

  // 3주(21일) 날짜 생성
  const rawDates = Array.from({ length: 21 }, (_, i) => addDays(startDate, i));

  // 주말 필터링 옵션 적용
  const displayDates = includeWeekend
    ? rawDates
    : rawDates.filter((date) => {
        const day = getDay(date);
        return day !== 0 && day !== 6;
      });

  // 달력 앞부분 빈칸 채우기 (요일 맞추기)
  let emptyCount = 0;
  if (displayDates.length > 0) {
    const firstDayIndex = getDay(displayDates[0]);
    if (includeWeekend) emptyCount = firstDayIndex;
    else emptyCount = firstDayIndex - 1 < 0 ? 0 : firstDayIndex - 1;
  }
  const calendarGrid = [...Array(emptyCount).fill(null), ...displayDates];

  // --- [4] 데이터 조회 헬퍼 함수 ---
  // 특정 날짜에 안 되는 사람 수 구하기
  const getUnavailableCount = (date: Date) =>
    participants.filter((p) =>
      p.unavailableDates.some((ud) => isSameDay(ud, date))
    ).length;

  // 특정 날짜에 되는 사람 목록
  const getAvailablePeople = (date: Date) =>
    participants.filter(
      (p) => !p.unavailableDates.some((ud) => isSameDay(ud, date))
    );

  // 특정 날짜에 안 되는 사람 목록
  const getUnavailablePeople = (date: Date) =>
    participants.filter((p) =>
      p.unavailableDates.some((ud) => isSameDay(ud, date))
    );

  // --- [5] 팝업(Modal) 제어 함수 ---
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

  // --- [6] 이벤트 핸들러 (User Actions) ---

  // 1. 방 만들기 완료
  const handleCreateRoom = () => {
    if (!meetingTitle) return showAlert("약속 이름을 정해주세요! 🐰");
    setStep("VOTING");
  };

  // 2. 날짜 클릭 (투표 모드 & 확정 모드)
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
      setFinalDate(date); // 경고 없이 바로 선택
    }
  };

  // 3. 투표 저장하기
  const handleSubmitVote = () => {
    if (!currentName) return showAlert("이름을 입력해주세요!");

    const saveAction = () => {
      setParticipants((prev) => {
        // 이름이 같으면 덮어쓰기 (수정 모드 지원)
        const filtered = prev.filter((p) => p.name !== currentName);
        return [
          ...filtered,
          { name: currentName, unavailableDates: currentUnavailable },
        ];
      });
      showAlert(`${currentName}님 일정 저장 완료! 📝`);
      setCurrentName("");
      setCurrentUnavailable([]);
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

  // 4. 기존 투표 수정하기 (리스트 클릭 시)
  const handleEditUser = (user: UserVote) => {
    showConfirm(`${user.name}님의 일정을\n수정하시겠습니까?`, () => {
      setCurrentName(user.name);
      setCurrentUnavailable(user.unavailableDates);
      window.scrollTo({ top: 0, behavior: "smooth" }); // 맨 위로 스크롤
    });
  };

  // 5. 불참자 구제 (확정 취소 및 재조율)
  const handleRescueUser = (user: UserVote) => {
    showConfirm(
      `${user.name}님의 일정을\n다시 조율하시겠습니까?\n(확정이 취소되고 달력으로 돌아갑니다)`,
      () => {
        setStep("VOTING");
        setFinalDate(null);
        setCurrentName(user.name);
        setCurrentUnavailable(user.unavailableDates);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    );
  };

  // 6. 확정 단계로 넘어가기
  const handleGoToConfirm = () => {
    if (participants.length === 0)
      return showAlert("참여자가 최소 1명은 있어야 해요!");
    showConfirm("투표를 마감하고\n최종 날짜를 정하시겠습니까?", () =>
      setStep("CONFIRM")
    );
  };

  // 7. 처음부터 다시하기 (리셋)
  const handleReset = () => {
    showConfirm("정말 처음으로 돌아갈까요?", () => window.location.reload());
  };

  // 로딩 화면
  if (!startDateStr)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] text-gray-400 font-bold">
        로딩중...🐰
      </div>
    );

  return (
    <main className="min-h-screen bg-[#F3F4F6] flex flex-col items-center py-10 px-4 pb-40 font-sans text-gray-900">
      {/* --- Header --- */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800 flex items-center justify-center gap-2">
          🐰 황총무의 약속 잡기
        </h1>
        {step !== "SETUP" && (
          <div className="mt-3 bg-white px-5 py-2 rounded-full shadow-sm inline-block border border-gray-200">
            <span className="text-gray-400 font-bold mr-2 text-xs">
              PROJECT
            </span>
            <span className="text-gray-900 font-extrabold text-lg">
              {meetingTitle}
            </span>
          </div>
        )}
      </div>

      {/* --- Step 1: 설정 (SETUP) --- */}
      {step === "SETUP" && (
        <div className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col gap-6 animate-fade-in-up">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              새로운 약속 만들기
            </h2>
            <p className="text-sm text-gray-400">
              황총무가 깔끔하게 정리해드려요!
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 ml-2">
              약속 이름
            </label>
            <input
              type="text"
              placeholder="예: 신년회, 회식"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 outline-none focus:border-gray-400 transition font-bold text-gray-900"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 ml-2">
              시작 날짜
            </label>
            <input
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 outline-none focus:border-gray-400 text-gray-900"
            />
          </div>
          <div className="flex items-center justify-between px-2">
            <span className="font-bold text-gray-600">주말 포함</span>
            <button
              onClick={() => setIncludeWeekend(!includeWeekend)}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 border-2 ${
                includeWeekend
                  ? "bg-gray-800 border-gray-800"
                  : "bg-gray-200 border-gray-200"
              }`}
            >
              <span
                className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                  includeWeekend ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <button
            onClick={handleCreateRoom}
            className="w-full py-4 bg-gray-900 text-white font-extrabold rounded-2xl hover:bg-black transition shadow-lg mt-4 flex items-center justify-center gap-2"
          >
            <span>방 만들기 🐰</span>
          </button>
        </div>
      )}

      {/* --- Step 2 & 3: 투표(VOTING) 및 확정(CONFIRM) --- */}
      {(step === "VOTING" || step === "CONFIRM") && (
        <>
          {/* 입력 폼 (투표 모드일 때만) */}
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

          {/* 안내 문구 */}
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

          {/* 메인 달력 */}
          <div
            className={`w-full max-w-md bg-white p-6 rounded-[2rem] shadow-lg border-2 mb-6 transition-colors ${
              step === "CONFIRM"
                ? "border-gray-900 shadow-gray-300"
                : "border-gray-100"
            }`}
          >
            {/* 요일 헤더 */}
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
                  className={`text-center text-sm font-extrabold ${
                    includeWeekend && i === 0
                      ? "text-gray-400"
                      : includeWeekend && i === 6
                      ? "text-gray-400"
                      : "text-gray-400"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
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
                  totalParticipants > 0
                    ? unavailableCount / totalParticipants
                    : 0;

                // 상태 확인 변수들
                const isMySelection =
                  step === "VOTING" &&
                  currentUnavailable.some((d) => isSameDay(d, date));
                const isFinalSelected =
                  step === "CONFIRM" && finalDate && isSameDay(finalDate, date);
                const isBestDate = step === "CONFIRM" && unavailableCount === 0;

                // [스마트 컬러] 입력 중이면 회색, 아니면 붉은색
                const isTypingMode =
                  step === "VOTING" && currentName.length > 0;
                const baseColor = isTypingMode
                  ? "209, 213, 219"
                  : "251, 113, 133"; // Gray vs Red

                return (
                  <button
                    key={index}
                    onClick={() => toggleDate(date)}
                    className={`
                      aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border relative
                      ${
                        isMySelection
                          ? "border-2 border-black bg-white z-10" // 내 선택: 흰 배경 + 검은 테두리
                          : "border-transparent"
                      }
                      ${
                        isFinalSelected
                          ? "!bg-gray-900 !border-gray-900 !text-white transform scale-110 shadow-xl z-20"
                          : ""
                      }
                      ${
                        !isFinalSelected && isBestDate
                          ? "ring-2 ring-gray-400"
                          : ""
                      } 
                    `}
                    style={{
                      // 배경색 로직
                      backgroundColor: isFinalSelected
                        ? undefined
                        : isMySelection
                        ? "white"
                        : `rgba(${baseColor}, ${intensity * 0.9})`,
                    }}
                  >
                    <span
                      className={`text-sm font-bold 
                      ${isMySelection ? "!text-black" : ""} 
                      ${
                        !isMySelection &&
                        !isFinalSelected &&
                        unavailableCount > 0
                          ? "text-white"
                          : ""
                      }
                      ${isFinalSelected ? "text-white" : ""}
                      ${
                        !isMySelection &&
                        !isFinalSelected &&
                        unavailableCount === 0
                          ? "text-gray-500"
                          : ""
                      }
                    `}
                    >
                      {format(date, "d")}
                    </span>

                    {/* 카운트 배지 */}
                    {!isFinalSelected && unavailableCount > 0 && (
                      <span
                        className={`absolute -top-1 -right-1 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm ${
                          isTypingMode ? "bg-gray-400" : "bg-rose-400"
                        }`}
                      >
                        {unavailableCount}
                      </span>
                    )}

                    {/* 추천 뱃지 (확정 모드) */}
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

            {step === "CONFIRM" && (
              <div className="mt-4 text-center text-xs text-gray-400">
                <span className="text-gray-800 font-bold">검은색 뱃지</span>가
                달린 날짜가 추천 날짜예요!
              </div>
            )}

            {/* 범례 (입력 중일 때만 표시) */}
            {step === "VOTING" && currentName.length > 0 && (
              <div className="mt-2 text-center text-xs text-gray-400 flex justify-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full border border-black bg-white"></span>{" "}
                  내 선택
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-300"></span>{" "}
                  다른 사람 불가
                </span>
              </div>
            )}
          </div>

          {/* 참여 현황 리스트 */}
          {!finalDate && (
            <div className="w-full max-w-md flex flex-col gap-3 mb-24">
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
                      <span className="font-bold text-gray-700">
                        {user.name}
                      </span>
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

          {/* 최종 확정 결과 카드 */}
          {finalDate && step === "CONFIRM" && (
            <div className="w-full max-w-md bg-white p-6 rounded-[2rem] shadow-2xl border-4 border-gray-900 text-center animate-fade-in-up mb-24">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
                약속 날짜 확정!
              </h2>

              <div className="bg-gray-50 p-6 rounded-2xl mb-6 mt-4 border border-gray-100">
                <div className="text-gray-500 font-bold mb-1 text-xs">
                  {meetingTitle}
                </div>
                <div className="text-3xl font-black text-gray-900">
                  {format(finalDate, "M월 d일 (E)", { locale: ko })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left mb-6">
                {/* 참석 가능 */}
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
                {/* 불참 (클릭 시 재조율) */}
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
                          title="클릭해서 일정 재조율하기"
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

          {/* 하단 투표 마감 버튼 */}
          {step === "VOTING" && (
            <div className="fixed bottom-0 w-full max-w-md z-30 bg-gradient-to-t from-[#F3F4F6] via-[#F3F4F6] to-transparent pb-10">
              <button
                onClick={handleGoToConfirm}
                className="w-full py-4 bg-gray-900 text-white font-extrabold rounded-[1.5rem] hover:bg-black transition shadow-xl text-lg flex items-center justify-center gap-2"
              >
                <span>투표 마감하고 날짜 정하기</span>
                <span>🐰</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* --- 커스텀 팝업 (Modal) --- */}
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
