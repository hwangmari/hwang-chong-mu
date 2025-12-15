// RoomDetail.tsx 파일 하단이나 components/common/GuideModal.tsx 로 분리
export const GuideModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 hover:text-gray-600 transition p-2 z-10"
        >
          ✕
        </button>

        {/* 헤더 */}
        <div className="text-center mt-2 flex-shrink-0">
          <div className="text-5xl mb-2">🐰</div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-2">
            어떻게 쓰나요?
          </h3>
        </div>

        {/* 스크롤 가능한 컨텐츠 영역 */}
        <div className="overflow-y-auto flex-1 text-left bg-gray-50 p-5 rounded-2xl text-sm text-gray-600 space-y-4 mb-4 leading-relaxed scrollbar-hide">
          {/* 사용법 */}
          <div>
            <p className="mb-2">
              <span className="inline-block bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs font-bold mr-1">
                Step 1
              </span>
              본인의 <b>이름</b>을 입력해주세요.
            </p>
            <p>
              <span className="inline-block bg-red-100 text-red-500 px-2 py-0.5 rounded text-xs font-bold mr-1">
                Step 2
              </span>
              달력에서{" "}
              <b className="text-red-500 underline decoration-red-200 decoration-4">
                참석 불가능한 날짜
              </b>
              를 눌러주세요! (빨간색 = 못 가는 날 🙅‍♂️)
            </p>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <span className="font-bold text-gray-800 text-xs">💡 꿀팁</span>
            <p className="text-xs text-gray-500 mt-1">
              혹시 <b>되는 날이 거의 없다면?</b>
              <br />
              캘린더 위의{" "}
              <span className="bg-red-100 text-red-500 px-1 rounded font-bold text-[10px]">
                다 안돼요
              </span>{" "}
              버튼을 누르고, <br />
              <b>되는 날만 다시 눌러서</b> 해제하세요!
            </p>
          </div>

          {/* ✨ [추가] Q&A 섹션 */}
          <div className="border-t border-gray-200 pt-4 mt-2">
            <h4 className="font-bold text-gray-900 mb-3 text-sm flex items-center">
              🙋‍♀️ 자주 묻는 질문
            </h4>

            <div className="space-y-3">
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <p className="font-bold text-gray-800 text-xs mb-1">
                  Q. 투표 마감은 누가 해요?
                </p>
                <p className="text-xs text-gray-500">
                  방장 권한이 따로 없어서{" "}
                  <b className="text-blue-500">참여자 누구나</b> 할 수 있어요!
                  친구들과 상의가 끝났다면 과감하게 눌러주세요.
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <p className="font-bold text-gray-800 text-xs mb-1">
                  Q. 다른 사람 것도 수정돼요?
                </p>
                <p className="text-xs text-gray-500">
                  네! 친구의 <b className="text-blue-500">일정을 대신 수정</b>
                  해주거나 <b className="text-red-500">삭제</b>할 수 있어요.
                  (단, 이름 수정은 안 되니{" "}
                  <b className="underline">삭제 후 다시 등록</b>해주세요! 🙅‍♂️)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition shadow-lg flex-shrink-0"
        >
          이해했어요! 👌
        </button>
      </div>
    </div>
  );
};
