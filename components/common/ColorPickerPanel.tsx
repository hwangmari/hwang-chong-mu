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
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.colors.white};
  padding: 0.75rem;
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
  box-shadow: ${({ $isSelected, $color, theme }) =>
    $isSelected
      ? `0 0 0 2px ${theme.colors.white}, 0 0 0 4px ${$color}`
      : "none"};
  outline: ${({ $isSelected, theme }) =>
    $isSelected ? "none" : `1px solid ${theme.semantic.border}`};
  outline-offset: 0;
  cursor: pointer;
`;

const CustomRow = styled.div`
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.semantic.subText};

  input[type="color"] {
    width: 38px;
    height: 26px;
    padding: 0;
    border: 1px solid ${({ theme }) => theme.semantic.border};
    border-radius: 0.5rem;
    background: ${({ theme }) => theme.colors.white};
    cursor: pointer;
  }
`;
