"use client";

import { useMemo, useState } from "react";
import { Button } from "@hwangchongmu/ui";
import { parseBulkText } from "../parseBulk";
import {
  StActions,
  StCard,
  StCardHead,
  StCardHint,
  StCardTitle,
  StChip,
  StChipRow,
  StError,
  StFieldName,
  StGhostBtn,
  StInput,
  StLabel,
  StRow,
  StSegmentBtn,
  StSegmentRow,
  StTable,
  StTableWrap,
  StTextarea,
} from "../page.styles";
import {
  DIRECTION_COLOR,
  DIRECTION_KEYS,
  DIRECTION_LABEL,
  EVENT_TYPE_COLOR,
  EVENT_TYPE_ICON,
  EVENT_TYPE_KEYS,
  EVENT_TYPE_LABEL,
  RELATION_COLOR,
  RELATION_DETAIL_PLACEHOLDER,
  RELATION_KEYS,
  RELATION_LABEL,
  type GiftDirection,
  type GiftEntryInput,
  type GiftEventType,
  type GiftRelation,
} from "../types";
import { formatAmount } from "./giftFormat";

type Props = {
  defaultDate: string;
  onAddMany: (inputs: GiftEntryInput[]) => Promise<void>;
};

const PLACEHOLDER = `한 줄에 한 명씩: 이름 금액 [메모]
황다은 5
이종엽 20 카톡송금
윤여몽 (강태) 10
5 봉투          ← 이름 없으면 "(이름 없음)"으로 들어가요
※ 금액은 만원 단위(5 = 50,000원). 50,000 처럼 원 단위로 써도 돼요.`;

export default function BulkAddForm({ defaultDate, onAddMany }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [direction, setDirection] = useState<GiftDirection>("received");
  const [eventType, setEventType] = useState<GiftEventType>("wedding");
  const [relation, setRelation] = useState<GiftRelation>("company");
  const [relationDetail, setRelationDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const lines = useMemo(() => parseBulkText(text), [text]);
  const valid = lines.filter((l) => !l.error);
  const total = valid.reduce((sum, l) => sum + l.amount, 0);

  async function submit() {
    if (!date) {
      setError("날짜를 입력해 주세요.");
      return;
    }
    if (valid.length === 0) {
      setError("담을 줄이 없어요. 이름과 금액을 확인해 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    setDone("");
    try {
      await onAddMany(
        valid.map((l) => ({
          date,
          eventType,
          direction,
          personName: l.personName,
          relation,
          relationDetail: relationDetail.trim(),
          amount: l.amount,
          memo: l.memo,
        })),
      );
      setDone(`${valid.length}건, ${formatAmount(total)}을 담았어요.`);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "담는 중 문제가 생겼어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <StCard>
      <StCardHead>
        <StCardTitle>📋 명단 한번에 담기</StCardTitle>
        <StGhostBtn type="button" onClick={() => setOpen((v) => !v)}>
          {open ? "접기" : "펼치기"}
        </StGhostBtn>
      </StCardHead>
      <StCardHint>
        결혼식 축의금 장부처럼 <b>같은 날 · 같은 종류</b>의 명단을 붙여 넣으면 한 번에
        들어가요. 아래 공통 항목(날짜·방향·종류·관계)은 모든 줄에 똑같이 적용됩니다.
      </StCardHint>

      {!open ? null : (
        <>
          <StSegmentRow>
            {DIRECTION_KEYS.map((key) => (
              <StSegmentBtn
                key={key}
                type="button"
                $active={direction === key}
                $color={DIRECTION_COLOR[key]}
                onClick={() => setDirection(key)}
              >
                {key === "given" ? "💸 " : "💰 "}
                {DIRECTION_LABEL[key]}
              </StSegmentBtn>
            ))}
          </StSegmentRow>

          <StRow>
            <StLabel>
              <StFieldName>날짜 (행사일)</StFieldName>
              <StInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </StLabel>
            <StLabel>
              <StFieldName>관계 세부 (선택)</StFieldName>
              <StInput
                type="text"
                placeholder={RELATION_DETAIL_PLACEHOLDER[relation]}
                value={relationDetail}
                maxLength={40}
                onChange={(e) => setRelationDetail(e.target.value)}
              />
            </StLabel>
          </StRow>

          <StLabel as="div">
            <StFieldName>경조사 종류</StFieldName>
            <StChipRow>
              {EVENT_TYPE_KEYS.map((key) => (
                <StChip
                  key={key}
                  type="button"
                  $active={eventType === key}
                  $color={EVENT_TYPE_COLOR[key]}
                  onClick={() => setEventType(key)}
                >
                  {EVENT_TYPE_ICON[key]} {EVENT_TYPE_LABEL[key]}
                </StChip>
              ))}
            </StChipRow>
          </StLabel>

          <StLabel as="div">
            <StFieldName>관계</StFieldName>
            <StChipRow>
              {RELATION_KEYS.map((key) => (
                <StChip
                  key={key}
                  type="button"
                  $active={relation === key}
                  $color={RELATION_COLOR[key]}
                  onClick={() => setRelation(key)}
                >
                  {RELATION_LABEL[key]}
                </StChip>
              ))}
            </StChipRow>
          </StLabel>

          <StLabel>
            <StFieldName>명단</StFieldName>
            <StTextarea
              rows={8}
              placeholder={PLACEHOLDER}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </StLabel>

          {lines.length > 0 ? (
            <>
              <StCardHint>
                미리보기 — {valid.length}건 · 합계 <b>{formatAmount(total)}</b>
                {lines.length !== valid.length
                  ? ` · 금액을 못 읽은 줄 ${lines.length - valid.length}개 (빼고 담아요)`
                  : ""}
              </StCardHint>
              <StTableWrap>
                <StTable>
                  <thead>
                    <tr>
                      <th>이름</th>
                      <th className="amount">금액</th>
                      <th>메모</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, i) => (
                      <tr key={`${i}-${l.raw}`} style={l.error ? { opacity: 0.5 } : undefined}>
                        <td>
                          <b>{l.error ? l.raw : l.personName}</b>
                        </td>
                        <td className="amount">
                          {l.error ? <span style={{ color: "#c0304f" }}>{l.error}</span> : formatAmount(l.amount)}
                        </td>
                        <td className="memo">{l.memo}</td>
                      </tr>
                    ))}
                  </tbody>
                </StTable>
              </StTableWrap>
            </>
          ) : null}

          {error ? <StError>{error}</StError> : null}
          {done ? <StCardHint>✅ {done}</StCardHint> : null}

          <StActions>
            <Button
              color="primary"
              variant="fill"
              size="medium"
              onClick={submit}
              disabled={busy || valid.length === 0}
            >
              {busy ? "담는 중..." : `${valid.length}건 장부에 담기`}
            </Button>
          </StActions>
        </>
      )}
    </StCard>
  );
}
