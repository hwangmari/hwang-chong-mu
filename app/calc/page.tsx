"use client";
import { useState } from "react";
import ServiceLayout from "@/components/common/ServiceLayout";
import { StSection } from "@/components/styled/layout.styled";
import { StHighlight } from "@/components/common/PageIntro";
import { useCalcPersistence } from "@/hooks/useCalcPersistence";
import CreateButton from "@/components/common/CreateButton";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Input } from "@hwangchongmu/ui";
import { CALC_GUIDE_DATA } from "@/data/footerGuides";
import { useModal } from "@/components/common/ModalProvider";

export default function CreateRoomPage() {
  const [roomName, setRoomName] = useState("");
  const { openAlert } = useModal();

  const { createRoom, loading } = useCalcPersistence();

  const handleCreate = async () => {
    if (!roomName.trim()) {
      await openAlert("모임 이름을 입력해주세요!");
      return;
    }

    createRoom(roomName);
  };

  return (
    <ServiceLayout
      width="narrow"
      intro={{
        icon: "💸",
        title: "황총무의 여행 경비 계산기",
        description: (
          <>
            여행·모임 뒤에 누가 누구에게 얼마를? 머리 아픈 계산은 이제 그만!
            <br />
            <StHighlight $color="red">복잡한 송금</StHighlight> 대신{" "}
            <StHighlight $color="blue">최소한의 이체</StHighlight>로 끝내보세요
            &apos;ㅅ&apos;/
          </>
        ),
      }}
      guide={{
        title: CALC_GUIDE_DATA.title,
        tips: CALC_GUIDE_DATA.tips,
        blogGuideId: "split-bill-tips",
      }}
    >
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
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            정산 방 만들기 <ArrowForwardIcon fontSize="small" />
          </span>
        </CreateButton>
      </StSection>
    </ServiceLayout>
  );
}
