// app/create-room/useCreateRoom.ts
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function useCreateRoom() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isCustomPeriod, setIsCustomPeriod] = useState(false);

  const [formData, setFormData] = useState({
    roomName: "",
    startDate: "",
    endDate: "",
    includeWeekend: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const createRoom = async () => {
    const { roomName, startDate, endDate, includeWeekend } = formData;

    // 1. 기본 유효성 검사
    if (!roomName.trim()) {
      alert("약속 이름을 입력해주세요! 😅");
      return;
    }
    if (!startDate) {
      alert("시작 날짜를 선택해주세요! 📅");
      return;
    }

    let finalEndDateString = "";

    if (isCustomPeriod) {
      // 커스텀 모드
      if (!endDate) {
        alert("종료 날짜를 선택해주세요! 🏁");
        return;
      }
      if (new Date(endDate) < new Date(startDate)) {
        alert("종료 날짜는 시작 날짜보다 빨라야 해요! ⏳");
        return;
      }
      finalEndDateString = endDate;
    } else {
      // 🔥 [수정 1] 3주차 일요일까지 자동 계산 로직
      const start = new Date(startDate);
      const dayOfWeek = start.getDay(); // 0(일) ~ 6(토)

      // 이번 주 일요일까지 남은 일수 계산
      // (일요일이면 0일, 월요일이면 6일 뒤가 일요일)
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

      // 이번 주 일요일 + 2주(14일) 더하기 = 총 3주차 일요일
      const totalDaysToAdd = daysUntilSunday + 14;

      const end = new Date(start);
      end.setDate(start.getDate() + totalDaysToAdd);

      finalEndDateString = end.toISOString().split("T")[0];
    }

    setLoading(true);

    try {
      // 2. Supabase DB 저장
      const { data, error } = await supabase
        .from("rooms")
        .insert([
          {
            name: roomName,
            start_date: startDate,
            end_date: finalEndDateString,
            include_weekend: includeWeekend, // 🔥 [수정 2] 주말 포함 여부 DB 전송 추가
          },
        ])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        router.push(`/meeting/room/${data[0].id}`);
      }
    } catch (error) {
      console.error("에러 발생:", error);
      alert("방 생성 중 오류가 발생했습니다. 😭");
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    isCustomPeriod,
    setIsCustomPeriod,
    handleChange,
    createRoom,
  };
}
