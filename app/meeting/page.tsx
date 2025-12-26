"use client";

import RoomForm from "@/app/meeting/create-room/RoomForm";
import useCreateRoom from "@/hooks/useCreateRoom";
import FooterGuide from "@/components/common/FooterGuide"; // ✅ 공통 컴포넌트

// 아이콘 불러오기
import CreditCardIcon from "@mui/icons-material/CreditCard";
import GroupOffIcon from "@mui/icons-material/GroupOff";
import {
  StWrapper,
  StContainer,
  StSection,
} from "@/components/styled/layout.styled";
import PageIntro, { StHighlight } from "@/components/common/PageIntro";

export default function CreateRoomPage() {
  const {
    formData,
    loading,
    handleChange,
    createRoom,
    isCustomPeriod,
    setIsCustomPeriod,
  } = useCreateRoom();

  return (
    <StContainer>
      <StWrapper>
        <StSection>
          <PageIntro
            icon="📅"
            title="황총무의 약속 잡기"
            description={
              <>
                여러명이서 약속 잡기 힘드시죠? 황총무가 깔끔하게 정리해드려요!
                <br />
                소거법으로 <StHighlight $color="red">
                  안 되는 날
                </StHighlight>{" "}
                빼고 <StHighlight $color="blue">되는 날</StHighlight>을
                정해보세욥 &apos;ㅅ&apos;/
              </>
            }
          />
          <RoomForm
            formData={formData}
            loading={loading}
            onChange={handleChange}
            onSubmit={createRoom}
            isCustomPeriod={isCustomPeriod}
            setIsCustomPeriod={setIsCustomPeriod}
          />
        </StSection>

        {/* ✅ 공통 가이드 컴포넌트 사용 */}
        <FooterGuide
          title="🍯 약속 잡기 꿀팁"
          story={{
            title: "🤔 왜 만들었냐구요?",
            content: (
              <p>
                <b>&quot;이 날 어때?&quot;</b> 하면 철수가 안 되고,
                <br />
                <b>&quot;그럼 이 날은?&quot;</b> 하면 영희가 안 되고...🤦‍♂️
                <br />이 무한 루프가 답답해서 직접 만들었어요!
              </p>
            ),
            solution: {
              title: "💡 황총무의 솔루션",
              content: (
                <p>
                  다들 바빠서 &apos;되는 날&apos; 찾기가 너무 힘들죠?
                  <br />
                  <b>역발상이 필요합니다!</b>
                  <br />
                  &quot;다들 들어와서{" "}
                  <span
                    style={{ color: "#ef4444", textDecoration: "underline" }}
                  >
                    안 되는 날(❌)
                  </span>
                  만 찍어줘! 남는 날이 우리가 만날 날이야!&quot;
                </p>
              ),
            },
          }}
          tips={[
            {
              icon: <CreditCardIcon sx={{ color: "#f59e0b" }} />,
              title: "이럴 때 유용해요!",
              description: (
                <>
                  &quot;이번 달 안에 법카 써야 해! 💳&quot;
                  <br />
                  기간 내 데드라인이 있는 약속 잡기 딱 좋아요.
                </>
              ),
            },
            {
              icon: <GroupOffIcon sx={{ color: "#ef4444" }} />,
              title: "전원 참석이 힘든가요?",
              description:
                "'불참자 최소' 날짜를 골라보세요. 완벽한 날보단 함께하는 날이 중요하니까요!",
            },
          ]}
        />
        {/* <AdBanner /> */}
      </StWrapper>
    </StContainer>
  );
}
