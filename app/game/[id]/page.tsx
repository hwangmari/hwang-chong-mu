"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { supabase } from "@/lib/supabase";
import CreateButton from "@/components/common/CreateButton";
import Input from "@/components/common/Input";
import TelepathyGame from "../components/TelepathyGame";
import ClickerGame from "../components/ClickerGame";
import WheelGame from "../components/WheelGame";
import LadderGame from "../components/LadderGame";
import { StContainer, StWrapper } from "@/components/styled/layout.styled";

// 게임 종류
const GAME_TYPES = [
  {
    id: "telepathy",
    name: "텔레파시",
    emoji: "🔮",
    desc: "찌찌뽕! 우리 얼마나 잘 통할까?",
  },
  {
    id: "clicker",
    name: "광클 대전",
    emoji: "🔥",
    desc: "누가 제일 손가락이 빠를까?",
  },
  {
    id: "wheel",
    name: "복불복 돌림판",
    emoji: "🎡",
    desc: "오늘의 벌칙 당첨자는 누구?",
  },
  {
    id: "ladder",
    name: "사다리 타기",
    emoji: "🪜",
    desc: "운명의 사다리를 타보자!",
  }, // ✨ 추가
];
export default function GameRoomPage() {
  const params = useParams();
  const roomId = params?.id as string;

  // 데이터 상태
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [roomData, setRoomData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [participants, setParticipants] = useState<any[]>([]);

  // 내 상태
  const [myId, setMyId] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);

  // 폼 상태
  const [joinName, setJoinName] = useState("");
  const [joinPw, setJoinPw] = useState("");
  const [joinMsg, setJoinMsg] = useState("");

  // ✨ 게스트 추가 폼 상태 (방장용)
  const [guestName, setGuestName] = useState("");

  const [loading, setLoading] = useState(false);

  // 게임 상태
  const [status, setStatus] = useState<"waiting" | "countdown" | "playing">(
    "waiting"
  );
  const [count, setCount] = useState(3);
  const [selectedGame, setSelectedGame] = useState("telepathy");

  // 1. 초기 로드
  useEffect(() => {
    if (!roomId) return;

    const storedId = localStorage.getItem("my_id");
    const storedName = localStorage.getItem("my_nickname");
    if (storedId) setMyId(storedId);
    if (storedName) setJoinName(storedName);

    fetchRoomData();
    subscribeRealtime();
  }, [roomId]);

  // 2. 데이터 가져오기
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
      } else {
        setIsJoined(false);
      }
    }
  };

  // 3. 실시간 구독
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
            status !== "playing" &&
            status !== "countdown"
          ) {
            setStatus("countdown");
            setCount(3);
          } else if (newRoom.status === "waiting") {
            setStatus("waiting");
          }
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  };

  // 4. 타이머
  useEffect(() => {
    if (status === "countdown") {
      if (count > 0) setTimeout(() => setCount((c) => c - 1), 1000);
      else setStatus("playing");
    }
  }, [status, count]);

  // --- 핸들러 ---
  const handleJoin = async () => {
    if (!joinName || !joinPw) return alert("닉네임과 비밀번호는 필수입니다!");
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
        } else {
          alert("비밀번호가 틀렸습니다!");
        }
        setLoading(false);
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
      alert("오류 발생");
    } finally {
      setLoading(false);
    }
  };

  // ✨ [NEW] 방장이 게스트 직접 추가
  const handleAddGuest = async () => {
    if (!guestName.trim()) return;

    // 중복 체크
    if (participants.find((p) => p.nickname === guestName)) {
      return alert("이미 있는 이름입니다.");
    }

    try {
      await supabase.from("game_participants").insert([
        {
          room_id: roomId,
          nickname: guestName,
          password: "guest", // 게스트용 더미 비번
          message: "깍두기 🎲",
          is_host: false,
        },
      ]);
      setGuestName(""); // 입력창 초기화
    } catch (e) {
      console.error(e);
      alert("추가 실패");
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
  };

  const handleEndGame = async () => {
    if (confirm("대기실로 돌아가시겠습니까?")) {
      await supabase
        .from("game_rooms")
        .update({ status: "waiting" })
        .eq("id", roomId);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("방 링크가 복사되었습니다!");
  };

  // --- 렌더링 ---

  if (status === "playing") {
    return (
      <StContainer>
        <StWrapper>
          {selectedGame === "telepathy" && (
            <TelepathyGame
              roomId={roomId}
              isHost={isHost}
              myId={myId}
              participants={participants}
              roomData={roomData}
              onEndGame={handleEndGame}
            />
          )}
          {selectedGame === "clicker" && (
            <ClickerGame
              roomId={roomId}
              isHost={isHost}
              myId={myId}
              participants={participants}
              onEndGame={handleEndGame}
            />
          )}
          {selectedGame === "wheel" && (
            <WheelGame
              roomId={roomId}
              isHost={isHost}
              participants={participants}
              roomData={roomData}
              onEndGame={handleEndGame}
            />
          )}
          {selectedGame === "ladder" && (
            <LadderGame
              roomId={roomId}
              isHost={isHost}
              participants={participants}
              roomData={roomData}
              onEndGame={handleEndGame}
            />
          )}
        </StWrapper>
      </StContainer>
    );
  }

  return (
    <StContainer>
      <StWrapper>
        <StBoardHeader>
          <StRoomTitle>{roomData?.title || "게임방"}</StRoomTitle>
          <StShareButton onClick={copyLink}>🔗 링크 복사</StShareButton>
        </StBoardHeader>

        <StGameSection>
          <StLabel>👇 오늘의 게임</StLabel>
          {isHost ? (
            <StGameGrid>
              {GAME_TYPES.map((g) => (
                <StGameCard
                  key={g.id}
                  $active={selectedGame === g.id}
                  onClick={() => handleSelectGame(g.id)}
                >
                  <StCardEmoji>{g.emoji}</StCardEmoji>
                  <StCardContent>
                    <StCardTitle>{g.name}</StCardTitle>
                    <StCardDesc>{g.desc}</StCardDesc>
                  </StCardContent>
                  {selectedGame === g.id && <StCheck>✔</StCheck>}
                </StGameCard>
              ))}
            </StGameGrid>
          ) : (
            <StSelectedGameBanner>
              {(() => {
                const game = GAME_TYPES.find((g) => g.id === selectedGame);
                return (
                  <>
                    <StBannerEmoji>{game?.emoji}</StBannerEmoji>
                    <StBannerText>
                      <StBannerTitle>{game?.name}</StBannerTitle>
                      <StBannerDesc>{game?.desc}</StBannerDesc>
                    </StBannerText>
                  </>
                );
              })()}
            </StSelectedGameBanner>
          )}
        </StGameSection>

        <StParticipantBoard>
          <StParticipantHeader>
            <StLabel style={{ marginBottom: 0 }}>
              참가자 ({participants.length}명)
            </StLabel>
          </StParticipantHeader>

          {/* ✨ 방장 전용: 게스트 추가 입력창 */}
          {selectedGame === "wheel" && (
            <>
              {isHost && (
                <StGuestInputWrapper>
                  <StGuestInput
                    placeholder="이름만 입력해서 추가 (예: 철수)"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddGuest()}
                  />
                  <StGuestAddButton onClick={handleAddGuest}>
                    +
                  </StGuestAddButton>
                </StGuestInputWrapper>
              )}
            </>
          )}

          <StList>
            {participants.map((p) => (
              <StCommentRow key={p.id} $isMe={p.id === myId}>
                <StAvatar>{p.is_host ? "👑" : "🙂"}</StAvatar>
                <StBubble>
                  <StName>{p.nickname}</StName>
                  {p.message && <StMessage>{p.message}</StMessage>}
                </StBubble>
              </StCommentRow>
            ))}
            {participants.length === 0 && (
              <StEmpty>아직 아무도 없어요.</StEmpty>
            )}
          </StList>
        </StParticipantBoard>

        <StFooterAction>
          {isJoined ? (
            isHost ? (
              <CreateButton onClick={handleStartGame}>
                게임 시작하기 🚀
              </CreateButton>
            ) : (
              <StWaitingMsg>방장님이 시작하길 기다리는 중...</StWaitingMsg>
            )
          ) : (
            <StJoinForm>
              <StJoinTitle>✋ 참가 신청서</StJoinTitle>
              <StFormRow>
                <Input
                  placeholder="닉네임"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                />
                <Input
                  placeholder="비번(4자리)"
                  type="password"
                  value={joinPw}
                  onChange={(e) => setJoinPw(e.target.value)}
                />
              </StFormRow>
              <Input
                placeholder="한마디 (선택)"
                value={joinMsg}
                onChange={(e) => setJoinMsg(e.target.value)}
              />
              <CreateButton onClick={handleJoin} isLoading={loading}>
                등록하기
              </CreateButton>
            </StJoinForm>
          )}
        </StFooterAction>
        {selectedGame === "wheel" && (
          <>
            {status === "countdown" && (
              <StDimOverlay>
                <StCountNumber>{count === 0 ? "GO!" : count}</StCountNumber>
                <StCountText>
                  {GAME_TYPES.find((g) => g.id === selectedGame)?.name} 시작!
                </StCountText>
              </StDimOverlay>
            )}
          </>
        )}
      </StWrapper>
    </StContainer>
  );
}

// ✨ 스타일 정의
const StBoardHeader = styled.div`
  padding: 1.5rem 1.5rem 0.5rem;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;
const StRoomTitle = styled.h1`
  font-size: 1.4rem;
  font-weight: 900;
  color: #333;
  flex: 1;
  word-break: break-all;
  margin-right: 1rem;
`;
const StShareButton = styled.button`
  background: #f1f3f5;
  color: #495057;
  border: none;
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  font-size: 0.8rem;
  flex-shrink: 0;
  white-space: nowrap;
`;

const StGameSection = styled.div`
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #eee;
`;
const StLabel = styled.span`
  font-size: 0.85rem;
  color: #888;
  font-weight: bold;
  display: block;
  margin-bottom: 0.8rem;
`;
const StGameGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
`;
const StGameCard = styled.div<{ $active: boolean }>`
  border: 2px solid ${({ $active }) => ($active ? "#3b82f6" : "#e9ecef")};
  background: ${({ $active }) => ($active ? "#f8faff" : "white")};
  border-radius: 16px;
  padding: 1rem;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
`;
const StCardEmoji = styled.div`
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
`;
const StCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;
const StCardTitle = styled.h4`
  font-size: 0.95rem;
  font-weight: bold;
  color: #333;
`;
const StCardDesc = styled.p`
  font-size: 0.75rem;
  color: #888;
  line-height: 1.3;
  word-break: keep-all;
`;
const StCheck = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  color: #3b82f6;
  font-weight: bold;
  font-size: 1.2rem;
`;
const StSelectedGameBanner = styled.div`
  background: #fff;
  border: 2px solid #333;
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;
const StBannerEmoji = styled.div`
  font-size: 2rem;
`;
const StBannerText = styled.div`
  display: flex;
  flex-direction: column;
`;
const StBannerTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 900;
  color: #333;
`;
const StBannerDesc = styled.p`
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.2rem;
`;

const StParticipantBoard = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
`;
const StParticipantHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;
const StGuestInputWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;
const StGuestInput = styled.input`
  flex: 1;
  padding: 0.8rem;
  border-radius: 12px;
  border: 1px solid #ddd;
  font-size: 0.9rem;
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;
const StGuestAddButton = styled.button`
  background: #333;
  color: white;
  border: none;
  width: 40px;
  border-radius: 12px;
  font-size: 1.2rem;
  cursor: pointer;
`;

const StList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;
`;
const StCommentRow = styled.div<{ $isMe: boolean }>`
  display: flex;
  gap: 0.8rem;
  align-items: flex-start;
  flex-direction: ${({ $isMe }) => ($isMe ? "row-reverse" : "row")};
`;
const StAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
`;
const StBubble = styled.div`
  background: white;
  padding: 0.8rem 1rem;
  border-radius: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
  max-width: 80%;
  display: flex;
  flex-direction: column;
`;
const StName = styled.span`
  font-weight: bold;
  font-size: 0.9rem;
  color: #333;
`;
const StMessage = styled.span`
  font-size: 0.9rem;
  color: #555;
  margin-top: 0.2rem;
  word-break: break-word;
  line-height: 1.4;
`;
const StEmpty = styled.p`
  text-align: center;
  color: #aaa;
  margin-top: 2rem;
`;

const StFooterAction = styled.div`
  padding: 1.5rem;
  z-index: 10;
`;
const StWaitingMsg = styled.p`
  text-align: center;
  color: #888;
  font-weight: 500;
  animation: blink 2s infinite;
  @keyframes blink {
    50% {
      opacity: 0.5;
    }
  }
`;
const StJoinForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;
const StJoinTitle = styled.h3`
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 0.2rem;
`;
const StFormRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;
const StDimOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;
const StCountNumber = styled.div`
  font-size: 6rem;
  font-weight: 900;
  color: #ffd700;
`;
const StCountText = styled.p`
  font-size: 1.5rem;
  margin-top: 1rem;
  color: #fff;
  font-weight: 600;
`;
