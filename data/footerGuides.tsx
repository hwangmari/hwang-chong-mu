import { ReactNode } from "react";

/** 팁 아이템 타입 (FooterGuide.tsx와 동일한 구조) */
interface TipItem {
  icon: ReactNode;
  title: string;
  description: ReactNode;
}

interface GuideData {
  title: string;
  story?: {
    title: string;
    content: ReactNode;
    solution?: {
      title: string;
      content: ReactNode;
    };
  };
  tips: TipItem[];
}

export const GAME_GUIDE_DATA: GuideData = {
  title: "🎲 상황별 게임 즐기기 꿀팁",
  story: {
    title: "🤔 심심한데 내기나 한판?",
    content: <>간단하지만 잼난 내기 한판으로 ~!</>,
    solution: {
      title: "📱 폰 하나로 끝내거나, 📡 다같이 접속하거나!",
      content:
        "내 폰으로 바로 결과를 보는 '빠른 시작', 친구들이 각자 접속해서 대결하는 '방 만들기'. 상황에 맞춰 골라보세요.",
    },
  },
  tips: [
    {
      icon: "🚀",
      title: "초간편 '빠른 시작'",
      description:
        "방 만들기도 귀찮을 때! 멤버 이름만 쏙쏙 넣고 바로 돌려보세요. 사다리나 룰렛처럼 한 화면에서 결과를 볼 때 딱이에요.",
    },
    {
      icon: "🏰",
      title: "다함께 '방 만들기'",
      description:
        "각자 참여해야 제맛! 텔레파시나 광클 대전처럼 여럿이 동시에 대결할 땐 방을 만들어 초대하세요.",
    },
    {
      icon: "🪜",
      title: "운명의 '사다리 타기'",
      description:
        "점심 메뉴 고르기부터 벌칙자 선정까지, 하늘에 운을 맡기고 싶을 때 추천! (빠른 시작 추천)",
    },
    {
      icon: "🎡",
      title: "긴장감 백배 '돌림판'",
      description:
        "회식비 몰아주기 한판? 돌아가는 휠을 보며 심장이 쫄깃해지는 경험을 해보세요. (빠른 시작 추천)",
    },
    {
      icon: "🔥",
      title: "승부욕 폭발 '광클 대전'",
      description:
        "졸린 오후 커피 내기! 손가락 빠른 사람이 승리하는 단순 무식 피지컬 게임.",
    },
    {
      icon: "🔮",
      title: "이심전심 '텔레파시'",
      description:
        "너랑 나랑 얼마나 잘 맞을까? 취향도 알아보고 틀린 사람은 벌칙 한 잔!",
    },
  ],
};

export const CALC_GUIDE_DATA: GuideData = {
  title: "💡 정산 꿀팁, 이렇게 써보세요!",
  tips: [
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
        "누가, 어디서, 무엇을 썼는지 기록하여 깔끔한 정산을 만드세요.",
    },
  ],
};

export const MEETING_GUIDE_DATA: GuideData = {
  title: "🍯 약속 잡기 꿀팁",
  story: {
    title: "🤔 왜 만들었냐구요?",
    content: (
      <>
        <b>&quot;이 날 어때?&quot;</b> 하면 철수가 안 되고,
        <br />
        <b>&quot;그럼 이 날은?&quot;</b> 하면 영희가 안 되고...🤦‍♂️
        <br />이 무한 루프가 답답해서 직접 만들었어요!
      </>
    ),
    solution: {
      title: "💡 황총무의 솔루션",
      content: (
        <>
          다들 바빠서 &apos;되는 날&apos; 찾기가 너무 힘들죠?
          <br />
          <b>역발상이 필요합니다!</b>
          <br />
          &quot;다들 들어와서{" "}
          <span style={{ color: "#ef4444", textDecoration: "underline" }}>
            안 되는 날(❌)
          </span>
          만 찍어줘! 남는 날이 우리가 만날 날이야!&quot;
        </>
      ),
    },
  },
  tips: [
    {
      icon: "💳",
      title: "이럴 때 유용해요!",
      description: (
        <>
          &quot;이번 달 안에 법카 써야 해!&quot;
          <br />
          기간 내 데드라인이 있는 약속 잡기 딱 좋아요.
        </>
      ),
    },
    {
      icon: "🙅‍♂️",
      title: "전원 참석이 힘든가요?",
      description:
        "'불참자 최소' 날짜를 골라보세요. 완벽한 날보단 함께하는 날이 중요하니까요!",
    },
  ],
};

export const HABIT_GUIDE_DATA: GuideData = {
  title: "💡 습관 방, 이렇게 써보세요!",
  tips: [
    {
      icon: "👀",
      title: "눈으로 보는 성취감",
      description:
        "머릿속 의지는 약하지만, 눈에 보이는 기록은 강력해요. 하루하루 채워지는 잔디를 보며 동기부여를 얻으세요.",
    },
    {
      icon: "🐣",
      title: "작은 것부터 시작하기",
      description:
        "'매일 10km 뛰기'보다는 '밖에 나가기'부터! 아주 사소한 목표라도 꾸준히 체크하는 게 중요해요.",
    },
    {
      icon: "🎨",
      title: "나만의 컬러로 물들이기",
      description:
        "내가 가장 좋아하는 색을 골라보세요. 달력이 그 색으로 가득 찰 때의 짜릿함을 느껴보세요!",
    },
    {
      icon: "🔖",
      title: "출석부로 쓰기",
      description:
        "목표 이름에 '푸바오, 루이, 후이' 처럼 친구 이름을 적어보세요. 서로의 출석률을 체크하며 선의의 경쟁을 할 수 있어요! 특히 운동 메이트 참석률 체크를 추천해요.",
    },
    {
      icon: "✏️",
      title: "기록은 기억을 이긴다",
      description:
        "그날의 컨디션, 날씨, 핑계거리 무엇이든 좋아요. 짧게라도 남겨두면 나중에 나를 분석하는 훌륭한 데이터가 됩니다.",
    },
  ],
};

export const DIET_GUIDE_DATA: GuideData = {
  title: "⚖️ 체중 관리 필승 전략 (100g의 법칙)",
  tips: [
    {
      icon: "☀️",
      title: "하루 2번, '기상 후 공복 ·취침 전' 몸무게 측정",
      description: (
        <>
          아침(공복) 몸무게와 밤(자기 전) 몸무게의 차이를 알면 내 몸의 대사량을
          알 수 있어요.
          <br />
          &apos;밤 무게 - 다음날 아침 무게&apos;가 줄어들었다면 성공적인
          다이어트 중이란 증거예요!
        </>
      ),
    },
    {
      icon: "🌙",
      title: "자면서도 살이 빠진다는 사실, 아시나요?",
      description: (
        <>
          우리는 잠을 자는 동안에도 에너지를 씁니다(기초대사량).
          <br />
          숙면만 취해도 밤사이 수분과 탄수화물이 분해되어 체중이 자연스럽게
          줄어들어요. 건강한 몸은 자는 동안 수분과 탄수화물을 태워요.
        </>
      ),
    },
    {
      icon: "📉",
      title: "'100g'이 줄어든 날을 찾으세요",
      description:
        "체중이 100g이라도 줄어든 날, 그날 먹은 음식과 활동을 꼭 기억하세요. 그 행동을 반복하는 것이 요요 없는 감량의 핵심입니다.",
    },
    {
      icon: "🚨",
      title: "몸무게가 그대로라면 '야식'과 '염분'을 의심해보세요.",
      description:
        "아침 무게가 줄지 않았다면, 늦은 시간에 먹었거나 짠 음식 때문에 몸이 부은 상태일 수 있어요. 오늘 저녁은 조금 더 가볍게 드셔보세요!",
    },
    {
      icon: "🏃‍♂️",
      title: "건강한 다이어트는 '멈추지 않는 것'",
      description:
        "어제 조금 많이 먹었더라도 포기하지 마세요. 작심삼일도 100번 반복하면 300일입니다! 기록을 멈추지 않고 내 몸을 마주하는 의지가 가장 중요해요. 💪",
    },
  ],
};
