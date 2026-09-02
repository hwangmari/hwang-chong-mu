"use client";

import { useMemo, useState } from "react";
import { buildPersonSummaries } from "../aggregate";
import {
  StBadge,
  StCardHint,
  StChip,
  StChipRow,
  StEmpty,
  StGhostBtn,
  StGroupHead,
  StGroupMeta,
  StGroupTitle,
  StRowActionBtn,
  StTable,
  StTableWrap,
} from "../page.styles";
import {
  DIRECTION_COLOR,
  EVENT_TYPE_COLOR,
  EVENT_TYPE_ICON,
  EVENT_TYPE_KEYS,
  EVENT_TYPE_LABEL,
  RELATION_LABEL,
  type GiftEntry,
  type GiftEventType,
  type PersonSummary,
} from "../types";
import { formatAmount, formatBalance } from "./giftFormat";

// 축의금은 축의금으로, 부의금은 부의금으로 갚는다 — 종류를 섞어 차액을 내지 않는다.
const TAB_LABEL: Record<GiftEventType, string> = {
  wedding: "결혼 (축의금)",
  funeral: "장례 (부의금)",
  firstBirthday: "돌잔치",
  birthday: "생일",
  etc: "기타",
};

// 답례 상태: 낸 기록이 있으면 금액과 함께, 없어도 "냈음" 표시가 있으면 금액 미기록으로 본다
function statusOf(p: PersonSummary): "given" | "marked" | "pending" | "none" {
  if (p.givenTotal > 0) return "given";
  if (p.returnedMarked) return "marked";
  if (p.receivedTotal > 0) return "pending";
  return "none"; // 받은 것 없이 낸 것만 있는 사람
}

type Status = ReturnType<typeof statusOf>;

// 한 묶음(아직 안 냄 / 답례 완료 / 내가 낸 것만)의 표
function RowsTable({
  rows,
  onToggleReturned,
}: {
  rows: PersonSummary[];
  onToggleReturned: (ids: string[], returned: boolean) => void;
}) {
  return (
    <StTableWrap>
      <StTable>
        <thead>
          <tr>
            <th>이름</th>
            <th>관계</th>
            <th className="amount">받은 돈</th>
            <th className="amount">낸 돈</th>
            <th className="amount">차액</th>
            <th>답례</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const s = statusOf(p);
            return (
              <tr key={p.personName}>
                <td>
                  <b>{p.personName}</b>
                </td>
                <td>
                  {RELATION_LABEL[p.relation]}
                  {p.relationDetail ? ` · ${p.relationDetail}` : ""}
                </td>
                <td
                  className="amount"
                  style={{ color: DIRECTION_COLOR.received }}
                >
                  {p.receivedTotal ? formatAmount(p.receivedTotal) : "–"}
                </td>
                <td className="amount" style={{ color: DIRECTION_COLOR.given }}>
                  {p.givenTotal
                    ? formatAmount(p.givenTotal)
                    : s === "marked"
                      ? "냈음"
                      : "–"}
                </td>
                <td className="amount">
                  {s === "marked" ? (
                    <StBadge $tone="neutral">금액 미기록</StBadge>
                  ) : (
                    <StBadge
                      $tone={
                        p.balance > 0
                          ? "good"
                          : p.balance < 0
                            ? "bad"
                            : "neutral"
                      }
                    >
                      {formatBalance(p.balance)}
                    </StBadge>
                  )}
                </td>
                <td>
                  {s === "given" ? (
                    <StBadge $tone="good">✓ 냈음</StBadge>
                  ) : s === "marked" ? (
                    <>
                      <StBadge $tone="good">✓ 냈음</StBadge>
                      <StRowActionBtn
                        type="button"
                        onClick={() => onToggleReturned(p.receivedIds, false)}
                      >
                        취소
                      </StRowActionBtn>
                    </>
                  ) : s === "pending" ? (
                    <StRowActionBtn
                      type="button"
                      style={{ color: DIRECTION_COLOR.given }}
                      onClick={() => onToggleReturned(p.receivedIds, true)}
                    >
                      냈음 표시
                    </StRowActionBtn>
                  ) : (
                    <StBadge $tone="neutral">받은 것 없음</StBadge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </StTable>
    </StTableWrap>
  );
}

// 관계·세부가 같은 사람끼리 소묶음 (회사·한화 / 카카오엔터 / 대학교 / 친구 …)
function splitByRelation(rows: PersonSummary[]) {
  const map = new Map<string, PersonSummary[]>();
  for (const p of rows) {
    const label = p.relationDetail
      ? `${RELATION_LABEL[p.relation]} · ${p.relationDetail}`
      : RELATION_LABEL[p.relation];
    map.set(label, [...(map.get(label) ?? []), p]);
  }
  // 인원 많은 소묶음부터
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
}

// 접을 수 있는 묶음. 기본 펼침 여부는 묶음마다 다르다
function Group({
  title,
  rows,
  defaultOpen,
  onToggleReturned,
}: {
  title: string;
  rows: PersonSummary[];
  defaultOpen: boolean;
  onToggleReturned: (ids: string[], returned: boolean) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (rows.length === 0) return null;
  const received = rows.reduce((s, p) => s + p.receivedTotal, 0);
  const given = rows.reduce((s, p) => s + p.givenTotal, 0);
  return (
    <div>
      <StGroupHead>
        <StGroupTitle>
          {title}
          <StGroupMeta>{rows.length}명</StGroupMeta>
        </StGroupTitle>
        <StGroupMeta>
          받은 {formatAmount(received)} · 낸 {formatAmount(given)}{" "}
          <StGhostBtn type="button" onClick={() => setOpen((v) => !v)}>
            {open ? "접기" : "펼치기"}
          </StGhostBtn>
        </StGroupMeta>
      </StGroupHead>
      {open
        ? splitByRelation(rows).map(([label, list]) => (
            <div key={label}>
              <StGroupHead>
                <StGroupMeta>
                  {label} · {list.length}명 · 받은{" "}
                  {formatAmount(list.reduce((s, p) => s + p.receivedTotal, 0))}
                </StGroupMeta>
              </StGroupHead>
              <RowsTable rows={list} onToggleReturned={onToggleReturned} />
            </div>
          ))
        : null}
    </div>
  );
}

type Props = {
  entries: GiftEntry[];
  onToggleReturned: (ids: string[], returned: boolean) => void;
};

export default function ExchangeTable({ entries, onToggleReturned }: Props) {
  // 기록이 있는 종류만 탭으로. 기본은 받은 기록이 가장 많은 종류
  const tabs = useMemo(() => {
    const count = new Map<GiftEventType, number>();
    for (const e of entries)
      count.set(e.eventType, (count.get(e.eventType) ?? 0) + 1);
    return EVENT_TYPE_KEYS.filter((k) => (count.get(k) ?? 0) > 0);
  }, [entries]);
  const defaultTab = useMemo(() => {
    let best: GiftEventType | null = null;
    let bestCount = -1;
    for (const k of tabs) {
      const n = entries.filter(
        (e) => e.eventType === k && e.direction === "received",
      ).length;
      if (n > bestCount) {
        best = k;
        bestCount = n;
      }
    }
    return best;
  }, [tabs, entries]);
  const [pickedTab, setPickedTab] = useState<GiftEventType | null>(null);
  const tab = pickedTab && tabs.includes(pickedTab) ? pickedTab : defaultTab;

  const scoped = useMemo(
    () => (tab ? entries.filter((e) => e.eventType === tab) : []),
    [entries, tab],
  );
  const people = useMemo(() => buildPersonSummaries(scoped), [scoped]);

  const byStatus = (want: Status[]) =>
    people
      .filter((p) => want.includes(statusOf(p)))
      .sort(
        (a, b) =>
          b.receivedTotal - a.receivedTotal || b.givenTotal - a.givenTotal,
      );
  const pending = byStatus(["pending"]);
  const done = byStatus(["given", "marked"]);
  const givenOnly = byStatus(["none"]);

  if (!tab || entries.length === 0) {
    return (
      <StEmpty>
        기록이 쌓이면 사람별로 받은 돈과 낸 돈을 나란히 비교해 드려요.
      </StEmpty>
    );
  }

  return (
    <>
      <StChipRow>
        {tabs.map((k) => (
          <StChip
            key={k}
            type="button"
            $active={tab === k}
            $color={EVENT_TYPE_COLOR[k]}
            onClick={() => setPickedTab(k)}
          >
            {EVENT_TYPE_ICON[k]} {TAB_LABEL[k]}
          </StChip>
        ))}
      </StChipRow>
      <StCardHint>
        <b>{EVENT_TYPE_LABEL[tab]}</b>만 놓고 사람별로 <b>받은 돈</b>과{" "}
        <b>낸 돈</b>을 나란히 봐요 (축의금과 부의금은 섞지 않아요). 답례가 끝난
        사람은 접어둡니다.
        {pending.length > 0
          ? ` 아직 안 낸 사람 ${pending.length}명.`
          : " 모두 답례했어요 🎉"}
      </StCardHint>

      {/* 묶음이 바뀔 때(탭 전환) 접힘 상태를 새로 잡도록 key에 탭을 넣는다 */}
      <Group
        key={`${tab}-pending`}
        title="🔔 아직 안 냄"
        rows={pending}
        defaultOpen
        onToggleReturned={onToggleReturned}
      />
      <Group
        key={`${tab}-done`}
        title="✓ 답례 완료"
        rows={done}
        defaultOpen={false}
        onToggleReturned={onToggleReturned}
      />
      <Group
        key={`${tab}-given`}
        title="💸 내가 낸 것만 있음"
        rows={givenOnly}
        defaultOpen={false}
        onToggleReturned={onToggleReturned}
      />
    </>
  );
}
