"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { createShortCode, toSlug } from "@/lib/slug";

interface RoomLike {
  id: string;
  name: string;
  calc_room_id?: string | null;
  dinner_room_id?: string | null;
}

export function useRoomActions(room: RoomLike | null) {
  const router = useRouter();
  const [isCreatingSettlement, setIsCreatingSettlement] = useState(false);
  const [isCreatingDinner, setIsCreatingDinner] = useState(false);

  const handleCreateSettlement = useCallback(
    async (memberNames: string[], date: Date) => {
      if (isCreatingSettlement) return;
      if (!room) return;

      if (room.calc_room_id) {
        try {
          const { error: rpcError } = await supabase.rpc(
            "calc_replace_room_data",
            {
              p_room_id: String(room.calc_room_id),
              p_members: Array.from(new Set(memberNames)),
              p_expenses: [],
            },
          );
          if (rpcError) throw rpcError;
          router.push(`/calc/${room.calc_room_id}`);
        } catch (error) {
          console.error("정산 방 업데이트 실패:", error);
          alert(
            "정산 방 업데이트에 실패했습니다. 잠시 후 다시 시도해주세요.",
          );
        }
        return;
      }

      if (memberNames.length === 0) {
        alert("정산할 참석자가 없습니다.");
        return;
      }

      setIsCreatingSettlement(true);
      try {
        const roomName = `${room.name} ${format(date, "yyyy-MM-dd")}`;
        const { data: newRoom, error: roomError } = await supabase
          .from("calc_rooms")
          .insert([{ room_name: roomName }])
          .select()
          .single();
        if (roomError) throw roomError;

        const { error: updateError } = await supabase
          .from("rooms")
          .update({ calc_room_id: newRoom.id })
          .eq("id", room.id);
        if (updateError) throw updateError;

        const { error: rpcError } = await supabase.rpc(
          "calc_replace_room_data",
          {
            p_room_id: String(newRoom.id),
            p_members: Array.from(new Set(memberNames)),
            p_expenses: [],
          },
        );
        if (rpcError) throw rpcError;

        router.push(`/calc/${newRoom.id}`);
      } catch (error) {
        console.error("정산 방 생성 실패:", error);
        alert("정산 방 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setIsCreatingSettlement(false);
      }
    },
    [isCreatingSettlement, room, router],
  );

  const handleCreateDinnerRoom = useCallback(async () => {
    if (isCreatingDinner) return;
    if (!room) return;

    if (room.dinner_room_id) {
      const { data: existing } = await supabase
        .from("dinner_rooms")
        .select("id, slug, short_code")
        .eq("id", room.dinner_room_id)
        .single();
      if (existing) {
        const slug = existing.slug || toSlug(room.name);
        const code = existing.short_code;
        router.push(
          slug && code
            ? `/place/${slug}-${code}`
            : `/place/${room.dinner_room_id}`,
        );
        return;
      }
      await supabase
        .from("rooms")
        .update({ dinner_room_id: null })
        .eq("id", room.id);
    }

    setIsCreatingDinner(true);
    try {
      const dinnerSlug = toSlug(room.name);
      const dinnerShortCode = createShortCode();
      const { data: newDinnerRoom, error: dinnerError } = await supabase
        .from("dinner_rooms")
        .insert([
          {
            title: room.name,
            area: "",
            meeting_room_id: room.id,
            slug: dinnerSlug,
            short_code: dinnerShortCode,
          },
        ])
        .select()
        .single();
      if (dinnerError) throw dinnerError;

      const { error: updateError } = await supabase
        .from("rooms")
        .update({ dinner_room_id: newDinnerRoom.id })
        .eq("id", room.id);
      if (updateError) throw updateError;

      router.push(`/place/${dinnerSlug}-${dinnerShortCode}`);
    } catch (error) {
      console.error("장소투표 방 생성 실패:", error);
      alert("장소투표 방 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsCreatingDinner(false);
    }
  }, [isCreatingDinner, room, router]);

  return {
    isCreatingSettlement,
    isCreatingDinner,
    handleCreateSettlement,
    handleCreateDinnerRoom,
  };
}
