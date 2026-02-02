"use client";

import React, { useRef, useEffect } from "react";
import styled from "styled-components";

interface ColorPickerProps {
  onSelect: (color: string) => void;
  onClose: () => void;
}

export default function ColorPicker({ onSelect, onClose }: ColorPickerProps) {
  const colors = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
  ];

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <StWrapper ref={ref}>
      {colors.map((c) => (
        <div
          key={c}
          className="color-circle"
          style={{ background: c }}
          onClick={() => onSelect(c)}
        />
      ))}
    </StWrapper>
  );
}

const StWrapper = styled.div`
  position: absolute;
  top: 20px;
  left: 0;
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  z-index: 100;

  .color-circle {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.1s;
    &:hover {
      transform: scale(1.2);
    }
  }
`;
