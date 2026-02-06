"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { supabase } from "@/lib/supabase";
import CreateButton from "@/components/common/CreateButton";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Input from "@/components/common/Input";
import FooterGuide from "@/components/common/FooterGuide";
import {
  StContainer,
  StSection,
  StWrapper,
} from "@/components/styled/layout.styled";
import PageIntro, { StHighlight } from "@/components/common/PageIntro"; // StHighlight 임포트 확인 필요
import { GAME_GUIDE_DATA } from "@/data/footerGuides";

// ✨ 게임 목록 데이터
const GAME_OPTIONS = [
  { id: "ladder", name: "사다리 타기", icon: "🪜", desc: "운명의 짝대기 긋기" },
  { id: "wheel", name: "돌림판", icon: "🎡", desc: "빙글빙글 복불복" },
];

export default function GameLobbyPage() {
  const router = useRouter();

  // ✨ 화면 모드 상태: 'SELECT'(메인) | 'CREATE'(방만들기) | 'QUICK_LIST'(게임고르기)
  const [viewMode, setViewMode] = useState("SELECT");

  const [roomTitle, setRoomTitle] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("my_nickname");
    if (savedName) setNickname(savedName);
  }, []);

  // 1. 방 만들기 로직
  const createRoom = async () => {
    if (!roomTitle) return alert("방 제목을 입력해주세요!");
    if (!nickname) return alert("닉네임을 입력해주세요!");
    if (!password) return alert("비밀번호를 입력해주세요!");

    setLoading(true);

    try {
      const newRoomCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      // 방 생성
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .insert([
          { room_code: newRoomCode, title: roomTitle, game_type: "telepathy" },
        ])
        .select()
        .single();

      if (roomError) throw roomError;

      // 방장 참가
      const { data: participant, error: pError } = await supabase
        .from("game_participants")
        .insert([
          {
            room_id: room.id,
            nickname,
            password,
            message: message || "방장 등판!",
            is_host: true,
          },
        ])
        .select()
        .single();

      if (pError) throw pError;

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

  // 2. 빠른 게임 선택 시 처리
  const handleSelectQuickGame = (gameId: string) => {
    router.push(`/game/quick/${gameId}`);
  };

  // 3. 공통 뒤로가기 버튼 컴포넌트
  const BackButton = () => (
    <StBackButton onClick={() => setViewMode("SELECT")}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
      모드 선택으로
    </StBackButton>
  );

  return (
    <StContainer>
      <StWrapper>
        {/* ✨ 하이라이트가 적용된 소개 문구 */}
        <PageIntro
          icon="🎮"
          title="황총무 게임방"
          description={
            <>
              바로 결과를 보는 <StHighlight $color="red">빠른 시작</StHighlight>
              , <br />
              친구들이 각자 접속해서 대결하는{" "}
              <StHighlight $color="blue">방 만들기</StHighlight>. 상황에 맞춰
              골라보세요.
            </>
          }
        />

        {/* 1️⃣ 메인 선택 화면 */}
        {viewMode === "SELECT" && (
          <StSection>
            <StSectionTitle>👇 게임 모드 선택</StSectionTitle>
            <StModeContainer>
              <StModeCard
                onClick={() => setViewMode("QUICK_LIST")}
                color="#FF6B6B"
              >
                <div className="icon">🚀</div>
                <div className="text">
                  <strong>빠른 시작</strong>
                  <span>설정 없이 바로 게임 고르기</span>
                </div>
              </StModeCard>

              <StModeCard onClick={() => setViewMode("CREATE")} color="#4D96FF">
                <div className="icon">🏰</div>
                <div className="text">
                  <strong>방 만들기</strong>
                  <span>친구 모아서 시작하기</span>
                </div>
              </StModeCard>
            </StModeContainer>
          </StSection>
        )}

        {/* 2️⃣ 빠른 시작 > 게임 리스트 화면 (여기가 추가된 부분) */}
        {viewMode === "QUICK_LIST" && (
          <StSection>
            <BackButton />
            <StSectionTitle>🎲 어떤 게임을 할까요?</StSectionTitle>

            <StGameGrid>
              {GAME_OPTIONS.map((game) => (
                <StGameItem
                  key={game.id}
                  onClick={() => handleSelectQuickGame(game.id)}
                >
                  <span className="icon">{game.icon}</span>
                  <div className="info">
                    <strong>{game.name}</strong>
                    <small>{game.desc}</small>
                  </div>
                </StGameItem>
              ))}
            </StGameGrid>
          </StSection>
        )}

        {/* 3️⃣ 방 만들기 설정 화면 (여기가 기존 폼 부분) */}
        {viewMode === "CREATE" && (
          <StSection>
            <BackButton />
            <StSectionTitle>👇 방 만들기 설정</StSectionTitle>
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
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  방 만들고 입장하기 <ArrowForwardIcon fontSize="small" />
                </span>
              </CreateButton>
            </StButtonWrapper>
          </StSection>
        )}

        <FooterGuide
          title={GAME_GUIDE_DATA.title}
          story={GAME_GUIDE_DATA.story}
          tips={GAME_GUIDE_DATA.tips}
        />
      </StWrapper>
    </StContainer>
  );
}

// --- ✨ 스타일 컴포넌트 모음 (모두 합침) ---

const StSectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1rem;
`;

const StModeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StModeCard = styled.div`
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background-color: white;
  border-radius: 12px;
  border: 2px solid #eee;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-2px);
    border-color: ${(props) => props.color};
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }

  .icon {
    font-size: 2.5rem;
    margin-right: 1.2rem;
  }

  .text {
    display: flex;
    flex-direction: column;

    strong {
      font-size: 1.2rem;
      margin-bottom: 0.3rem;
      color: #333;
    }

    span {
      font-size: 0.9rem;
      color: #666;
    }
  }
`;

const StGameGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 0.5rem;

  @media (max-width: 400px) {
    grid-template-columns: 1fr;
  }
`;

const StGameItem = styled.div`
  background: white;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-3px);
    border-color: #ff6b6b;
    box-shadow: 0 5px 15px rgba(255, 107, 107, 0.2);
  }

  .icon {
    font-size: 2.5rem;
    margin-bottom: 0.8rem;
  }

  .info {
    strong {
      display: block;
      font-size: 1.1rem;
      margin-bottom: 0.3rem;
      color: #333;
    }
    small {
      font-size: 0.85rem;
      color: #888;
      line-height: 1.3;
    }
  }
`;

const StBackButton = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 1.5rem;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 6px;

  transition: color 0.2s ease;

  &:hover {
    color: #333;
    svg {
      transform: translateX(-4px);
    }
  }
  svg {
    display: block;
    transition: transform 0.2s ease;
  }
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
