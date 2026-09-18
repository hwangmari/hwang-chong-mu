"use client";

import { useState } from "react";
import { MAX_PLACE_STEPS, type PlaceStep } from "../../types";
import { moveItem, newPlaceId } from "../../lib/plan";
import { spotSearchUrl } from "../../lib/guides";
import {
  StRowBtn,
  StStepAdd,
  StStepList,
  StStepRow,
  StStepText,
  StStepTextInput,
  StStepTime,
  StStepTimeInput,
  StStepsArea,
  StStepsToggle,
} from "../page.styles";

// 장소 한 곳 안의 세부 일정. 메인 동선(번호·지도·이동 시간)은 그대로 두고,
// 줄을 펼쳤을 때만 그 안에서 할 일이 차례로 보인다. 평소에는 읽기만 되고,
// 편집을 켠 동안에만 시각·내용 칸이 열려 바로 고칠 수 있다. (2026-09-18)

type PlaceStepsProps = {
  placeName: string;
  /** 구글 지도 검색에 붙일 도시 이름(안내서의 city). 없으면 이름만으로 찾는다 */
  city: string;
  /** 오늘의 동선 지도에 자리를 아는 줄들 — 이 줄만 "위치" 단추가 보인다 (2026-09-18) */
  pinnedIds?: Set<string>;
  /** "위치"를 누르면 오늘의 동선 지도가 그 자리로 간다 */
  onShow?: (stepId: string) => void;
  steps: PlaceStep[];
  /** 고치는 중인지 — 꺼져 있으면 담기·빼기·순서 버튼이 모두 숨는다 */
  editing: boolean;
  onChange: (steps: PlaceStep[]) => void;
  /** 입력 중에는 줄을 끌어 옮기지 못하게 (메모 칸과 같은 방식) */
  onDirty: (value: boolean) => void;
};

export default function PlaceSteps({
  placeName,
  city,
  pinnedIds,
  onShow,
  steps,
  editing,
  onChange,
  onDirty,
}: PlaceStepsProps) {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("");
  const [text, setText] = useState("");

  // 담은 게 없고 고치는 중도 아니면 줄 자체를 만들지 않는다 — 빈 칸이 생기지 않게
  if (steps.length === 0 && !editing) return null;

  const full = steps.length >= MAX_PLACE_STEPS;

  const add = () => {
    const body = text.trim();
    if (!body || full) return;
    onChange([...steps, { id: newPlaceId(), text: body, ...(time.trim() ? { time: time.trim() } : {}) }]);
    setTime("");
    setText("");
  };

  const update = (id: string, patch: Partial<PlaceStep>) => {
    const before = steps.find((step) => step.id === id);
    if (!before) return;
    const after = { ...before, ...patch };
    // 내용을 다 지웠다고 줄을 지우지는 않는다 — 빼는 길은 "빼기" 하나뿐 (리뷰 반영 2026-09-18)
    if (!after.text.trim()) return;
    if (after.text === before.text && (after.time ?? "") === (before.time ?? "")) return;
    onChange(steps.map((step) => (step.id === id ? after : step)));
  };

  const move = (index: number, to: number) => {
    const next = moveItem(steps, index, to);
    if (next !== steps) onChange(next);
  };

  return (
    <StStepsArea>
      <StStepsToggle
        type="button"
        aria-expanded={open}
        title={open ? "세부 일정 접기" : "세부 일정 펼치기"}
        aria-label={`${placeName} 세부 일정 ${open ? "접기" : "펼치기"}`}
        data-testid="steps-toggle"
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden>{open ? "▾" : "▸"}</span>
        {steps.length > 0 ? `세부 일정 ${steps.length}` : "세부 일정 추가"}
      </StStepsToggle>

      {open && (
        <>
          {steps.length > 0 && (
            <StStepList role="list" aria-label={`${placeName} 세부 일정`}>
              {steps.map((step, index) => (
                <StStepRow key={step.id} role="listitem" data-testid="step-row">
                  {editing ? (
                    <>
                      <StStepTimeInput
                        key={`${step.id}:time:${step.time ?? ""}`}
                        defaultValue={step.time ?? ""}
                        placeholder="시각"
                        aria-label={`${index + 1}번째 세부 일정 시각`}
                        onFocus={() => onDirty(true)}
                        onBlur={(event) => {
                          onDirty(false);
                          update(step.id, { time: event.target.value.trim() || undefined });
                        }}
                      />
                      <StStepTextInput
                        key={`${step.id}:text:${step.text}`}
                        defaultValue={step.text}
                        aria-label={`${index + 1}번째 세부 일정 내용`}
                        onFocus={() => onDirty(true)}
                        onBlur={(event) => {
                          onDirty(false);
                          // 다 지웠으면 원래 글로 되돌린다(칸이 빈 채로 남지 않게)
                          if (!event.target.value.trim()) event.target.value = step.text;
                          else update(step.id, { text: event.target.value.trim() });
                        }}
                      />
                      <StRowBtn
                        type="button"
                        $icon
                        title="한 칸 위로"
                        aria-label={`${step.text} 한 칸 위로`}
                        disabled={index === 0}
                        data-testid="step-up"
                        onClick={() => move(index, index - 1)}
                      >
                        ▲
                      </StRowBtn>
                      <StRowBtn
                        type="button"
                        $icon
                        title="한 칸 아래로"
                        aria-label={`${step.text} 한 칸 아래로`}
                        disabled={index === steps.length - 1}
                        data-testid="step-down"
                        onClick={() => move(index, index + 1)}
                      >
                        ▼
                      </StRowBtn>
                      <StRowBtn
                        type="button"
                        $tone="dangerQuiet"
                        title="빼기"
                        aria-label={`${step.text} 빼기`}
                        data-testid="step-remove"
                        onClick={() => onChange(steps.filter((item) => item.id !== step.id))}
                      >
                        빼기
                      </StRowBtn>
                    </>
                  ) : (
                    <>
                      <StStepTime data-testid="step-time">{step.time ?? ""}</StStepTime>
                      <StStepText>{step.text}</StStepText>
                      {/* 자리를 아는 줄은 "오늘의 동선" 지도가 그곳으로 간다. 모르는 줄만 구글 지도로 넘긴다 (2026-09-18) */}
                      {pinnedIds?.has(step.id) && onShow ? (
                        <StRowBtn
                          type="button"
                          title="오늘의 동선 지도에서 보기"
                          aria-label={`${step.text} 오늘의 동선 지도에서 보기`}
                          data-testid="step-show"
                          onClick={() => onShow(step.id)}
                        >
                          위치
                        </StRowBtn>
                      ) : (
                        <StRowBtn
                          as="a"
                          href={spotSearchUrl({ name: step.text }, city)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="구글 지도에서 보기 (새 창)"
                          aria-label={`${step.text} 구글 지도에서 보기`}
                          data-testid="step-map"
                        >
                          지도 ↗
                        </StRowBtn>
                      )}
                      {/* 편집을 켜지 않아도 바로 뺄 수 있게 (주인 요청 2026-09-18) */}
                      <StRowBtn
                        type="button"
                        $icon
                        $tone="dangerQuiet"
                        title="이 줄 빼기"
                        aria-label={`${step.text} 빼기`}
                        data-testid="step-remove-quick"
                        onClick={() => onChange(steps.filter((item) => item.id !== step.id))}
                      >
                        ✕
                      </StRowBtn>
                    </>
                  )}
                </StStepRow>
              ))}
            </StStepList>
          )}

          {editing && (
            <StStepAdd>
              <StStepTimeInput
                value={time}
                placeholder="시각"
                aria-label={`${placeName} 세부 일정 시각`}
                disabled={full}
                onFocus={() => onDirty(true)}
                onBlur={() => onDirty(false)}
                onChange={(event) => setTime(event.target.value)}
              />
              <StStepTextInput
                value={text}
                placeholder={full ? `세부 일정은 ${MAX_PLACE_STEPS}개까지예요` : "여기서 뭘 할지 한 줄로"}
                aria-label={`${placeName} 세부 일정 내용`}
                disabled={full}
                onFocus={() => onDirty(true)}
                onBlur={() => onDirty(false)}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    add();
                  }
                }}
              />
              <StRowBtn
                type="button"
                $tone="primary"
                disabled={!text.trim() || full}
                aria-label={`${placeName} 세부 일정 담기`}
                data-testid="step-add"
                onClick={add}
              >
                담기
              </StRowBtn>
            </StStepAdd>
          )}
        </>
      )}
    </StStepsArea>
  );
}
