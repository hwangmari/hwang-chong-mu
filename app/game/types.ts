// game_participants / game_rooms 테이블 형태를 나타내는 공용 타입
export interface GameParticipant {
  id: string;
  nickname: string;
  is_host?: boolean;
  message?: string;
  password?: string;
  score?: number;
  selected_answer?: "A" | "B" | null;
}

export interface GameRoomData {
  id?: string;
  title?: string;
  game_type?: string;
  status?: "waiting" | "countdown" | "playing";
  current_question?: string | null;
  is_result_open: boolean;
}
