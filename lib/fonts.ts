// 메인 화면 제목용 글꼴. 안내판·공지 글씨 느낌의 한글 서체(Do Hyeon)를 제목에만 쓰고, 본문은 기존 시스템 글꼴을 유지한다.
import { Do_Hyeon } from "next/font/google";

export const displayFont = Do_Hyeon({
  weight: "400",
  subsets: ["latin"], // 한글 글리프는 구글 폰트가 나눠 주는 조각(unicode-range)으로 함께 내려온다
  display: "swap",
  variable: "--font-display",
});
