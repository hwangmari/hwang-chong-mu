"use client";

import styled from "styled-components";

interface Props {
  selectedColor: string;
  onSelect: (color: string) => void;
  colors: string[];
  label?: string;
}

export default function ColorPickerPanel({
  selectedColor,
  onSelect,
  colors,
  label = "직접 선택:",
}: Props) {
  return (
    <Wrap>
      <PresetGrid>
        {colors.map((color) => (
          <ColorChip
            key={color}
            type="button"
            aria-label={color}
            $color={color}
            $isSelected={selectedColor === color}
            onClick={() => onSelect(color)}
          />
        ))}
      </PresetGrid>
      <CustomRow>
        <span>{label}</span>
        <input
          type="color"
          value={selectedColor}
          onChange={(event) => onSelect(event.target.value)}
        />
      </CustomRow>
    </Wrap>
  );
}

const Wrap = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  padding: 10px;
`;

const PresetGrid = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ColorChip = styled.button<{ $color: string; $isSelected: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  border: none;
  background: ${({ $color }) => $color};
  box-shadow: ${({ $isSelected, $color }) =>
    $isSelected
      ? `0 0 0 2px #fff, 0 0 0 4px ${$color}`
      : "0 0 0 1px rgba(15,23,42,0.15)"};
  cursor: pointer;
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.08);
  }
`;

const CustomRow = styled.div`
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: #64748b;

  input[type="color"] {
    width: 38px;
    height: 26px;
    padding: 0;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
  }
`;
