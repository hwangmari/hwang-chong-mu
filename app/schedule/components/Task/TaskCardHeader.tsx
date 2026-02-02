/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import styled from "styled-components"; // 스타일 보강을 위해 추가
import { ServiceSchedule } from "@/types/work-schedule";
import EyeIcon from "./EyeIcon";
import ColorPicker from "./ColorPicker";
import { StCardHeader, StColorTrigger } from "./TaskList.styles";

interface TaskCardHeaderProps {
  service: ServiceSchedule;
  isCollapsed: boolean;
  isHidden: boolean;
  isEditing: boolean;
  isPickerOpen: boolean;
  pickerRef: React.RefObject<HTMLDivElement | null>;
  onToggleCollapse: () => void;
  onToggleHide: () => void;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  onServiceNameChange: (name: string) => void;
  onServiceNameBlur: (name: string) => void;
  onColorChange: (color: string) => void;
  onDeleteService: () => void;
  onToggleComplete: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function TaskCardHeader({
  service,
  isCollapsed,
  isHidden,
  isEditing,
  isPickerOpen,
  pickerRef,
  onToggleCollapse,
  onToggleHide,
  onOpenPicker,
  onClosePicker,
  onServiceNameChange,
  onServiceNameBlur,
  onColorChange,
  onDeleteService,
  onToggleComplete,
}: TaskCardHeaderProps) {
  return (
    <StCardHeader $color={isHidden ? "#d1d5db" : service.color}>
      <HeaderContent>
        <div className="header-left">
          {/* ✨ 커스텀 체크박스 스타일 */}
          <CheckboxLabel title="완료 처리">
            <input
              type="checkbox"
              checked={!!service.isCompleted}
              onChange={onToggleComplete}
            />
            <span className="checkmark" />
          </CheckboxLabel>

          <AccordionBtn
            className={isCollapsed ? "collapsed" : ""}
            onClick={onToggleCollapse}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 4L6 8L10 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </AccordionBtn>

          {isEditing ? (
            <TitleInput
              type="text"
              value={service.serviceName}
              onChange={(e) => onServiceNameChange(e.target.value)}
              onBlur={(e) => onServiceNameBlur(e.target.value)}
              placeholder="프로젝트명"
              autoFocus
            />
          ) : (
            <TitleText
              $isCompleted={!!service.isCompleted}
              onClick={onToggleCollapse}
            >
              {service.serviceName}
            </TitleText>
          )}
        </div>

        <div className="header-right">
          <IconButton
            className={isHidden ? "hidden" : ""}
            onClick={onToggleHide}
            title={isHidden ? "표시" : "숨김"}
          >
            <EyeIcon isHidden={isHidden} />
          </IconButton>

          {isEditing ? (
            <ActionGroup>
              <ColorPickerWrapper>
                <StColorTrigger $color={service.color} onClick={onOpenPicker} />
                {isPickerOpen && (
                  <ColorPicker
                    ref={pickerRef}
                    selectedColor={service.color}
                    onSelect={(color) => {
                      onColorChange(color);
                      onClosePicker();
                    }}
                  />
                )}
              </ColorPickerWrapper>
              <IconButton onClick={onDeleteService} className="delete">
                🗑️
              </IconButton>
            </ActionGroup>
          ) : (
            <ColorIndicator $color={service.color} />
          )}
        </div>
      </HeaderContent>
    </StCardHeader>
  );
}

// --- Styled Components (깔쌈한 스타일링) ---

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 0;

  .header-left,
  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const CheckboxLabel = styled.label`
  display: block;
  position: relative;
  width: 18px;
  height: 18px;
  cursor: pointer;
  user-select: none;

  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .checkmark {
    position: absolute;
    top: 0;
    left: 0;
    height: 18px;
    width: 18px;
    background-color: #fff;
    border: 2px solid #e5e7eb;
    border-radius: 4px;
    transition: all 0.2s;

    &:after {
      content: "";
      position: absolute;
      display: none;
      left: 5px;
      top: 1px;
      width: 4px;
      height: 9px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
  }

  input:checked ~ .checkmark {
    background-color: #10b981;
    border-color: #10b981;
    &:after {
      display: block;
    }
  }
`;

const AccordionBtn = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  cursor: pointer;
  transition: transform 0.2s;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: #4b5563;
  }

  &.collapsed {
    transform: rotate(-90deg);
  }
`;

const TitleInput = styled.input`
  background: none;
  border: none;
  border-bottom: 2px solid #3b82f6;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  padding: 2px 4px;
  outline: none;
  width: auto;
  min-width: 120px;
`;

const TitleText = styled.h3<{ $isCompleted: boolean }>`
  font-size: 1rem;
  font-weight: 600;
  color: ${(props) => (props.$isCompleted ? "#9ca3af" : "#1f2937")};
  text-decoration: ${(props) => (props.$isCompleted ? "line-through" : "none")};
  cursor: pointer;
  margin: 0;
  transition: color 0.2s;

  &:hover {
    color: #3b82f6;
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: #1f2937;
  }

  &.delete:hover {
    background-color: #fee2e2;
    color: #ef4444;
  }
`;

const ColorIndicator = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${(props) => props.$color};
  box-shadow:
    0 0 0 2px #fff,
    0 0 0 3px ${(props) => props.$color}44;
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: rgba(0, 0, 0, 0.03);
  padding: 2px;
  border-radius: 8px;
`;

const ColorPickerWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;
