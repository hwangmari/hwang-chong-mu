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

  const createRoom = async (roomName: string) => {
    setLoading(true);
    try {
      const { data: roomData, error: roomError } = await supabase
        .from("calc_rooms")
        .insert([{ room_name: roomName }]) // 여기가 핵심!
        .select()
        .single();

      if (roomError) throw roomError;

      const newRoomId = roomData.id;

      router.push(`/calc/${newRoomId}`);
    } catch (error) {
      console.error("생성 실패:", error);
      alert("방 생성에 실패했습니다. 😭");
    } finally {
      setLoading(false);
    }
  };

  const updateRoomData = async (
    roomId: string,
    members: string[],
    expenses: Expense[],
  ) => {
    try {
      console.log("자동 저장 시작...", roomId); // 디버깅용 로그
      const { error } = await supabase.rpc("calc_replace_room_data", {
        p_room_id: roomId,
        p_members: members,
        p_expenses: expenses.map((e) => ({
          payer: e.payer,
          description: e.description,
          amount: e.amount,
          type: e.type,
        })),
      });
      if (error) {
        console.error("RPC 오류 상세:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }
      console.log("자동 저장 완료 ✅");
    } catch (error) {
      console.error("업데이트 실패:", error);
    }
  };


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

  return { createRoom, updateRoomData, fetchRoomData, loading };
};
