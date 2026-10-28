"use client";

import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { px } from "./pixelSprites";

// ───── 응원석 (주인 요청 2026-10-28 "벤치 응원석에 이 녀석들이 응원하게") ─────
// 주인이 보낸 그림의 다섯 친구를 닮은 꼬마들: 잎사귀 새싹이 · 노란 꼬마 공룡은 오리지널(다른 회사 캐릭터를 그대로 베끼지 않음),
// 분홍 비버·옥지·빵빵이는 주인이 보낸 사진·그림의 생김새를 따랐다.
const CW = 160;
const CH = 36;
function drawCheer(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.clearRect(0, 0, CW, CH);
  const up = (i: number) => ((frame + i) % 2 === 0 ? 0 : 1); // 번갈아 통통
  // 바닥·벤치
  px(ctx, 0, 31, CW, 5, "#bfe3ff");
  px(ctx, 10, 26, 140, 3, "#a8763e");
  px(ctx, 10, 26, 140, 1, "#c99558");
  for (const lx of [16, 52, 88, 124, 144]) px(ctx, lx, 29, 3, 4, "#7a5230");
  // 양옆 수건 더미
  px(ctx, 0, 24, 8, 3, "#9be07a"); px(ctx, 0, 27, 8, 2, "#ffffff"); px(ctx, 0, 29, 8, 2, "#d6dde2");
  px(ctx, 152, 25, 8, 3, "#ff9fbf"); px(ctx, 152, 28, 8, 2, "#ffffff"); px(ctx, 152, 30, 8, 1, "#ff9fbf");

  // ① 잎사귀 새싹이 — 파란 동글 몸 + 초록 잎
  {
    const x = 16, y = 14 + up(0);
    const sway = frame % 2 ? 1 : -1;
    px(ctx, x + 4 + sway, y - 7, 2, 5, "#3e9e4f");
    px(ctx, x + 1, y - 5, 3, 4, "#5cc46b");
    px(ctx, x + 7, y - 5, 3, 4, "#5cc46b");
    px(ctx, x - 1 + sway, y - 3, 3, 2, "#7bd389");
    px(ctx, x + 9 + sway, y - 3, 3, 2, "#7bd389");
    px(ctx, x + 1, y, 9, 8, "#5b8fd6");
    px(ctx, x, y + 2, 11, 5, "#5b8fd6");
    px(ctx, x + 3, y + 3, 1, 1, "#1b1b1b"); px(ctx, x + 7, y + 3, 1, 1, "#1b1b1b");
    px(ctx, x + 2, y + 5, 1, 1, "#ff9fbf"); px(ctx, x + 8, y + 5, 1, 1, "#ff9fbf");
    px(ctx, x + 2, y + 8, 2, 2, "#4a78b8"); px(ctx, x + 7, y + 8, 2, 2, "#4a78b8");
  }
  // ② 노란 꼬마 공룡
  {
    const x = 42, y = 10 + up(1);
    px(ctx, x + 1, y, 10, 7, "#f6d32b");
    px(ctx, x + 9, y + 3, 4, 4, "#f6d32b"); // 주둥이
    px(ctx, x + 6, y + 2, 2, 2, "#2e9e5e"); px(ctx, x + 7, y + 2, 1, 1, "#1b1b1b");
    px(ctx, x + 10, y + 6, 3, 1, "#c99a12");
    px(ctx, x + 2, y + 7, 9, 9, "#f6d32b");
    px(ctx, x + 4, y + 9, 5, 6, "#fff3c4"); // 배
    px(ctx, x, y + 9 - up(1), 2, 4, "#f6d32b"); px(ctx, x + 11, y + 8 - up(1), 2, 4, "#f6d32b"); // 팔
    px(ctx, x + 12, y + 8 - up(1), 1, 1, "#ffffff");
    px(ctx, x + 3, y + 16, 3, 1, "#ffffff"); px(ctx, x + 8, y + 16, 3, 1, "#ffffff"); // 발톱
  }
  // ③ 분홍 비버 — 주인이 보낸 사진처럼: 머리 위 삐죽 털 · 둥근 귀 · 한쪽 윙크 · 큰 자줏빛 코 · 빼꼼 혀 ·
  //    하얀 배 · 목걸이 · 한 손 들어 인사 · 보라 발 (2026-10-28)
  {
    const x = 65, y = 3 + up(2);
    const PINK = "#f39bb0", PINK_D = "#e27f98", wave = frame % 2;
    px(ctx, x + 7, y, 1, 2, PINK_D); px(ctx, x + 8, y - 1, 1, 3, PINK_D); px(ctx, x + 9, y, 1, 2, PINK_D); // 삐죽 털
    px(ctx, x + 1, y + 1, 3, 3, PINK_D); px(ctx, x + 13, y + 1, 3, 3, PINK_D); // 둥근 귀
    px(ctx, x + 2, y + 2, 1, 1, "#f7b8c7"); px(ctx, x + 14, y + 2, 1, 1, "#f7b8c7");
    px(ctx, x + 2, y + 2, 13, 10, PINK); // 넓적한 머리
    px(ctx, x + 1, y + 4, 15, 6, PINK);
    px(ctx, x + 5, y + 6, 2, 2, "#2b2b2b"); px(ctx, x + 5, y + 6, 1, 1, "#ffffff"); // 뜬 눈
    px(ctx, x + 10, y + 7, 1, 1, "#2b2b2b"); px(ctx, x + 11, y + 6, 1, 1, "#2b2b2b"); px(ctx, x + 12, y + 7, 1, 1, "#2b2b2b"); // 윙크
    px(ctx, x + 7, y + 8, 3, 1, "#8e4a6a"); px(ctx, x + 6, y + 9, 5, 2, "#8e4a6a"); px(ctx, x + 7, y + 9, 1, 1, "#b36d8c"); // 큰 코
    px(ctx, x + 8, y + 11, 2, 1, "#e05a6a"); // 빼꼼 혀
    px(ctx, x + 3, y + 12, 11, 9, PINK); // 몸
    px(ctx, x + 5, y + 14, 7, 6, "#fff5f7"); // 하얀 배
    px(ctx, x + 6, y + 12, 1, 1, "#e05a6a"); px(ctx, x + 10, y + 12, 1, 1, "#e05a6a"); // 목걸이 줄
    px(ctx, x + 8, y + 13, 1, 2, "#ffffff"); // 목걸이 패
    px(ctx, x + 1, y + 13, 2, 5, PINK); px(ctx, x + 1, y + 18, 2, 1, "#5a3a4a"); // 내린 팔
    // 머리 옆으로 든 인사 손 (손톱 세 개)
    px(ctx, x + 15, y + 7 + wave, 2, 6, PINK);
    px(ctx, x + 15, y + 5 + wave, 3, 2, PINK);
    px(ctx, x + 15, y + 4 + wave, 1, 1, "#5a3a4a"); px(ctx, x + 16, y + 4 + wave, 1, 1, "#5a3a4a"); px(ctx, x + 17, y + 5 + wave, 1, 1, "#5a3a4a");
    px(ctx, x + 3, y + 21, 4, 1, "#6b4a6e"); px(ctx, x + 10, y + 21, 4, 1, "#6b4a6e"); // 보라 발
  }
  // 소용돌이 눈 3×3 (빵빵이·옥지 특유의 멍한 눈)
  const swirl = (ex: number, ey: number) => {
    px(ctx, ex, ey, 3, 3, "#ffffff");
    px(ctx, ex, ey, 2, 1, "#3a2a22");
    px(ctx, ex + 2, ey + 1, 1, 2, "#3a2a22");
    px(ctx, ex + 1, ey + 1, 1, 1, "#3a2a22");
  };
  // ④ 옥지 — 주인이 보낸 그림처럼: 웨이브 갈색 머리 · 소용돌이 눈 · 빨간 입술 · 노란 긴팔 · 검은 치마 · 빨간 구두 · 초록 병 (2026-10-28)
  {
    const x = 92, y = 3 + up(3);
    const HAIR = "#6b3f2a", HAIR_HI = "#8a5536", FACE = "#f7d9be";
    px(ctx, x + 4, y, 10, 2, HAIR);
    px(ctx, x + 2, y + 2, 14, 11, HAIR);
    px(ctx, x, y + 7, 18, 6, HAIR);
    px(ctx, x, y + 13, 4, 2, HAIR); px(ctx, x + 14, y + 13, 4, 2, HAIR); // 바깥으로 뻗친 끝
    px(ctx, x + 5, y + 1, 3, 1, HAIR_HI);
    px(ctx, x + 5, y + 3, 9, 9, FACE);
    px(ctx, x + 4, y + 5, 11, 5, FACE);
    px(ctx, x + 5, y + 3, 5, 1, HAIR); // 옆 가르마
    swirl(x + 5, y + 5);
    swirl(x + 10, y + 5);
    px(ctx, x + 9, y + 8, 1, 1, "#c98f6a"); // 코
    px(ctx, x + 5, y + 9, 2, 1, "#ff9fbf"); px(ctx, x + 12, y + 9, 2, 1, "#ff9fbf");
    px(ctx, x + 8, y + 10, 3, 1, "#d9454f"); // 빨간 입술
    // 노란 긴팔 · 병 든 손
    px(ctx, x + 5, y + 12, 8, 6, "#f2d132");
    px(ctx, x + 3, y + 13, 2, 4, "#f2d132"); px(ctx, x + 13, y + 12 - up(3), 2, 4, "#f2d132");
    px(ctx, x + 3, y + 17, 2, 1, FACE);
    px(ctx, x + 3, y + 11, 2, 6, "#3fae4a"); px(ctx, x + 3, y + 10, 2, 1, "#2e8a38"); px(ctx, x + 3, y + 13, 2, 2, "#ffffff"); // 초록 병
    px(ctx, x + 4, y + 18, 10, 3, "#1b1b1b"); // 검은 치마
    px(ctx, x + 6, y + 21, 1, 1, FACE); px(ctx, x + 11, y + 21, 1, 1, FACE);
    px(ctx, x + 5, y + 22, 2, 1, "#d9454f"); px(ctx, x + 11, y + 22, 2, 1, "#d9454f"); // 빨간 구두
  }
  // ⑤ 빵빵이 — 머리카락 한 가닥 · 큰 동그란 머리 · 소용돌이 눈 · 빨간 입술 · 초록 티 · 청바지 · 갈색 신발 · 초록 병, 한 손은 만세
  {
    const x = 122, y = 2 + up(4);
    const wave = frame % 2;
    const FACE = "#f7d9be";
    px(ctx, x + 6, y, 1, 2, "#1b1b1b"); px(ctx, x + 7, y - 1, 1, 1, "#1b1b1b"); // 머리카락 한 가닥
    px(ctx, x + 2, y + 2, 10, 11, FACE);
    px(ctx, x + 1, y + 4, 12, 7, FACE);
    px(ctx, x, y + 7, 1, 2, FACE); // 귀
    swirl(x + 3, y + 6);
    swirl(x + 8, y + 6);
    px(ctx, x + 7, y + 9, 1, 1, "#c98f6a"); // 코
    px(ctx, x + 2, y + 10, 2, 1, "#ff9fbf"); px(ctx, x + 10, y + 10, 2, 1, "#ff9fbf");
    px(ctx, x + 6, y + 11, 3, 1, "#d9454f"); // 빨간 입술
    // 초록 티 · 병 든 손 · 만세 손
    px(ctx, x + 2, y + 13, 10, 6, "#3f8f3f");
    px(ctx, x + 7, y + 11, 2, 6, "#3fae4a"); px(ctx, x + 7, y + 13, 2, 2, "#ffffff"); // 입에 댄 초록 병
    px(ctx, x + 6, y + 15, 2, 2, FACE);
    px(ctx, x + 12, y + 9 - wave * 2, 2, 5, "#3f8f3f"); px(ctx, x + 12, y + 8 - wave * 2, 2, 1, FACE);
    px(ctx, x + 2, y + 19, 10, 3, "#2f5aa8"); // 청바지
    px(ctx, x + 1, y + 22, 4, 1, "#7a4a2a"); px(ctx, x + 9, y + 22, 4, 1, "#7a4a2a"); // 갈색 신발
  }
}

/**
 * 응원석 꼬마들 — 대회 화면 탭 줄 위 빈자리에 작게 (주인 요청 2026-10-28 "애들 더 작게 해서 탭 위 빈 공간에").
 * 동작 줄이기 설정이면 멈춘 그림.
 */
export default function CheerSquad() {
  const [moving] = useState(
    () => typeof window === "undefined" || !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    if (!moving) {
      drawCheer(ctx, 0);
      return;
    }
    let raf = 0;
    const loop = (t: number) => {
      drawCheer(ctx, Math.floor(t / 420));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [moving]);
  return <StCheerCanvas ref={ref} width={CW} height={CH} role="img" aria-label="응원석에서 꼬마 친구들이 응원하고 있어요" />;
}


// 탭 줄 바로 위 오른쪽에 작게 — 탭과 겹치지 않게 아래 여백만 조금 당긴다
const StCheerCanvas = styled.canvas`
  display: block;
  width: 200px;
  max-width: 50vw;
  aspect-ratio: ${CW} / ${CH};
  image-rendering: pixelated;
`;
