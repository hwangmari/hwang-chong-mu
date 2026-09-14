"use client";

// 토이 프로젝트 한 줄의 오른쪽에 놓이는 미리보기 칸.
// "자세히 보기"를 누르기 전에도 그 서비스가 무엇을 하는지 움직임으로 보여 준다.
//
// 보여 주는 것은 셋 중 하나다.
//   1) 첫 화면에서 쓰는 움직이는 장면(components/home/ToolDemo.tsx의 장면을 그대로 가져다 쓴다)
//   2) 장면이 없으면 카드에 달린 첫 스크린샷 (아주 느린 확대/이동)
//   3) 스크린샷도 없으면 서비스 아이콘 한 개를 얹은 빈 타일
//
// 움직임은 줄이 화면에 들어왔을 때 시작한다(IntersectionObserver).
// 장면은 처음부터 그려 두고 멈춰(paused) 있다가 화면에 들어오면 재생한다 —
// 나중에 붙이면 칸 높이가 바뀌어 아래 줄이 밀리기 때문이다.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styled, { css, keyframes } from "styled-components";
import { DEMO_SCENES, type DemoScene } from "@/components/home/ToolDemo";
import type { ProjectImage } from "@/components/common/ProjectImageViewer";
import { byId } from "@/lib/services";

// 카드 앵커 → 첫 화면 장면. 장면이 있는 서비스만 적는다.
const SCENE_BY_ANCHOR: Record<string, DemoScene> = {
  "toy-meeting": "meeting",
  "toy-calc": "calc",
  "toy-tennis": "tennis",
  "toy-overtime": "overtime",
  "toy-gift-log": "gift",
};

const FALLBACK_ICON = "🧩";

interface ToyPreviewProps {
  /** 카드 앵커(toy-meeting 등). 장면·아이콘을 고르는 열쇠 */
  anchorId?: string;
  /** 스크린샷 대체 텍스트에 쓸 서비스 이름 */
  title: string;
  images?: ProjectImage[];
}

export default function ToyPreview({ anchorId, title, images }: ToyPreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  // visible: 지금 화면에 보이는가(스크린샷 움직임을 켜고 끄는 데 쓴다)
  // started: 한 번이라도 보였는가(장면은 한 번 재생하고 마지막 모습을 유지한다)
  const [visible, setVisible] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // 아주 오래된 브라우저: 화면에 들어왔는지 알 수 없으니 그냥 재생한다
      const timer = setTimeout(() => {
        setVisible(true);
        setStarted(true);
      }, 0);
      return () => clearTimeout(timer);
    }
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const sceneKey = anchorId ? SCENE_BY_ANCHOR[anchorId] : undefined;
  const Scene = sceneKey ? DEMO_SCENES[sceneKey] : undefined;
  const shot = Scene ? undefined : images?.[0];
  const icon =
    (anchorId ? byId(anchorId.replace(/^toy-/, ""))?.icon : undefined) ??
    FALLBACK_ICON;

  return (
    <StFrame ref={frameRef} $plain={!Scene && !shot}>
      {Scene ? (
        <StScene $running={started} aria-hidden="true">
          <Scene />
        </StScene>
      ) : shot ? (
        <StShot $running={visible}>
          <Image
            src={shot.src}
            alt={shot.alt || `${title} 화면`}
            fill
            sizes="(max-width: 767px) 100vw, 42vw"
            style={{ objectFit: "cover", objectPosition: "top center" }}
          />
        </StShot>
      ) : (
        <StIconTile aria-hidden="true">{icon}</StIconTile>
      )}
    </StFrame>
  );
}

const StFrame = styled.div<{ $plain: boolean }>`
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
  background: ${({ theme, $plain }) =>
    $plain ? theme.semantic.bg : theme.colors.white};

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
const StScene = styled.div<{ $running: boolean }>`
  display: contents;

  ${({ $running }) =>
    !$running &&
    css`
      * {
        animation-play-state: paused !important;
      }
    `}
`;

const panZoom = keyframes`
  from { transform: scale(1) translate3d(0, 0, 0); }
  to { transform: scale(1.08) translate3d(0, -3%, 0); }
`;

const StShot = styled.div<{ $running: boolean }>`
  position: absolute;
  inset: 0;
  transform-origin: center top;
  animation: ${panZoom} 12s ease-in-out infinite alternate;
  animation-play-state: ${({ $running }) => ($running ? "running" : "paused")};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: none;
  }
`;

const StIconTile = styled.div`
  display: grid;
  place-items: center;
  flex: 1;
  font-size: 2.6rem;
  line-height: 1;
  opacity: 0.55;
`;
