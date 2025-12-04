// app/create-room/useCreateRoom.ts
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function useCreateRoom() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isCustomPeriod, setIsCustomPeriod] = useState(false); // 🔥 날짜 직접 지정 모드 여부

  const [formData, setFormData] = useState({
    roomName: "",
    startDate: "",
    endDate: "", // 🔥 종료 날짜 필드 추가
    includeWeekend: false,
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const createRoom = async () => {
    const { roomName, startDate, endDate } = formData;

    // 1. 기본 유효성 검사
    if (!roomName.trim()) {
      alert("약속 이름을 입력해주세요! 😅");
      return;
    }
    if (!startDate) {
      alert("시작 날짜를 선택해주세요! 📅");
      return;
    }

    // 🔥 종료 날짜 검증 로직 추가
    let finalEndDateString = "";

    if (isCustomPeriod) {
      // 커스텀 모드일 때: 종료 날짜 필수 확인 & 시작일보다 뒤인지 확인
      if (!endDate) {
        alert("종료 날짜를 선택해주세요! 🏁");
        return;
      }
      if (new Date(endDate) < new Date(startDate)) {
        alert("종료 날짜는 시작 날짜보다 빨라야 해요! ⏳"); // 혹은 같거나 뒤여야 함
        return;
      }
      finalEndDateString = endDate;
    } else {
      // 기본 모드(3주)일 때: 자동 계산
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 21); // 3주 더하기
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
            end_date: finalEndDateString, // 🔥 계산된 종료일 사용
          },
        ])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        router.push(`/room/${data[0].id}`);
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
    isCustomPeriod, // UI로 전달
    setIsCustomPeriod, // UI로 전달
    handleChange,
    createRoom,
  };
}
