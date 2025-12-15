"use client";

// ✅ useState 필수!
import { useState } from "react";
import { useParams } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import RoomHeader from "@/components/room/RoomHeader";
import CalendarGrid from "@/components/room/CalendarGrid";
import Modal from "@/components/common/Modal";
import { format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import PersonIcon from "@/components/icons/PersonIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import AddToCalendar from "@/components/common/AddToCalendar";
import ShareButton from "@/components/common/KakaoCalendarShare";
import { GuideModal } from "@/components/common/GuideModal";
import AdBanner from "@/components/common/AdBanner";

// --- [메인 페이지] ---
export default function RoomDetail() {
  const params = useParams();
  const roomId = params.id as string;

  // 가이드 모달 상태
  const [showGuide, setShowGuide] = useState(false);

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
    isEditing,
    setCurrentName,
    handleToggleDate,
    handleSubmitVote,
    handleSubmitAbsent,
    handleResetDates,
    handleSelectAllDates,
    handleGoToConfirm,
    handleEditUser,
    handleDeleteUser,
    handleRescueUser,
    handleReset,
    cancelEdit,
    closeModal,
  } = useRoom(roomId);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] text-gray-400 font-bold">
        로딩중...🐰
      </div>
    );
  if (!room) return <div className="text-center mt-20">방이 없어요 😢</div>;

  const getUnavailablePeople = (d: Date) =>
    participants.filter(
      (p) => !p.isAbsent && p.unavailableDates.some((ud) => isSameDay(ud, d))
    );

  const getAvailablePeople = (d: Date) =>
    participants.filter(
      (p) => !p.isAbsent && !p.unavailableDates.some((ud) => isSameDay(ud, d))
    );

  const getAbsentPeople = () => participants.filter((p) => p.isAbsent);

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex justify-center overflow-x-hidden">
      <main className="w-full min-w-[320px] max-w-[540px] bg-[#F3F4F6] min-h-screen flex flex-col items-center py-8 px-4 pb-40 font-sans text-gray-900 relative">
        {/* 헤더 및 가이드 버튼 */}
        <div className="relative w-full mb-2">
          <RoomHeader title={room.name} />
          <button
            onClick={() => setShowGuide(true)}
            className="absolute top-0 right-2 w-8 h-8 bg-white border border-gray-200 rounded-full text-gray-400 font-bold shadow-sm hover:text-blue-600 hover:border-blue-200 hover:scale-110 transition flex items-center justify-center text-sm z-10"
            aria-label="이용 가이드 보기"
          >
            ?
          </button>
        </div>

        {!finalDate && (
          <>
            <div className="mb-2 text-center px-4 break-keep">
              <p
                className={
                  step === "VOTING"
                    ? "text-gray-500 text-sm font-bold"
                    : "text-gray-900 text-lg font-extrabold"
                }
              >
                {step === "VOTING" ? (
                  isEditing ? (
                    `${currentName}님의 일정을 수정 중입니다 ✏️`
                  ) : currentName ? (
                    <>
                      ${currentName}님,
                      <b className="text-red-500 underline decoration-red-200 decoration-4">
                        참석 불가능한 날짜
                      </b>
                      을 선택해주세요!
                    </>
                  ) : (
                    <>
                      👇 이름을 입력하고{" "}
                      <b className="text-red-500 underline decoration-red-200 decoration-4">
                        참석 불가능한 날짜
                      </b>
                      를 선택하세요!
                    </>
                  )
                ) : (
                  "👑 최종 약속 날짜를 선택해주세요!"
                )}
              </p>
            </div>

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
                    <PersonIcon className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="이름 입력"
                    value={currentName}
                    onChange={(e) => setCurrentName(e.target.value)}
                    readOnly={isEditing}
                    className={`flex-1 bg-transparent outline-none font-bold text-gray-900 placeholder-gray-300 min-w-0 text-sm sm:text-base ${
                      isEditing ? "cursor-not-allowed text-gray-500" : ""
                    }`}
                  />
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

            {step === "VOTING" && (
              <div className="w-full flex justify-center gap-3 mb-2 animate-fade-in">
                <button
                  onClick={handleResetDates}
                  className="flex items-center gap-2 px-4 py-1 bg-white border border-blue-100 text-blue-600 rounded-full text-xs font-bold shadow-sm hover:shadow-md hover:bg-blue-50 transition-all active:scale-95"
                >
                  <span className="text-lg">🙆‍♂️</span> 다 돼요 (초기화)
                </button>
                <button
                  onClick={handleSelectAllDates}
                  className="flex items-center gap-2 px-4 py-1 bg-white border border-red-100 text-[#FF6B6B] rounded-full text-xs font-bold shadow-sm hover:shadow-md hover:bg-red-50 transition-all active:scale-95"
                >
                  <span className="text-lg">🙅‍♂️</span> 다 안돼요 (전체선택)
                </button>
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
              <div className="w-full flex flex-col gap-3 mb-10 animate-fade-in">
                <button
                  onClick={handleSubmitVote}
                  className="w-full p-3 bg-[#656565]  text-white font-bold rounded-2xl shadow-xl shadow-gray-200 hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>{isEditing ? "수정 완료" : "일정 저장하기"}</span>
                  <span className="text-xl">💾</span>
                </button>

                {!isEditing && (
                  <button
                    onClick={handleSubmitAbsent}
                    className="w-full py-3 text-gray-400 font-medium text-xs hover:text-gray-600 transition flex items-center justify-center gap-1"
                  >
                    혹시 이번 모임은 어려우신가요?
                    <span className="underline decoration-gray-300 underline-offset-4">
                      불참 알리기 🥲
                    </span>
                  </button>
                )}
              </div>
            )}

            <div className="w-full flex flex-col gap-3 mb-10">
              <h3 className="flex text-gray-600 font-bold text-sm">
                <PeopleIcon className="w-5 h-5 mr-1 text-gray-600 " /> 참여 현황
                ({participants.length}명)
              </h3>
              {participants.length === 0 ? (
                <div className="text-center p-6 text-gray-400 bg-white rounded-2xl text-sm border border-dashed border-gray-300">
                  등록된 일정 없음
                </div>
              ) : (
                participants.map((user, idx) => (
                  <div
                    key={idx}
                    className={`group relative bg-white p-3 pr-8 rounded-2xl shadow-sm border flex justify-between items-center transition-all hover:border-gray-400 hover:shadow-md ${
                      user.isAbsent
                        ? "border-gray-100 opacity-60"
                        : "border-gray-100"
                    }`}
                  >
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => handleEditUser(user)}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          user.isAbsent
                            ? "bg-gray-100 text-gray-400"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {user.name.slice(0, 1)}
                      </div>
                      <span
                        className={`font-bold text-sm ${
                          user.isAbsent
                            ? "text-gray-400 line-through"
                            : "text-gray-700"
                        }`}
                      >
                        {user.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-xs font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity px-2"
                      >
                        수정
                      </button>

                      {user.isAbsent ? (
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg font-bold min-w-[60px] text-center border border-gray-100">
                          불참 🥲
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg font-bold min-w-[60px] text-center">
                          {user.unavailableDates.length}일 불가
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUser(user);
                      }}
                      className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* 투표 마감 플로팅 버튼 (소프트 블랙 Ver.) */}
            {step === "VOTING" && (
              <div className="fixed bottom-5 px-6 flex justify-center pointer-events-none">
                {/* 배경 그라데이션 (텍스트 가독성용) */}
                <div className=" bg-gradient-to-t from-[#F3F4F6] via-[#F3F4F6] to-transparent " />

                <button
                  onClick={handleGoToConfirm}
                  className="
                    pointer-events-auto
                    w-full max-w-[500px] py-4 px-6
                    bg-[#454545] text-white  
                    font-bold text-lg
                    rounded-full
                    shadow-xl shadow-gray-300/50
                    flex items-center justify-center gap-2
                    transform transition-all duration-300
                    hover:bg-black hover:scale-[1.02] hover:shadow-2xl
                    active:scale-95
                    group
                  "
                >
                  <span>투표 마감하기</span>
                  <span className="group-hover:-translate-y-1 transition-transform">
                    🐰
                  </span>
                </button>
              </div>
            )}
          </>
        )}

        {/* 2. 🔥 [복구됨] 확정 화면 (이 부분이 빠져서 안 나왔던 거예요!) */}
        {finalDate && (
          <>
            <div className="w-full bg-white p-6 rounded-[2rem] shadow-xl border-4 border-gray-900 text-center animate-fade-in-up mb-8 mt-4">
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

              {/* 결과 명단 리스트 */}
              <div className="grid grid-cols-2 gap-4 text-left mb-6">
                {/* 1. 참석 가능자 */}
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

                {/* 2. 불가능자 */}
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <div className="text-red-400 font-bold text-xs mb-2">
                    불가능 / 불참 🙅‍♂️
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[...getUnavailablePeople(finalDate), ...getAbsentPeople()]
                      .length > 0 ? (
                      [
                        ...getUnavailablePeople(finalDate),
                        ...getAbsentPeople(),
                      ].map((p, i) => (
                        <button
                          key={i}
                          onClick={() => handleRescueUser(p)}
                          className={`text-xs px-2 py-1 rounded-lg border font-bold hover:scale-105 transition cursor-pointer ${
                            p.isAbsent
                              ? "bg-gray-200 text-gray-500 border-gray-300 line-through"
                              : "bg-white text-red-400 border-red-100 hover:bg-red-100"
                          }`}
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
                일정 다시 조정하기
              </button>
            </div>

            <AddToCalendar
              title={room.name}
              finalDate={format(finalDate, "yyyy-MM-dd")}
            />
            <ShareButton />
          </>
        )}

        <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

        <Modal
          modal={modal}
          onClose={closeModal}
          onConfirm={() => {
            if (modal.onConfirm) modal.onConfirm();
            closeModal();
          }}
        />

        <AdBanner />
      </main>
    </div>
  );
}
