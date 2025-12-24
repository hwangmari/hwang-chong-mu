// hooks/useCalcPersistence.ts
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ExpenseType } from "@/types"; // 타입 정의 필요 (아래 참고)

interface Expense {
  id: number;
  payer: string;
  description: string;
  amount: number;
  type: ExpenseType;
}

export const useCalcPersistence = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 1. 데이터 저장하기 (Create)
  const saveRoomData = async (members: string[], expenses: Expense[]) => {
    if (members.length === 0) {
      alert("멤버를 최소 1명 이상 추가해주세요!");
      return;
    }

    setLoading(true);
    try {
      // 1-1. 정산 방(Room) 생성
      const { data: roomData, error: roomError } = await supabase
        .from("calc_rooms")
        .insert([{ room_name: "황총무 정산" }]) // 필요시 이름 입력받기 가능
        .select()
        .single();

      if (roomError) throw roomError;
      const roomId = roomData.id;

      // 1-2. 멤버 저장
      const memberInserts = members.map((name) => ({
        room_id: roomId,
        name: name,
      }));
      const { error: memberError } = await supabase
        .from("calc_members")
        .insert(memberInserts);

      if (memberError) throw memberError;

      // 1-3. 지출 내역 저장
      if (expenses.length > 0) {
        const expenseInserts = expenses.map((e) => ({
          room_id: roomId,
          payer: e.payer,
          description: e.description,
          amount: e.amount,
          type: e.type,
        }));

        const { error: expenseError } = await supabase
          .from("calc_expenses")
          .insert(expenseInserts);

        if (expenseError) throw expenseError;
      }

      alert("저장되었습니다! URL을 복사해서 공유하세요. 🔗");

      // 저장된 방의 ID가 포함된 URL로 이동 (새로고침 해도 유지됨)
      router.push(`/calc/${roomId}`);
    } catch (error) {
      console.error("저장 중 오류 발생:", error);
      alert("저장에 실패했습니다. 😭");
    } finally {
      setLoading(false);
    }
  };

  // 2. 데이터 불러오기 (Read) - [id]/page.tsx 에서 사용
  const fetchRoomData = async (roomId: string) => {
    setLoading(true);
    try {
      // 멤버 조회
      const { data: memberData, error: memberError } = await supabase
        .from("calc_members")
        .select("name")
        .eq("room_id", roomId);

      if (memberError) throw memberError;

      // 지출 조회
      const { data: expenseData, error: expenseError } = await supabase
        .from("calc_expenses")
        .select("*")
        .eq("room_id", roomId)
        .order("id", { ascending: true });

      if (expenseError) throw expenseError;

      return {
        members: memberData.map((m) => m.name),
        expenses: expenseData.map((e) => ({
          id: e.id,
          payer: e.payer,
          description: e.description,
          amount: e.amount,
          type: e.type as ExpenseType,
        })),
      };
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      alert("데이터를 불러오지 못했습니다.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { saveRoomData, fetchRoomData, loading };
};
