"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import styled from "styled-components";

type Props = {
  title: string;
  subtitle?: string;
  infoText?: string;
  monthLabel: string;
  monthRangeLabel: string;
  monthValue: string;
  onOpenNaturalRegister?: () => void;
  onOpenImageRegister?: () => void;
  onOpenManual?: () => void;
  onBack?: () => void;
  onMonthMove?: (diff: number) => void;
  onMonthSelect?: (value: string) => void;
};

export default function WorkspaceHeader({
  title,
  subtitle,
  infoText,
  monthLabel,
  monthRangeLabel,
  monthValue,
  onOpenNaturalRegister,
  onOpenImageRegister,
  onOpenManual,
  onBack,
  onMonthMove,
  onMonthSelect,
}: Props) {
  const router = useRouter();
  const monthHeaderRef = useRef<HTMLDivElement | null>(null);
  const monthPickerAnchorRef = useRef<HTMLButtonElement | null>(null);
  const monthPickerPopoverRef = useRef<HTMLDivElement | null>(null);
  const today = useMemo(() => new Date(), []);
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [selectedPickerYear, setSelectedPickerYear] = useState(todayYear);
  const [monthPickerPosition, setMonthPickerPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [activeYear, activeMonth] = useMemo(() => {
    const [yearText, monthText] = monthValue.split("-");
    return [Number(yearText) || todayYear, Number(monthText) || todayMonth];
  }, [monthValue, todayMonth, todayYear]);
  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, index) => `${index + 1}월`),
    [],
  );

  useEffect(() => {
    setSelectedPickerYear(activeYear);
  }, [activeYear]);

  useEffect(() => {
    if (!isMonthPickerOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideHeader = monthHeaderRef.current?.contains(target);
      const clickedInsidePopover =
        monthPickerPopoverRef.current?.contains(target);

      if (!clickedInsideHeader && !clickedInsidePopover) {
        setIsMonthPickerOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMonthPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMonthPickerOpen]);

  useEffect(() => {
    if (!isMonthPickerOpen) return;

    const updateMonthPickerPosition = () => {
      const triggerRect =
        monthPickerAnchorRef.current?.getBoundingClientRect() || null;
      if (!triggerRect) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const horizontalPadding = 12;
      const verticalGap = 10;
      const preferredWidth = 296;
      const estimatedHeight = 382;
      const width = Math.min(
        preferredWidth,
        viewportWidth - horizontalPadding * 2,
      );
      const centeredLeft = triggerRect.left + triggerRect.width / 2 - width / 2;
      const left = Math.min(
        Math.max(centeredLeft, horizontalPadding),
        viewportWidth - width - horizontalPadding,
      );
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const shouldOpenAbove =
        spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
      const top = shouldOpenAbove
        ? Math.max(
            horizontalPadding,
            triggerRect.top - estimatedHeight - verticalGap,
          )
        : Math.min(
            triggerRect.bottom + verticalGap,
            viewportHeight - estimatedHeight - horizontalPadding,
          );

      setMonthPickerPosition({ top, left, width });
    };

    updateMonthPickerPosition();
    window.addEventListener("resize", updateMonthPickerPosition);
    window.addEventListener("scroll", updateMonthPickerPosition, true);

    return () => {
      window.removeEventListener("resize", updateMonthPickerPosition);
      window.removeEventListener("scroll", updateMonthPickerPosition, true);
    };
  }, [isMonthPickerOpen]);

  const openMonthPicker = () => {
    if (!onMonthSelect) return;
    setSelectedPickerYear(activeYear);
    setIsMonthPickerOpen((prev) => !prev);
  };

  const selectMonth = (monthNumber: number) => {
    onMonthSelect?.(
      `${selectedPickerYear}-${String(monthNumber).padStart(2, "0")}`,
    );
    setIsMonthPickerOpen(false);
  };

  const movePickerYear = (diff: number) => {
    setSelectedPickerYear((prev) => prev + diff);
  };

  return (
    <StWorkspaceHeader>
      <StHeaderMoWrap>
        <StHeaderLeft>
          <StBackButton
            type="button"
            aria-label="뒤로 가기"
            onClick={() => {
              if (onBack) onBack();
              else router.push("/");
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m14.71 6.71-1.42-1.42L6.59 12l6.7 6.71 1.42-1.42L9.41 12z" />
            </svg>
          </StBackButton>
          <StTitleBlock>
            <StHeaderTitle>{title}</StHeaderTitle>
            {subtitle || infoText ? (
              <StHeaderMetaRow>
                {subtitle ? (
                  <StHeaderSubtitle>{subtitle}</StHeaderSubtitle>
                ) : null}
                {infoText ? (
                  <StHeaderInfoText>{infoText}</StHeaderInfoText>
                ) : null}
              </StHeaderMetaRow>
            ) : null}
          </StTitleBlock>
        </StHeaderLeft>

        <StHeaderCenter>
          <StMonthHeader ref={monthHeaderRef}>
            <StMonthButton type="button" onClick={() => onMonthMove?.(-1)}>
              <StChevronIcon viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </StChevronIcon>
            </StMonthButton>
            <StMonthInfoButton
              ref={monthPickerAnchorRef}
              type="button"
              onClick={openMonthPicker}
              disabled={!onMonthSelect}
              aria-label="년월 선택"
              $open={isMonthPickerOpen}
            >
              <StMonthTitleRow>
                <StMonthTitle>{monthLabel}</StMonthTitle>
                <StMonthCaret viewBox="0 0 20 20" aria-hidden="true">
                  <path d="m5.5 7.5 4.5 4.5 4.5-4.5" />
                </StMonthCaret>
              </StMonthTitleRow>
              <StMonthRange>{monthRangeLabel}</StMonthRange>
            </StMonthInfoButton>
            <StMonthButton type="button" onClick={() => onMonthMove?.(1)}>
              <StChevronIcon viewBox="0 0 24 24" aria-hidden="true">
                <path d="m8.59 16.59 1.41 1.41 6-6-6-6-1.41 1.41L13.17 12z" />
              </StChevronIcon>
            </StMonthButton>
          </StMonthHeader>
        </StHeaderCenter>
      </StHeaderMoWrap>

      <StHeaderRight>
        {onOpenNaturalRegister ? (
          <StPrimaryActionButton type="button" onClick={onOpenNaturalRegister}>
            문장등록
          </StPrimaryActionButton>
        ) : null}
        {onOpenImageRegister ? (
          <StSecondaryActionButton type="button" onClick={onOpenImageRegister}>
            이미지등록
          </StSecondaryActionButton>
        ) : null}
        {onOpenManual ? (
          <StSecondaryActionButton type="button" onClick={onOpenManual}>
            직접등록
          </StSecondaryActionButton>
        ) : null}
      </StHeaderRight>
      {isMonthPickerOpen &&
      monthPickerPosition &&
      typeof document !== "undefined"
        ? createPortal(
            <StMonthPickerLayer>
              <StMonthPickerPopover
                ref={monthPickerPopoverRef}
                $top={monthPickerPosition.top}
                $left={monthPickerPosition.left}
                $width={monthPickerPosition.width}
              >
                <StMonthPickerHeader>
                  <StMonthPickerYearButton
                    type="button"
                    onClick={() => movePickerYear(-1)}
                    aria-label="이전 연도"
                  >
                    <StMiniChevron viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M12.5 5.5 8 10l4.5 4.5" />
                    </StMiniChevron>
                  </StMonthPickerYearButton>
                  <StMonthPickerYear>{selectedPickerYear}년</StMonthPickerYear>
                  <StMonthPickerYearButton
                    type="button"
                    onClick={() => movePickerYear(1)}
                    aria-label="다음 연도"
                  >
                    <StMiniChevron viewBox="0 0 20 20" aria-hidden="true">
                      <path d="m7.5 14.5 4.5-4.5-4.5-4.5" />
                    </StMiniChevron>
                  </StMonthPickerYearButton>
                </StMonthPickerHeader>
                <StMonthPickerGrid>
                  {monthOptions.map((label, index) => {
                    const monthNumber = index + 1;
                    const isActive =
                      selectedPickerYear === activeYear &&
                      monthNumber === activeMonth;

                    return (
                      <StMonthChip
                        key={`${selectedPickerYear}-${monthNumber}`}
                        type="button"
                        $active={isActive}
                        onClick={() => selectMonth(monthNumber)}
                      >
                        {label}
                      </StMonthChip>
                    );
                  })}
                </StMonthPickerGrid>
                <StMonthPickerFooter>
                  <StMonthPickerTextButton
                    type="button"
                    onClick={() => {
                      setSelectedPickerYear(todayYear);
                      onMonthSelect?.(
                        `${todayYear}-${String(todayMonth).padStart(2, "0")}`,
                      );
                      setIsMonthPickerOpen(false);
                    }}
                  >
                    이번 달
                  </StMonthPickerTextButton>
                </StMonthPickerFooter>
              </StMonthPickerPopover>
            </StMonthPickerLayer>,
            document.body,
          )
        : null}
    </StWorkspaceHeader>
  );
}

const StWorkspaceHeader = styled.header`
  position: sticky;
  top: 0;
  border-bottom: 1px solid #d9dde3;
  background: #f7f8fa;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  grid-template-areas: "left center right";
  align-items: center;
  padding: 0.7rem 1rem;
  gap: 2rem;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      "main"
      "right";
    justify-items: stretch;
    padding: 0.8rem 0.75rem;
    gap: 0.65rem;
  }

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "main"
      "right";
    padding: 0.75rem 0.7rem;
    gap: 0.55rem;
  }
`;

const StHeaderMoWrap = styled.div`
  display: contents;

  @media (max-width: 980px) {
    grid-area: main;
    display: block;
    position: relative;
    min-width: 0;
    padding-right: 12.5rem;
    min-height: 4rem;
  }

  @media (max-width: 720px) {
    padding-right: 11.5rem;
    min-height: 3.5rem;
  }
`;

const StHeaderLeft = styled.div`
  grid-area: left;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
`;

const StTitleBlock = styled.div`
  display: grid;
  gap: 0.12rem;
  min-width: 0;
`;

const StHeaderCenter = styled.div`
  grid-area: center;
  display: flex;
  justify-content: center;
  min-width: 0;

  @media (max-width: 980px) {
    position: absolute;
    top: 0;
    right: 0;
    width: 180px;
    justify-content: flex-end;
  }

  @media (max-width: 720px) {
    width: 180px;
  }
`;

const StHeaderRight = styled.div`
  grid-area: right;
  display: flex;
  justify-content: flex-end;
  gap: 0.55rem;
  flex-wrap: wrap;

  @media (max-width: 980px) {
    justify-content: flex-start;
  }

  @media (max-width: 720px) {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.45rem;
    justify-content: stretch;
    width: 100%;
  }
`;

const StBackButton = styled.button`
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #5f6675;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  svg {
    width: 2rem;
    height: 2rem;
    fill: currentColor;
  }
`;

const StHeaderTitle = styled.h1`
  font-size: 1.05rem;
  font-weight: 800;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StHeaderSubtitle = styled.p`
  font-size: 0.76rem;
  color: #7b8798;

  @media (max-width: 720px) {
    font-size: 0.72rem;
  }
`;

const StHeaderMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.12rem;
`;

const StHeaderInfoText = styled.p`
  font-size: 0.76rem;
  color: #8a94a6;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StMonthHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  justify-content: space-between;
  width: 180px;

  @media (max-width: 720px) {
    max-width: 100%;
  }
`;
const StMonthButton = styled.button`
  width: 2.3rem;
  height: 2.3rem;
  border-radius: 999px;
  border: 1px solid #dce3eb;
  background: #fff;
  font-size: 1.3rem;
  color: #4b5563;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;
const StChevronIcon = styled.svg`
  width: 1.35rem;
  height: 1.35rem;
  fill: currentColor;
`;
const StMonthInfoButton = styled.button<{ $open: boolean }>`
  border: none;
  background: ${({ $open }) => ($open ? "#ffffff" : "transparent")};
  padding: 0.4rem 0.65rem;
  text-align: center;
  border-radius: 18px;
  cursor: pointer;
  min-width: 0;
  box-shadow: ${({ $open }) =>
    $open ? "0 12px 28px rgba(73, 93, 132, 0.1)" : "none"};

  &:disabled {
    cursor: default;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.82);
  }

  @media (max-width: 720px) {
    flex: 1;
    padding: 0.35rem 0.45rem;
  }
`;

const StMonthTitleRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
`;

const StMonthTitle = styled.h2`
  font-size: 1.15rem;
  font-weight: 800;
  color: #1f2937;
`;

const StMonthCaret = styled.svg`
  width: 0.95rem;
  height: 0.95rem;
  stroke: #7384a0;
  stroke-width: 1.8;
  fill: none;
`;

const StMonthRange = styled.p`
  font-size: 0.75rem;
  color: #8a94a6;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StMonthPickerLayer = styled.div`
  position: fixed;
  inset: 0;
  z-index: 140;
  pointer-events: none;
`;

const StMonthPickerPopover = styled.div<{
  $top: number;
  $left: number;
  $width: number;
}>`
  position: fixed;
  top: ${({ $top }) => `${$top}px`};
  left: ${({ $left }) => `${$left}px`};
  width: ${({ $width }) => `${$width}px`};
  border: 1px solid #d9e2ef;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 20px 40px rgba(72, 90, 126, 0.14);
  padding: 0.9rem;
  backdrop-filter: blur(12px);
  pointer-events: auto;
`;

const StMonthPickerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-bottom: 0.8rem;
`;

const StMonthPickerYear = styled.strong`
  font-size: 0.98rem;
  font-weight: 900;
  color: #223147;
`;

const StMonthPickerYearButton = styled.button`
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 1px solid #d5dfed;
  background: #f9fbff;
  color: #5b6f90;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const StMiniChevron = styled.svg`
  width: 1rem;
  height: 1rem;
  stroke: currentColor;
  stroke-width: 1.9;
  fill: none;
`;

const StMonthPickerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.45rem;
`;

const StMonthChip = styled.button<{ $active: boolean }>`
  border-radius: 14px;
  border: 1px solid ${({ $active }) => ($active ? "#9eb4ff" : "#e1e8f2")};
  background: ${({ $active }) => ($active ? "#eef3ff" : "#fff")};
  color: ${({ $active }) => ($active ? "#4262d8" : "#42536b")};
  padding: 0.7rem 0.25rem;
  font-size: 0.88rem;
  font-weight: ${({ $active }) => ($active ? 900 : 700)};
`;

const StMonthPickerFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #d9e1ec;
`;

const StMonthPickerTextButton = styled.button`
  border: none;
  background: transparent;
  color: #4c67c4;
  font-size: 0.82rem;
  font-weight: 900;
  padding: 0.15rem 0;
`;

const StActionButtonBase = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  padding: 0.8rem 1.05rem;
  font-size: 0.88rem;
  font-weight: 900;

  @media (max-width: 720px) {
    width: 100%;
    min-width: 0;
    padding: 0.8rem 0.5rem;
    font-size: 0.82rem;
    border-radius: 16px;
  }
`;

const StPrimaryActionButton = styled(StActionButtonBase)`
  border: 1px solid #4e67d0;
  background: #5f73d9;
  color: #fff;
  box-shadow: 0 8px 20px rgba(74, 103, 204, 0.14);
`;

const StSecondaryActionButton = styled(StActionButtonBase)`
  border: 1px solid #cedbeb;
  background: rgba(255, 255, 255, 0.96);
  color: #506683;
`;
