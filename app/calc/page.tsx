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
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Input from "@/components/common/Input";
import { CALC_GUIDE_DATA } from "@/data/footerGuides";

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
        <StSection>
          <Input
            placeholder="예: 강릉 여행"
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
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              정산 방 만들기 <ArrowForwardIcon fontSize="small" />
            </span>
          </CreateButton>
        </StSection>

        {/* 2. 하단 가이드 (작성해주신 내용 그대로 적용) */}
        <FooterGuide
          title={CALC_GUIDE_DATA.title}
          tips={CALC_GUIDE_DATA.tips}
        />
      </StWrapper>
    </StContainer>
  );
}
