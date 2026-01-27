/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";

export function useCardScroll() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    const handleScrollRequest = (e: CustomEvent<string>) => {
      const svcId = e.detail;
      setHighlightId(svcId);

      const targetElement = document.getElementById(`service-card-${svcId}`);
      const containerElement = scrollAreaRef.current;

      if (targetElement && containerElement) {
        const containerRect = containerElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        const scrollTo =
          containerElement.scrollTop +
          (targetRect.top - containerRect.top) -
          containerElement.clientHeight / 2 +
          targetRect.height / 2;

        containerElement.scrollTo({ top: scrollTo, behavior: "smooth" });

        // 강제로 펼치기
        setCollapsedIds((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(svcId)) {
            newSet.delete(svcId);
            return newSet;
          }
          return prev;
        });

        setTimeout(() => setHighlightId(null), 1500);
      }
    };

    window.addEventListener("scroll-to-service" as any, handleScrollRequest);
    return () =>
      window.removeEventListener(
        "scroll-to-service" as any,
        handleScrollRequest,
      );
  }, []);

  const toggleCollapse = (svcId: string) => {
    setCollapsedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(svcId)) newSet.delete(svcId);
      else newSet.add(svcId);
      return newSet;
    });
  };

  return {
    scrollAreaRef,
    collapsedIds,
    highlightId,
    toggleCollapse,
  };
}
