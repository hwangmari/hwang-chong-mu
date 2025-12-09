// app/page.tsx (새로 생성)
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      {/* 🐰 프로필 영역 */}
      <div className="text-center mb-12 animate-fade-in-up">
        <div className="w-24 h-24 bg-white rounded-full shadow-lg mx-auto mb-4 flex items-center justify-center text-5xl border-4 border-indigo-50">
          🐰
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">
          황총무의 실험실
        </h1>
        <p className="text-gray-500 font-medium">
          복잡한 건 제가 할게요, 총총총... 🐾
        </p>
      </div>

      {/* 📂 프로젝트 목록 (그리드) */}
      <div className="w-full max-w-md grid gap-4">
        {/* 1. 약속 잡기 카드 */}
        <Link
          href="/meeting"
          className="group bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all flex items-center gap-4 cursor-pointer"
        >
          <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            📅
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
              약속 잡기
            </h2>
            <p className="text-sm text-gray-400">
              친구들과 일정을 가장 쉽게 잡는 법
            </p>
          </div>
          <div className="text-gray-300 group-hover:translate-x-1 transition-transform">
            ➔
          </div>
        </Link>

        {/* 2. (준비중) N빵 계산기 카드 */}
        <div className="bg-gray-100 p-6 rounded-[2rem] border border-transparent flex items-center gap-4 opacity-60 cursor-not-allowed">
          <div className="w-14 h-14 bg-gray-200 text-gray-400 rounded-2xl flex items-center justify-center text-2xl">
            💸
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-500">N빵 계산기</h2>
            <p className="text-sm text-gray-400">준비 중입니다... 🚧</p>
          </div>
        </div>
      </div>

      {/* 하단 카피라이트 */}
      <footer className="absolute bottom-6 text-gray-300 text-xs font-medium">
        © 2025 Hwang Chongmu. All rights reserved.
      </footer>
    </main>
  );
}
