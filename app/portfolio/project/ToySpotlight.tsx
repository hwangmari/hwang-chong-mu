"use client";

// 토이 프로젝트 격자의 시그니처: 카드 사이를 미끄러져 다니는 조명 상자 하나.
// 카드마다 애니메이션을 두지 않고, 격자 전체에 하나만 두고 위치를 옮긴다.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import styled from "styled-components";
import { motion, useReducedMotion } from "framer-motion";
import { useCareerFocus } from "../CareerFocusContext";
import { TOY_PROJECTS } from "./toyProjects";

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function ToySpotlight({ children }: { children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef<HTMLElement | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const reduced = useReducedMotion();
  const { isOpen } = useCareerFocus();

  // 카드를 펼쳐 읽는 중에는 조명이 방해되므로 숨긴다
  const anyOpen = TOY_PROJECTS.some((toy) => isOpen(toy.id));

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const cards = [...wrap.querySelectorAll<HTMLElement>("[data-toy-card]")];
    if (cards.length === 0) return;

    let target = hoveredRef.current;
    if (!target || !wrap.contains(target)) {
      // 가리키는 카드가 없으면 화면 한가운데에 가장 가까운 카드
      const mid = window.innerHeight / 2;
      let best = cards[0];
      let bestGap = Infinity;
      for (const card of cards) {
        const r = card.getBoundingClientRect();
        const gap = Math.abs(r.top + r.height / 2 - mid);
        if (gap < bestGap) {
          bestGap = gap;
          best = card;
        }
      }
      target = best;
    }

    cards.forEach((card) => {
      if (card === target) card.setAttribute("data-spot", "on");
      else card.removeAttribute("data-spot");
    });

    setBox({
      x: target.offsetLeft,
      y: target.offsetTop,
      w: target.offsetWidth,
      h: target.offsetHeight,
    });
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const onOver = (e: Event) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>("[data-toy-card]");
      if (!card) return;
      hoveredRef.current = card;
      measure();
    };
    const onOut = (e: Event) => {
      const to = (e as PointerEvent).relatedTarget as HTMLElement | null;
      if (to && to.closest?.("[data-toy-card]")) return;
      hoveredRef.current = null;
      measure();
    };

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };

    wrap.addEventListener("pointerover", onOver);
    wrap.addEventListener("pointerout", onOut);
    wrap.addEventListener("focusin", onOver);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    measure();

    return () => {
      wrap.removeEventListener("pointerover", onOver);
      wrap.removeEventListener("pointerout", onOut);
      wrap.removeEventListener("focusin", onOver);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [measure]);

  return (
    <StWrap ref={wrapRef}>
      {box && !anyOpen && (
        <StSpotlight
          aria-hidden="true"
          initial={false}
          animate={{ x: box.x - 4, y: box.y - 4, width: box.w + 8, height: box.h + 8, opacity: 1 }}
          transition={
            reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28 }
          }
        />
      )}
      {children}
    </StWrap>
  );
}

const StWrap = styled.div`
  position: relative;
`;

/* 격자 위에 겹쳐 두기만 하므로 배치에는 영향을 주지 않는다 */
const StSpotlight = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  pointer-events: none;
  border-radius: 1.2rem;
  border: 2px solid ${({ theme }) => theme.semantic.primary};
  background: ${({ theme }) => theme.colors.blue50};
  opacity: 0;
`;
