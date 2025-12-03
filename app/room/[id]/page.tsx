"use client";

import { useParams } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import RoomHeader from "@/components/room/RoomHeader";
import CalendarGrid from "@/components/room/CalendarGrid";
// BottomSheet import 제거됨
import Modal from "@/components/common/Modal";
import { format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";

export default function RoomDetail() {
  const params = useParams();
  const roomId = params.id as string;

  const {
    loading,
    room,
    step,
    includeWeekend,
    participants,
    currentName,
    currentUnavailable,
    finalDate,
    modal,
    calendarGrid,
    setIncludeWeekend,
    setCurrentName,
    setFinalDate,
    setStep,
    handleToggleDate,
    handleSubmitVote,
    handleGoToConfirm,
    handleEditUser,
    handleRescueUser,
    handleReset,
    closeModal,
    showAlert,
    showConfirm,
  } = useRoom(roomId);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] text-gray-400 font-bold">
        로딩중...🐰
      </div>
    );
  if (!room) return <div className="text-center mt-20">방이 없어요 😢</div>;

  const getUnavailablePeople = (d: Date) =>
    participants.filter((p) =>
      p.unavailableDates.some((ud) => isSameDay(ud, d))
    );
  const getAvailablePeople = (d: Date) =>
    participants.filter(
      (p) => !p.unavailableDates.some((ud) => isSameDay(ud, d))
    );

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex justify-center overflow-x-hidden">
      <main className="w-full min-w-[320px] max-w-[540px] bg-[#F3F4F6] min-h-screen flex flex-col items-center py-8 px-4 pb-40 font-sans text-gray-900 relative">
        {/* 1. 헤더 */}
        <RoomHeader
          title={room.name}
          startDate={room.start_date}
          includeWeekend={includeWeekend}
          onToggleWeekend={() => setIncludeWeekend(!includeWeekend)}
        />

        {/* 2. 입력 폼 */}
        {step === "VOTING" && (
          <div className="w-full flex gap-2 mb-4 animate-fade-in">
            <div className="flex-1 bg-white p-3 rounded-[1.5rem] shadow-sm border border-gray-200 flex items-center gap-3">
              <span className="bg-gray-100 text-gray-600 p-2 rounded-full text-lg">
                👤
              </span>
              <input
                type="text"
                placeholder="이름 입력"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                className="flex-1 bg-transparent outline-none font-bold text-gray-900 placeholder-gray-300 min-w-0 text-sm sm:text-base"
              />
            </div>
            <button
              onClick={handleSubmitVote}
              className="bg-gray-200 text-gray-600 font-bold rounded-[1.5rem] px-4 hover:bg-gray-300 hover:text-gray-800 transition shadow-sm whitespace-nowrap text-sm sm:text-base"
            >
              저장 💾
            </button>
          </div>
        )}

        <div className="mb-2 text-center px-4 break-keep">
          <p
            className={
              step === "VOTING"
                ? "text-gray-500 text-sm font-bold"
                : "text-gray-900 text-lg font-extrabold"
            }
          >
            {step === "VOTING"
              ? currentName
                ? `${currentName}님, 안되는 날을 선택해주세요!`
                : "👇 이름을 입력하고 일정을 등록하세요!"
              : "👑 최종 약속 날짜를 선택해주세요!"}
          </p>
        </div>

        {/* 3. 달력 그리드 */}
        <CalendarGrid
          dates={calendarGrid}
          participants={participants}
          currentUnavailable={currentUnavailable}
          step={step}
          currentName={currentName}
          finalDate={finalDate}
          includeWeekend={includeWeekend}
          onToggleDate={handleToggleDate}
        />

        {/* 4. 결과 카드 및 리스트 */}
        {!finalDate ? (
          <div className="w-full flex flex-col gap-3 mb-24">
            <h3 className="text-gray-900 font-bold ml-2 text-sm">
              👥 참여 현황 ({participants.length}명)
            </h3>
            {participants.length === 0 ? (
              <div className="text-center p-6 text-gray-400 bg-white rounded-2xl text-sm border border-dashed border-gray-300">
                등록된 일정 없음
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
                    <span className="font-bold text-gray-700 text-sm">
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
        ) : (
          <div className="w-full bg-white p-6 rounded-[2rem] shadow-2xl border-4 border-gray-900 text-center animate-fade-in-up mb-24">
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
              일정 다시 조정하기 'ㅁ'
            </button>
          </div>
        )}

        {/* 5. 하단 플로팅 버튼 */}
        {step === "VOTING" && (
          <div className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[540px] z-30 px-6 pb-10 pointer-events-none">
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#F3F4F6] via-[#F3F4F6] to-transparent -z-10" />
            <button
              onClick={handleGoToConfirm}
              className="pointer-events-auto w-full py-4 bg-gray-900 text-white font-extrabold rounded-[1.5rem] hover:bg-black transition shadow-xl text-lg flex items-center justify-center gap-2"
            >
              <span>투표 마감하고 날짜 정하기</span>
              <span>🐰</span>
            </button>
          </div>
        )}

        {/* 바텀 시트 삭제됨 */}

        {/* 6. 모달 */}
        <Modal
          modal={modal}
          onClose={closeModal}
          onConfirm={() => {
            if (modal.onConfirm) modal.onConfirm();
            closeModal();
          }}
        />
      </main>
    </div>
  );
}
