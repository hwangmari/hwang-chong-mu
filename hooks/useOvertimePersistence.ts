import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { createShortCode, isUuid, parseShortCode, toSlug } from "@/lib/slug";

export interface OvertimeRoomRecord {
  id: string;
  date: string;
  before10Minutes: number;
  after10Minutes: number;
  createdAt: string;
}

export interface OvertimeRoomInfo {
  id: string;
  roomName: string;
  slug: string;
  shortCode: string;
  roomRef: string;
  createdAt: string;
  updatedAt: string;
}

interface OvertimeRoomRow {
  id: string;
  room_name: string;
  slug: string | null;
  short_code: string | null;
  created_at: string;
  updated_at: string;
}

interface OvertimeRecordRow {
  id: string;
  entry_date: string;
  before10_minutes: number;
  after10_minutes: number;
  created_at: string;
}

function buildRoomInfo(room: OvertimeRoomRow): OvertimeRoomInfo {
  const slug = room.slug || toSlug(room.room_name || "overtime");
  const shortCode = room.short_code || "";

  return {
    id: room.id,
    roomName: room.room_name,
    slug,
    shortCode,
    roomRef: shortCode ? `${slug}-${shortCode}` : room.id,
    createdAt: room.created_at,
    updatedAt: room.updated_at,
  };
}

export function useOvertimePersistence() {
  const [loading, setLoading] = useState(false);

  const createRoom = useCallback(async (roomName: string) => {
    setLoading(true);

    try {
      const slug = toSlug(roomName);
      let created: OvertimeRoomRow | null = null;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const shortCode = createShortCode(6);
        const { data, error } = await supabase
          .from("overtime_rooms")
          .insert([{ room_name: roomName, slug, short_code: shortCode }])
          .select("*")
          .single();

        if (error) {
          if (error.code === "23505") {
            continue;
          }
          throw error;
        }

        created = data as OvertimeRoomRow;
        break;
      }

      if (!created) {
        throw new Error("방 코드 생성에 실패했습니다.");
      }

      return buildRoomInfo(created);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoomData = useCallback(async (roomRef: string) => {
    setLoading(true);

    try {
      let roomQuery = supabase.from("overtime_rooms").select("*");

      if (isUuid(roomRef)) {
        roomQuery = roomQuery.eq("id", roomRef);
      } else {
        const parsed = parseShortCode(roomRef.trim());
        if (!parsed) {
          throw new Error("올바른 방 코드가 아니에요.");
        }
        roomQuery = roomQuery.eq("short_code", parsed.code);
      }

      const { data: roomData, error: roomError } = await roomQuery.single();
      if (roomError) {
        throw roomError;
      }

      const room = buildRoomInfo(roomData as OvertimeRoomRow);

      const { data: recordData, error: recordError } = await supabase
        .from("overtime_records")
        .select("*")
        .eq("room_id", room.id)
        .order("entry_date", { ascending: true });

      if (recordError) {
        throw recordError;
      }

      const records = ((recordData || []) as OvertimeRecordRow[]).map((item) => ({
        id: item.id,
        date: item.entry_date,
        before10Minutes: item.before10_minutes,
        after10Minutes: item.after10_minutes,
        createdAt: item.created_at,
      }));

      return {
        room,
        records,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const replaceRoomRecords = useCallback(async (
    roomId: string,
    records: OvertimeRoomRecord[],
  ) => {
    setLoading(true);

    try {
      const payload = records.map((record) => ({
        date: record.date,
        before10Minutes: record.before10Minutes,
        after10Minutes: record.after10Minutes,
        createdAt: record.createdAt,
      }));

      const { error } = await supabase.rpc("overtime_replace_room_records", {
        p_room_id: roomId,
        p_records: payload,
      });

      if (error) {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createRoom,
    fetchRoomData,
    replaceRoomRecords,
    loading,
  };
}
