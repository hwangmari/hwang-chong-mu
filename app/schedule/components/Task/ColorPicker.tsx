import React, { forwardRef } from "react";
import { StColorPopover, StColorChip } from "./TaskList.styles";

const PRESET_COLORS = [
  "#FF6B6B",
  "#FFA94D",
  "#FFD43B",
  "#20C997",
  "#339AF0",
  "#5C7CFA",
  "#845EF7",
  "#494f54",
];

interface Props {
  selectedColor: string;
  onSelect: (color: string) => void;
}

const ColorPicker = forwardRef<HTMLDivElement, Props>(
  ({ selectedColor, onSelect }, ref) => {
    return (
      <StColorPopover ref={ref}>
        <div className="preset-grid">
          {PRESET_COLORS.map((color) => (
            <StColorChip
              key={color}
              $color={color}
              $isSelected={selectedColor === color}
              onClick={() => onSelect(color)}
            />
          ))}
        </div>
        <div className="custom-picker-row">
          <span>직접 선택:</span>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => onSelect(e.target.value)}
          />
        </div>
      </StColorPopover>
    );
  },
);

ColorPicker.displayName = "ColorPicker";
export default ColorPicker;
