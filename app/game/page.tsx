"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { supabase } from "@/lib/supabase";
import CreateButton from "@/components/common/CreateButton";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Input } from "@hwangchongmu/ui";
import FooterGuide from "@/components/common/FooterGuide";
import {
  StContainer,
  StSection,
  StPageWrapper,
  StFlexBox,
} from "@/components/styled/layout.styled";
import PageIntro, { StHighlight } from "@/components/common/PageIntro"; // StHighlight 임포트 확인 필요
import { GAME_GUIDE_DATA } from "@/data/footerGuides";
import { useModal } from "@/components/common/ModalProvider";
import { linkRoomToAccount } from "@/lib/roomServices";

const GAME_OPTIONS = [
  { id: "ladder", name: "사다리 타기", icon: "🪜", desc: "운명의 짝대기 긋기" },
  { id: "wheel", name: "돌림판", icon: "🎡", desc: "빙글빙글 복불복" },
];

export default function GameLobbyPage() {
  const router = useRouter();
  const { openAlert } = useModal();

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

  const createRoom = async () => {
    if (!roomTitle) {
      await openAlert("방 제목을 입력해주세요!");
      return;
    }
    if (!nickname) {
      await openAlert("닉네임을 입력해주세요!");
      return;
    }
    if (!password) {
      await openAlert("비밀번호를 입력해주세요!");
      return;
    }

    setLoading(true);

    try {
      const newRoomCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();

      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .insert([
          { room_code: newRoomCode, title: roomTitle, game_type: "telepathy" },
        ])
        .select()
        .single();

      if (roomError) throw roomError;

      // 방장도 일반 참가와 같은 서버 함수로 들어간다.
      // 방금 만든 빈 방이라 첫 참가자인 방장이 자동으로 방장 표시를 받는다.
      // 비밀번호는 서버에서 암호화해 저장하고, 브라우저로는 돌아오지 않는다.
      const { data: participant, error: pError } = await supabase.rpc(
        "game_join",
        {
          p_room_id: room.id,
          p_nickname: nickname,
          p_password: password,
          p_message: message || "방장 등판!",
        },
      );

      if (pError) throw pError;
      if (!participant?.id) throw new Error("NO_PARTICIPANT");

      localStorage.setItem("my_id", participant.id);
      localStorage.setItem("my_nickname", nickname);

      // 로그인 사용자면 내 계정의 "내 방"에 자동 등록(비로그인은 서버가 401 → 무시)
      // 방 비밀번호는 저장하지 않는다. 다시 들어갈 때 한 번 더 물어본다.
      linkRoomToAccount("game", room.id, roomTitle);

      router.push(`/game/${room.id}`);
    } catch (error) {
      console.error(error);
      await openAlert("방 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuickGame = (gameId: string) => {
    router.push(`/game/quick/${gameId}`);
  };

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
      <StPageWrapper>
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

        <StFlexBox>
          <div className="flex-lft-box">
            {/* 1️⃣ 메인 선택 화면 */}
            {viewMode === "SELECT" && (
              <StSection>
                <StSectionTitle>👇 게임 모드 선택</StSectionTitle>
                <StModeContainer>
                  <StModeCard onClick={() => setViewMode("QUICK_LIST")}>
                    <div className="icon">🚀</div>
                    <div className="text">
                      <strong>빠른 시작</strong>
                      <span>설정 없이 바로 게임 고르기</span>
                    </div>
                  </StModeCard>

                  <StModeCard onClick={() => setViewMode("CREATE")}>
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
          </div>

          {/* 데스크톱에서는 오른쪽에 가이드를 붙여 화면을 채운다 */}
          <div className="flex-rgt-box">
            <FooterGuide
              title={GAME_GUIDE_DATA.title}
              story={GAME_GUIDE_DATA.story}
              tips={GAME_GUIDE_DATA.tips}
              layout="compact"
            />
          </div>
        </StFlexBox>
      </StPageWrapper>
    </StContainer>
  );
}

const StSectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
  margin-bottom: 0.85rem;
`;

const StModeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const StModeCard = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 0.9rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background-color: ${({ theme }) => theme.semantic.bg};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  .icon {
    flex-shrink: 0;
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 0.7rem;
    background: ${({ theme }) => theme.semantic.bg};
    border: 1px solid ${({ theme }) => theme.semantic.border};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    line-height: 1;
    margin-right: 0.75rem;
  }

  .text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;

    strong {
      font-size: 0.95rem;
      font-weight: 800;
      color: ${({ theme }) => theme.semantic.text};
    }

    span {
      font-size: 0.82rem;
      color: ${({ theme }) => theme.semantic.subText};
    }
  }
`;

const StGameGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
  margin-top: 0.25rem;
`;

const StGameItem = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.9rem;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background-color: ${({ theme }) => theme.semantic.bg};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  .icon {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
    line-height: 1;
  }

  .info {
    strong {
      display: block;
      font-size: 0.92rem;
      font-weight: 800;
      margin-bottom: 0.2rem;
      color: ${({ theme }) => theme.semantic.text};
    }
    small {
      font-size: 0.8rem;
      color: ${({ theme }) => theme.semantic.subText};
      line-height: 1.4;
      word-break: keep-all;
    }
  }
`;

const StBackButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.semantic.subText};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 0.85rem;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 6px;

  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.semantic.text};
  }
  svg {
    display: block;
  }
`;

const StInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StDivider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.semantic.border};
  margin: 1.5rem 0;
`;

const StButtonWrapper = styled.div`
  margin-top: 1.25rem;
`;
