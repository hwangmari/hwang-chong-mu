"use client"; // Next.js App Router에서 필수!

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase"; // 아까 만든 supabase 설정 파일 경로

export default function CreateRoom() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 입력값 상태 관리
  const [roomName, setRoomName] = useState("");
  const [startDate, setStartDate] = useState("");

  // (선택사항) 주말 포함 여부 - 로직은 나중에 구현해도 됩니다.
  const [includeWeekend, setIncludeWeekend] = useState(false);

  const handleCreateRoom = async () => {
    // 1. 유효성 검사
    if (!roomName.trim()) {
      alert("약속 이름을 입력해주세요! 😅");
      return;
    }
    if (!startDate) {
      alert("시작 날짜를 선택해주세요! 📅");
      return;
    }

    setLoading(true);

    try {
      // 2. 날짜 계산 (시작일로부터 3주 뒤)
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 21); // 21일(3주) 더하기

      // 날짜 포맷 변환 (YYYY-MM-DD)
      const endDateString = end.toISOString().split("T")[0];

      // 3. Supabase DB에 저장
      const { data, error } = await supabase
        .from("rooms")
        .insert([
          {
            name: roomName,
            start_date: startDate,
            end_date: endDateString,
          },
        ])
        .select(); // 저장 후 ID를 받기 위해 select() 필수

      if (error) throw error;

      // 4. 성공 시, 생성된 방 페이지로 이동 (/room/아이디)
      if (data && data.length > 0) {
        const roomId = data[0].id;
        router.push(`/room/${roomId}`);
      }
    } catch (error) {
      console.error("에러 발생:", error);
      alert("방 생성 중 오류가 발생했습니다. 다시 시도해주세요. 😭");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        {/* 헤더 영역 */}
        <div className="text-center mb-8">
          <div className="text-xl">🐰</div>
          <h1 className="text-xl font-bold text-gray-800 mb-1">
            황총무의 약속 잡기
          </h1>
          <p className="text-sm text-gray-400">
            약속 잡기 힘드시죠? 황총무가 깔끔하게 정리해드려요!
          </p>
        </div>

        {/* 메인 폼 영역 */}
        <div className="space-y-6">
          {/* 입력 1: 약속 이름 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 ml-1">
              약속 이름
            </label>
            <input
              type="text"
              placeholder="예: 신년회, 회식"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* 입력 2: 시작 날짜 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 ml-1">
              시작 날짜 (여기부터 3주)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* 입력 3: 주말 포함 토글 (UI만 구현) */}
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-gray-600 font-medium">주말 포함</span>
            <button
              onClick={() => setIncludeWeekend(!includeWeekend)}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                includeWeekend ? "bg-indigo-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  includeWeekend ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 방 만들기 버튼 */}
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg"
          >
            {loading ? "생성 중..." : "방 만들기 🐰"}
          </button>
        </div>
      </div>

      {/* 하단 팁 */}
      <div className="mt-8 text-center text-xs text-gray-400 space-y-1">
        <p>TIP.</p>
        <p>3주간 일정을 다시 변경하거나...</p>
        <p>불참자가 최소인 날짜를 정해서 일정조율을 해보세요!</p>
      </div>
    </div>
  );
}
