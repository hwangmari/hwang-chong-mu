import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useModal } from "@/components/common/ModalProvider";

export default function useGameRoom(roomId: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openAlert, openConfirm } = useModal();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [roomData, setRoomData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [participants, setParticipants] = useState<any[]>([]);
  const [myId, setMyId] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);

  const [joinName, setJoinName] = useState("");
  const [joinPw, setJoinPw] = useState("");
  const [joinMsg, setJoinMsg] = useState("");
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState<"waiting" | "countdown" | "playing">(
    "waiting"
  );
  const [count, setCount] = useState(3);
  const [selectedGame, setSelectedGame] = useState("telepathy");
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);


  useEffect(() => {
    const isGameOn = searchParams.get("game") === "on";
    if (!isGameOn && status === "playing") {
      if (isHost) handleEndGame(false);
      else setStatus("waiting");
    }
  }, [searchParams, status, isHost]);

  useEffect(() => {
    if (!roomId) return;
    const storedId = localStorage.getItem("my_id");
    const storedName = localStorage.getItem("my_nickname");
    if (storedId) setMyId(storedId);
    if (storedName) setJoinName(storedName);
    fetchRoomData();
    return subscribeRealtime();
  }, [roomId]);

  useEffect(() => {
    if (status === "countdown") {
      if (count > 0) {
        const timer = setTimeout(() => setCount((c) => c - 1), 1000);
        return () => clearTimeout(timer);
      } else setStatus("playing");
    }
  }, [status, count]);


  const fetchRoomData = async () => {
    const { data: room } = await supabase
      .from("game_rooms")
      .select("*")
      .eq("id", roomId)
      .single();
    if (room) {
      setRoomData(room);
      setSelectedGame(room.game_type || "telepathy");
      if (room.status === "playing") setStatus("playing");
    }
    const { data: members } = await supabase
      .from("game_participants")
      .select("*")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: true });
    if (members) {
      setParticipants(members);
      const myStoredId = localStorage.getItem("my_id");
      const me = members.find((m) => m.id === myStoredId);
      if (me) {
        setIsJoined(true);
        if (me.is_host) setIsHost(true);
      } else setIsJoined(false);
    }
  };

  const subscribeRealtime = () => {
    const channel = supabase
      .channel(`room_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_participants",
          filter: `room_id=eq.${roomId}`,
        },
        () => fetchRoomData()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const newRoom = payload.new;
          setRoomData(newRoom);
          setSelectedGame(newRoom.game_type);
          if (
            newRoom.status === "playing" &&
            statusRef.current !== "playing" &&
            statusRef.current !== "countdown"
          ) {
            setStatus("countdown");
            setCount(3);
          } else if (newRoom.status === "waiting") {
            setStatus("waiting");
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  };


  const handleJoin = async () => {
    if (!joinName || !joinPw) {
      await openAlert("필수 입력값을 확인해주세요.");
      return;
    }
    setLoading(true);
    try {
      const existing = participants.find((p) => p.nickname === joinName);
      if (existing) {
        if (existing.password === joinPw) {
          localStorage.setItem("my_id", existing.id);
          localStorage.setItem("my_nickname", joinName);
          setMyId(existing.id);
          setIsJoined(true);
          if (existing.is_host) setIsHost(true);
        } else await openAlert("비밀번호 불일치");
        return;
      }
      const { data, error } = await supabase
        .from("game_participants")
        .insert([
          {
            room_id: roomId,
            nickname: joinName,
            password: joinPw,
            message: joinMsg,
            is_host: false,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      localStorage.setItem("my_id", data.id);
      localStorage.setItem("my_nickname", joinName);
      setMyId(data.id);
      setIsJoined(true);
    } catch (e) {
      console.error(e);
      await openAlert("오류 발생");
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = async () => {
    if (!guestName.trim()) return;
    if (participants.find((p) => p.nickname === guestName)) {
      await openAlert("이미 있는 이름입니다.");
      return;
    }
    try {
      await supabase.from("game_participants").insert([
        {
          room_id: roomId,
          nickname: guestName,
          password: "guest",
          message: "깍두기 🎲",
          is_host: false,
        },
      ]);
      setGuestName("");
    } catch (e) {
      await openAlert("추가 실패");
    }
  };

  const handleKickParticipant = async (targetId: string, name: string) => {
    if (!(await openConfirm(`'${name}' 님을 삭제하시겠습니까?`))) return;
    setParticipants((prev) => prev.filter((p) => p.id !== targetId));
    try {
      await supabase.from("game_participants").delete().eq("id", targetId);
    } catch (e) {
      fetchRoomData();
    }
  };

  const handleSelectGame = async (gameId: string) => {
    if (!isHost) return;
    await supabase
      .from("game_rooms")
      .update({ game_type: gameId })
      .eq("id", roomId);
  };

  const handleStartGame = async () => {
    await supabase
      .from("game_participants")
      .update({ score: 0, selected_answer: null })
      .eq("room_id", roomId);
    await supabase
      .from("game_rooms")
      .update({
        status: "playing",
        current_question: null,
        is_result_open: false,
      })
      .eq("id", roomId);
    window.history.pushState(null, "", "?game=on");
  };

  const handleEndGame = async (needConfirm = true) => {
    if (needConfirm && !(await openConfirm("게임을 종료할까요?"))) return;
    await supabase
      .from("game_rooms")
      .update({ status: "waiting" })
      .eq("id", roomId);
    if (searchParams.get("game") === "on") router.back();
  };

  return {
    roomData,
    participants,
    myId,
    isJoined,
    isHost,
    status,
    count,
    selectedGame,
    loading,
    joinName,
    setJoinName,
    joinPw,
    setJoinPw,
    joinMsg,
    setJoinMsg,
    guestName,
    setGuestName,
    handleJoin,
    handleAddGuest,
    handleKickParticipant,
    handleSelectGame,
    handleStartGame,
    handleEndGame,
  };
}
