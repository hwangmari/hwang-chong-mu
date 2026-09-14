"use client";

// 토이 프로젝트 한 줄의 오른쪽에 놓이는 미리보기 칸.
// "자세히 보기"를 누르기 전에도 그 서비스가 무엇을 하는지 움직임으로 보여 준다.
//
// 열다섯 줄 전부가 움직이는 장면을 갖는다.
//   - 다섯 줄은 첫 화면에서 쓰는 장면을 그대로 가져다 쓴다 (components/home/ToolDemo.tsx)
//   - 나머지 열 줄은 이 폴더의 toyScenes.tsx에 있다
// 예전에는 장면이 없는 줄에 스크린샷(느린 확대)이나 아이콘 타일을 넣었는데,
// 이제 쓰는 줄이 하나도 없어서 그 두 갈래는 걷어냈다.
//
// 움직임은 줄이 화면에 4분의 1쯤 들어왔을 때 시작한다(IntersectionObserver).
// 장면은 처음부터 그려 두고 멈춰(paused) 있다가 화면에 들어오면 재생한다 —
// 나중에 붙이면 칸 높이가 바뀌어 아래 줄이 밀리기 때문이다.

import { useEffect, useRef, useState, type ReactElement } from "react";
import styled, { css } from "styled-components";
import { DEMO_SCENES } from "@/components/home/ToolDemo";
import { TOY_SCENES } from "./toyScenes";
import type { ProjectImage } from "@/components/common/ProjectImageViewer";

// 카드 앵커 → 장면. ProjectList.tsx의 anchorId 열다섯 개와 일대일로 맞춰 둔다.
const SCENE_BY_ANCHOR: Record<string, () => ReactElement> = {
  "toy-my": TOY_SCENES.my,
  "toy-schedule": TOY_SCENES.schedule,
  "toy-meeting": DEMO_SCENES.meeting,
  "toy-place": TOY_SCENES.place,
  "toy-calc": DEMO_SCENES.calc,
  "toy-account-book": TOY_SCENES.accountBook,
  "toy-habit": TOY_SCENES.habit,
  "toy-daily": TOY_SCENES.daily,
  "toy-diet": TOY_SCENES.diet,
  "toy-workout": TOY_SCENES.workout,
  "toy-inbody": TOY_SCENES.inbody,
  "toy-game": TOY_SCENES.game,
  "toy-tennis": DEMO_SCENES.tennis,
  "toy-overtime": DEMO_SCENES.overtime,
  "toy-gift-log": DEMO_SCENES.gift,
};

interface ToyPreviewProps {
  /** 카드 앵커(toy-meeting 등). 장면을 고르는 열쇠 */
  anchorId?: string;
  /** 카드 제목. 지금은 장면에 쓰지 않지만 ProjectCard가 함께 넘겨 준다 */
  title?: string;
  /** 카드에 달린 스크린샷. 미리보기가 장면으로 바뀌면서 더는 쓰지 않는다 */
  images?: ProjectImage[];
}

export default function ToyPreview({ anchorId }: ToyPreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  // started: 한 번이라도 보였는가. 장면은 한 번 재생하고 마지막 모습을 유지한다.
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // 아주 오래된 브라우저: 화면에 들어왔는지 알 수 없으니 그냥 재생한다
      const timer = setTimeout(() => setStarted(true), 0);
      return () => clearTimeout(timer);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setStarted(true);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Scene = anchorId ? SCENE_BY_ANCHOR[anchorId] : undefined;
  // 표에 없는 앵커라면 빈 상자를 남기느니 아무것도 그리지 않는다
  if (!Scene) return null;

  return (
    <StFrame ref={frameRef}>
      <StPlayback $running={started} aria-hidden="true">
        <Scene />
      </StPlayback>
    </StFrame>
  );
}

const StFrame = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 11rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  border-radius: 0.85rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  background: ${({ theme }) => theme.colors.white};

  /* 움직임 줄이기 설정이면 장면을 마지막 모습으로 바로 보여 준다 */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01s !important;
      animation-delay: 0s !important;
      animation-iteration-count: 1 !important;
      animation-play-state: running !important;
    }
  }
`;

/* 장면은 늘 그려 두고, 줄이 화면에 들어오기 전까지는 멈춰 둔다 */
const StPlayback = styled.div<{ $running: boolean }>`
  display: contents;

  ${({ $running }) =>
    !$running &&
    css`
      * {
        animation-play-state: paused !important;
      }
    `}
`;
