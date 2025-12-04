"use client";

import { useParams } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import RoomHeader from "@/components/room/RoomHeader";
import CalendarGrid from "@/components/room/CalendarGrid";
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
    isEditing, // ⭐ 추가된 상태
    setIncludeWeekend,
    setCurrentName,
    setFinalDate,
    setStep,
    handleToggleDate,
    handleSubmitVote,
    handleGoToConfirm,
    handleEditUser,
    handleDeleteUser, // ⭐ 추가된 함수
    handleRescueUser,
    handleReset,
    cancelEdit, // ⭐ 추가된 함수
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
        <RoomHeader
          title={room.name}
          startDate={room.start_date}
          includeWeekend={includeWeekend}
          onToggleWeekend={() => setIncludeWeekend(!includeWeekend)}
        />

        <div className="mb-2 text-center px-4 break-keep">
          <p
            className={
              step === "VOTING"
                ? "text-gray-500 text-sm font-bold"
                : "text-gray-900 text-lg font-extrabold"
            }
          >
            {step === "VOTING"
              ? // ⭐ 수정 중일 때 멘트 변경
                isEditing
                ? `${currentName}님의 일정을 수정 중입니다 ✏️`
                : currentName
                ? `${currentName}님, 안되는 날을 선택해주세요!`
                : "👇 이름을 입력하고 일정을 등록하세요!"
              : "👑 최종 약속 날짜를 선택해주세요!"}
          </p>
        </div>

        {/* 입력 폼 */}
        {step === "VOTING" && (
          <div className="w-full flex gap-2 mb-4 animate-fade-in relative">
            <div
              className={`flex-1 p-2 rounded-[1.5rem] shadow-sm border flex items-center gap-3 transition-colors ${
                isEditing
                  ? "bg-gray-100 border-gray-300"
                  : "bg-white border-gray-200"
              }`}
            >
              <span className="p-2 bg-gray-100 text-gray-600 rounded-full text-lg">
                👤
              </span>
              <input
                type="text"
                placeholder="이름 입력"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                readOnly={isEditing} // ⭐ 수정 중엔 읽기 전용
                className={`flex-1 bg-transparent outline-none font-bold text-gray-900 placeholder-gray-300 min-w-0 text-sm sm:text-base ${
                  isEditing ? "cursor-not-allowed text-gray-500" : ""
                }`}
              />
              {/* ⭐ 수정 중이거나 이름이 있을 때 취소 버튼 표시 */}
              {(isEditing || currentName.length > 0) && (
                <button
                  onClick={cancelEdit}
                  className="mr-2 text-gray-400 hover:text-gray-600 font-bold px-2"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

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

        {step === "VOTING" && (
          <div className="w-full flex gap-2 mb-10 animate-fade-in">
            <button
              onClick={handleSubmitVote}
              className="w-full p-3 bg-gray-200 text-gray-600 font-bold rounded-[1.5rem] px-4 hover:bg-gray-300 hover:text-gray-800 transition shadow-sm whitespace-nowrap text-sm sm:text-base"
            >
              {isEditing ? "수정 완료 💾" : "일정 저장 💾"}
            </button>
          </div>
        )}

        {/* 참여 현황 리스트 */}
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
                  className="group relative bg-white p-3 pr-8 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center transition-all hover:border-gray-400 hover:shadow-md"
                >
                  {/* 이름 부분 클릭 시 수정 */}
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1"
                    onClick={() => handleEditUser(user)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs">
                      {user.name.slice(0, 1)}
                    </div>
                    <span className="font-bold text-gray-700 text-sm">
                      {user.name}
                    </span>
                  </div>

                  {/* 우측 정보 */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-xs font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity px-2"
                    >
                      수정
                    </button>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg font-bold min-w-[60px] text-center">
                      {user.unavailableDates.length}일 불가
                    </span>
                  </div>

                  {/* ⭐ 삭제 버튼 추가 (우측 상단, 호버 시 등장) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // 부모 클릭 방지
                      handleDeleteUser(user);
                    }}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                    title="삭제"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          // ... (확정 화면은 기존과 동일)
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
            {/* ... 중간 내용 생략 (기존 코드 유지) ... */}
            <div className="grid grid-cols-2 gap-4 text-left mb-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-gray-400 font-bold text-xs mb-2">
                  참석 가능 🙆‍♂️
                </div>
                <div className="flex flex-wrap gap-1">
                  {getAvailablePeople(finalDate).map((p, i) => (
                    <span
                      key={i}
                      className="bg-white text-gray-800 text-xs px-2 py-1 rounded-lg border border-gray-200 font-bold"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <div className="text-red-400 font-bold text-xs mb-2">
                  아쉽지만 불참 🙅‍♂️
                </div>
                <div className="flex flex-wrap gap-1">
                  {getUnavailablePeople(finalDate).map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleRescueUser(p)}
                      className="bg-white text-red-400 text-xs px-2 py-1 rounded-lg border border-red-100 font-bold hover:bg-red-100"
                    >
                      {p.name} ✎
                    </button>
                  ))}
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

        {/* ... (나머지 동일) ... */}
        {step === "VOTING" && (
          <div className="fixed bottom-0 right-0 z-30 px-6 pb-10 pointer-events-none">
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#F3F4F6] via-[#F3F4F6] to-transparent -z-10" />
            <button
              onClick={handleGoToConfirm}
              className="pointer-events-auto w-full p-4 bg-gray-900 text-white font-extrabold rounded-[1.5rem] hover:bg-black transition shadow-xl text-lg flex items-center justify-center gap-2"
            >
              <span>투표 마감</span>
              <span>🐰</span>
            </button>
          </div>
        )}

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
