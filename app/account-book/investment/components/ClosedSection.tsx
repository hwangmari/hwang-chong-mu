"use client";

import { useState } from "react";

import {
  StClosed,
  StClosedHeader,
  StClosedList,
  StClosedRow,
} from "../page.styles";
import { formatSignedWon, toneColor } from "../format";

// ── 청산(보유 0) 종목 실현손익 접이식 섹션 ──────────────────────────────────
export function ClosedSection({
  positions,
  hidden,
}: {
  positions: { code: string; name: string; realizedPnl: number }[];
  hidden: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <StClosed>
      <StClosedHeader
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span>청산 종목 실현손익 ({positions.length})</span>
        <em>{open ? "접기" : "펼치기"}</em>
      </StClosedHeader>
      {open ? (
        <StClosedList>
          {positions.map((position) => (
            <StClosedRow key={position.code}>
              <strong>{position.name}</strong>
              <em style={{ color: toneColor(position.realizedPnl) }}>
                {hidden ? "•••••" : formatSignedWon(position.realizedPnl)}
              </em>
            </StClosedRow>
          ))}
        </StClosedList>
      ) : null}
    </StClosed>
  );
}
