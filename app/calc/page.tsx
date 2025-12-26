"use client";
import { useState } from "react";
import FooterGuide from "@/components/common/FooterGuide";
import {
  StContainer,
  StSection,
  StWrapper,
} from "@/components/styled/layout.styled";
import PageIntro, { StHighlight } from "@/components/common/PageIntro";
import { useCalcPersistence } from "@/hooks/useCalcPersistence";
import CreateButton from "@/components/common/CreateButton";
import Input from "@/components/common/Input";

export default function CreateRoomPage() {
  // const router = useRouter(); // 훅 내부에서 처리함
  const [roomName, setRoomName] = useState("");

  // ★ 훅 연결하기
  const { createRoom, loading } = useCalcPersistence();

  const handleCreate = () => {
    if (!roomName.trim()) {
      alert("모임 이름을 입력해주세요!");
      return;
    }

    // ★ DB에 저장 요청 (이동은 훅이 알아서 해줌)
    createRoom(roomName);
  };

  return (
    <StContainer>
      <StWrapper>
        {/* 1. 메인 카드 영역 */}
        <StSection>
          <PageIntro
            icon="💸"
            title="황총무의 똑똑한 엔빵"
            description={
              <>
                누가 누구에게 얼마를? 머리 아픈 계산은 이제 그만!
                <br />
                <StHighlight $color="red">복잡한 송금</StHighlight> 대신{" "}
                <StHighlight $color="blue">최소한의 이체</StHighlight>로
                끝내보세요 &apos;ㅅ&apos;/
              </>
            }
          />
          <Input
            placeholder="예: 강릉 여행, 팀 회식, 30주년 동창회"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
            disabled={loading}
          />

          <CreateButton
            onClick={handleCreate}
            isLoading={loading}
            className="mt-4"
          >
            정산 방 만들기 ➔
          </CreateButton>
        </StSection>

        {/* 2. 하단 가이드 (작성해주신 내용 그대로 적용) */}
        <FooterGuide
          title="💡 정산 꿀팁, 이렇게 써보세요!"
          tips={[
            {
              icon: "🧮",
              title: "머리 아픈 계산은 맡기세요",
              description:
                "누가 누구에게 얼마를? 복잡한 꼬리 물기 식 송금은 이제 그만! 최소한의 이체 횟수로 끝내는 '최적의 경로'를 알려드려요.",
            },
            {
              icon: "🔗",
              title: "링크 하나로 공유 끝",
              description:
                "앱 설치도, 로그인도 필요 없어요. 정산이 끝나면 링크만 복사해서 단톡방에 툭! 친구들도 바로 결과를 확인할 수 있어요.",
            },
            {
              icon: "💸",
              title: "공금과 개인 돈 구분하기",
              description:
                "다 같이 먹은 식사는 '공동', 나 혼자 산 기념품은 '개인'. 지출 성격을 구분해두면 정산에서 자동으로 제외되어 편리해요.",
            },
            {
              icon: "🧐",
              title: "투명한 영수증 관리",
              description:
                "'이거 무슨 돈이야?' 나중에 딴소리 없도록! 누가, 어디서, 무엇을 썼는지 기록하여 모두가 납득하는 깔끔한 정산을 만드세요.",
            },
          ]}
        />
      </StWrapper>
    </StContainer>
  );
}
