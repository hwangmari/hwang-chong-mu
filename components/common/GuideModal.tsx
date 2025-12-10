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
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 hover:text-gray-600 transition"
        >
          ✕
        </button>

        {/* 컨텐츠 */}
        <div className="text-center mt-2">
          <div className="text-4xl mb-2">🐰</div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-4">
            황총무 사용법
          </h3>

          <div className="text-left bg-gray-50 p-4 rounded-2xl text-sm text-gray-600 space-y-3 mb-6">
            <p>
              <span className="font-bold text-blue-500">Step 1.</span> 이름
              입력하기
            </p>
            <p>
              <span className="font-bold text-red-500">Step 2.</span>{" "}
              <span className="font-bold text-gray-800 underline decoration-red-200 decoration-4">
                안 되는 날짜
              </span>
              를 클릭해서 <span className="text-red-500 font-bold">붉은색</span>
              으로 만드세요.
            </p>
            <p>
              <span className="font-bold text-gray-500">Tip.</span> 기본은
              &apos;모두 가능&apos; 상태입니다. 되는 날이 별로 없다면{" "}
              <span className="bg-red-100 text-red-500 px-1 rounded font-bold text-xs">
                다 안돼요
              </span>{" "}
              버튼을 활용하세요!
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition"
          >
            알겠어요! 👌
          </button>
        </div>
      </div>
    </div>
  );
};
