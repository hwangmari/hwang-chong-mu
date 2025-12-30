"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { supabase } from "@/lib/supabase";
import CreateButton from "@/components/common/CreateButton";
import Input from "@/components/common/Input";

export default function GameLobbyPage() {
  const router = useRouter();

  const [roomTitle, setRoomTitle] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(""); // 한마디

  const [loading, setLoading] = useState(false);

  // 이전에 쓰던 정보 불러오기
  useEffect(() => {
    const savedName = localStorage.getItem("my_nickname");
    if (savedName) setNickname(savedName);
  }, []);

  // 방 만들기 (모집글 게시)
  const createRoom = async () => {
    if (!roomTitle) return alert("방 제목을 입력해주세요! (예: 2차 내기 ㄱㄱ)");
    if (!nickname) return alert("닉네임을 입력해주세요!");
    if (!password) return alert("비밀번호를 입력해주세요!");

    setLoading(true);

    try {
      const newRoomCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      // 1. 방 생성 (제목 포함)
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .insert([
          {
            room_code: newRoomCode,
            title: roomTitle, // ✨ 방 제목 저장
            game_type: "telepathy", // 기본값
          },
        ])
        .select()
        .single();

      if (roomError) throw roomError;

      // 2. 방장 참가 (댓글 포함)
      const { data: participant, error: pError } = await supabase
        .from("game_participants")
        .insert([
          {
            room_id: room.id,
            nickname,
            password,
            message: message || "방장 등판!", // ✨ 한마디 저장
            is_host: true,
          },
        ])
        .select()
        .single();

      if (pError) throw pError;

      // 3. 로컬 저장 및 이동
      localStorage.setItem("my_id", participant.id);
      localStorage.setItem("my_nickname", nickname);

      router.push(`/game/${room.id}`);
    } catch (error) {
      console.error(error);
      alert("방 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StContainer>
      <StHeader>
        <StLogo>🎮</StLogo>
        <StTitle>황총무 게임방</StTitle>
        <StDesc>친구들을 초대해서 한판 붙자!</StDesc>
      </StHeader>

      <StCard>
        <StSectionTitle>👇 방 만들기</StSectionTitle>

        <StInputGroup>
          <Input
            label="방 제목 (필수)"
            placeholder="예: 커피 내기"
            value={roomTitle}
            onChange={(e) => setRoomTitle(e.target.value)}
          />
        </StInputGroup>

        <StDivider />

        <StSectionTitle>👤 내 정보</StSectionTitle>
        <StInputGroup>
          <Input
            label="닉네임"
            placeholder="이름"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <Input
            label="비밀번호"
            placeholder="재접속용 (숫자 4자리)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="한마디 (선택)"
            placeholder="각오 한마디!"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </StInputGroup>

        <StButtonWrapper>
          <CreateButton onClick={createRoom} isLoading={loading}>
            방 만들고 입장하기 ➔
          </CreateButton>
        </StButtonWrapper>
      </StCard>
    </StContainer>
  );
}

// ✨ 스타일
const StContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 2rem 1rem;
  background-color: #f0f2f5;
`;
const StHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;
const StLogo = styled.div`
  font-size: 3rem;
  margin-bottom: 0.5rem;
  animation: bounce 2s infinite;
  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;
const StTitle = styled.h1`
  font-size: 2rem;
  font-weight: 900;
  color: #111;
  margin-bottom: 0.5rem;
`;
const StDesc = styled.p`
  color: #666;
  font-size: 1rem;
`;
const StCard = styled.div`
  background: white;
  width: 100%;
  max-width: 450px;
  padding: 2rem;
  border-radius: 24px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
`;
const StSectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1rem;
`;
const StInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;
const StDivider = styled.hr`
  border: none;
  border-top: 1px solid #eee;
  margin: 2rem 0;
`;
const StButtonWrapper = styled.div`
  margin-top: 2rem;
`;
