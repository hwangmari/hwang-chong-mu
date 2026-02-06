import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ExpenseType } from "@/types";
import { createShortCode, parseShortCode, toSlug, isUuid } from "@/lib/slug";

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
      const slug = toSlug(roomName);
      let created = null;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const shortCode = createShortCode(6);
        const { data: roomData, error: roomError } = await supabase
          .from("calc_rooms")
          .insert([{ room_name: roomName, slug, short_code: shortCode }])
          .select()
          .single();

        if (roomError) {
          if (roomError.code === "23505") {
            continue;
          }
          throw roomError;
        }
        created = roomData;
        break;
      }

      if (!created) {
        throw new Error("방 코드 생성에 실패했습니다.");
      }

      router.push(`/calc/${created.slug}-${created.short_code}`);
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
      let roomQuery = supabase.from("calc_rooms").select("*");
      if (isUuid(roomId)) {
        roomQuery = roomQuery.eq("id", roomId);
      } else {
        const parsed = parseShortCode(roomId);
        if (!parsed) throw new Error("잘못된 방 주소입니다.");
        roomQuery = roomQuery.eq("short_code", parsed.code);
      }
      const { data: roomData, error: roomError } = await roomQuery.single();
      if (roomError) throw roomError;

      const targetRoomId = roomData.id;

      const { data: memberData } = await supabase
        .from("calc_members")
        .select("name")
        .eq("room_id", targetRoomId);
      const { data: expenseData } = await supabase
        .from("calc_expenses")
        .select("*")
        .eq("room_id", targetRoomId)
        .order("id", { ascending: true });

      return {
        room: roomData,
        roomId: targetRoomId,
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
