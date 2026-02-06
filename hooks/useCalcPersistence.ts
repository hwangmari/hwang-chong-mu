// hooks/useCalcPersistence.ts
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ExpenseType } from "@/types";

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

  // [CREATE] 1. 방 새로 만들기
  const createRoom = async (roomName: string) => {
    setLoading(true);
    try {
      // 1. 방 생성 (입력받은 이름으로 저장)
      const { data: roomData, error: roomError } = await supabase
        .from("calc_rooms")
        .insert([{ room_name: roomName }]) // 여기가 핵심!
        .select()
        .single();

      if (roomError) throw roomError;

      const newRoomId = roomData.id;

      // 2. 페이지 이동 (경로를 /calc/ 로 통일!)
      // 주의: 아까 만드신 폴더가 app/calc/[id] 라면 /calc/ 로 가야 합니다.
      router.push(`/calc/${newRoomId}`);
    } catch (error) {
      console.error("생성 실패:", error);
      alert("방 생성에 실패했습니다. 😭");
    } finally {
      setLoading(false);
    }
  };

  // [UPDATE] 2. 기존 방 데이터 업데이트 (이 함수가 꼭 있어야 해요!)
  const updateRoomData = async (
    roomId: string,
    members: string[],
    expenses: Expense[],
  ) => {
    try {
      console.log("자동 저장 시작...", roomId); // 디버깅용 로그
      // 1. 기존 데이터 삭제 (덮어쓰기 위해)
      await supabase.from("calc_members").delete().eq("room_id", roomId);
      await supabase.from("calc_expenses").delete().eq("room_id", roomId);

      // 2. 새로운 데이터 저장
      await saveDetailsToSupabase(roomId, members, expenses);
      console.log("자동 저장 완료 ✅");
    } catch (error) {
      console.error("업데이트 실패:", error);
    }
  };

  // [HELPER] 공통 저장 로직
  const saveDetailsToSupabase = async (
    roomId: string,
    members: string[],
    expenses: Expense[],
  ) => {
    if (members.length > 0) {
      const memberInserts = members.map((name) => ({ room_id: roomId, name }));
      const { error } = await supabase
        .from("calc_members")
        .insert(memberInserts);
      if (error) throw error;
    }
    if (expenses.length > 0) {
      const expenseInserts = expenses.map((e) => ({
        room_id: roomId,
        payer: e.payer,
        description: e.description,
        amount: e.amount,
        type: e.type,
      }));
      const { error } = await supabase
        .from("calc_expenses")
        .insert(expenseInserts);
      if (error) throw error;
    }
  };

  // [READ] 불러오기
  const fetchRoomData = async (roomId: string) => {
    setLoading(true);
    try {
      const { data: memberData } = await supabase
        .from("calc_members")
        .select("name")
        .eq("room_id", roomId);
      const { data: expenseData } = await supabase
        .from("calc_expenses")
        .select("*")
        .eq("room_id", roomId)
        .order("id", { ascending: true });

      return {
        members: memberData?.map((m) => m.name) || [],
        expenses:
          expenseData?.map((e) => ({
            id: e.id,
            payer: e.payer,
            description: e.description,
            amount: e.amount,
            type: e.type as ExpenseType,
          })) || [],
      };
    } catch (error) {
      console.error("로딩 실패:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ★★★ 여기 return에 updateRoomData가 포함되어 있어야 합니다!
  return { createRoom, updateRoomData, fetchRoomData, loading };
};
