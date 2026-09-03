// 야근 계산기 데이터 접근 모듈.
// 방 코드(roomRef = "슬러그-단축코드" 또는 uuid)만으로 읽고 쓰며, 비밀번호는 쓰지 않는다.
// 야근 페이지의 훅(hooks/useOvertimePersistence)과 홈 대시보드가 같은 함수를 함께 쓴다.
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

// 방 생성: 단축코드가 겹치면(23505) 다시 뽑아 최대 5번 시도한다.
export async function createOvertimeRoom(
  roomName: string,
): Promise<OvertimeRoomInfo> {
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
}

// 방 정보 + 기록 전체를 읽는다. 방 코드만 있으면 되고 비밀번호는 필요하지 않다.
export async function fetchOvertimeRoomData(roomRef: string): Promise<{
  room: OvertimeRoomInfo;
  records: OvertimeRoomRecord[];
}> {
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

  return { room, records };
}

export async function replaceOvertimeRoomRecords(
  roomId: string,
  records: OvertimeRoomRecord[],
): Promise<void> {
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
}
