import { useState } from "react";

interface RoomHeaderProps {
  title: string;
}

export default function RoomHeader({ title }: RoomHeaderProps) {
  const [showCopied, setShowCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href; // 현재 페이지 주소

    // 1. 모바일 등 네이티브 공유가 가능한 경우 (Web Share API)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `[약속잡기] ${title}`,
          text: `${title} 약속 날짜를 정해보아요! 🐰`,
          url: url,
        });
      } catch (err) {
        console.log("공유 취소됨");
      }
    } else {
      // 2. PC 등 공유 기능이 없는 경우 -> 클립보드 복사
      try {
        await navigator.clipboard.writeText(url);
        // "복사됨!" 말풍선 2초간 보여주기
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      } catch (err) {
        alert("링크 복사에 실패했어요 😢 URL을 직접 복사해주세요.");
      }
    }
  };

  return (
    <header className="w-full flex flex-col gap-4 mb-6">
      <h1 className="text-xl  font-extrabold text-gray-800 flex items-center justify-center gap-2">
        🐰 황총무의 약속 잡기
      </h1>

      {/* 타이틀 및 공유 버튼 영역 */}
      <div className="flex items-center justify-between rounded-[0.5rem] border-gray-300 shadow-sm border px-4 py-2">
        <h1 className="text-2xl font-black text-gray-900 break-keep leading-tight">
          {title}
        </h1>

        {/* 🔥 공유 버튼 */}
        <button
          onClick={handleShare}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 active:scale-95 group relative"
          aria-label="약속 링크 공유하기"
        >
          {/* 공유 아이콘 (SVG) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 sm:w-6 sm:h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
            />
          </svg>

          {/* "복사됨" 말풍선 (PC용) */}
          <div
            className={`absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs font-bold rounded-lg whitespace-nowrap transition-all duration-200 pointer-events-none ${
              showCopied
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-2"
            }`}
          >
            링크 복사 완료! ✅
          </div>
        </button>
      </div>
    </header>
  );
}
