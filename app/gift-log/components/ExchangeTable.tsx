"use client";

import { Fragment, useMemo, useState } from "react";
import { buildPersonSummaries } from "../aggregate";
import ReturnAmountForm from "./ReturnAmountForm";
import { type ReturnPayment } from "../returned";
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
  DIRECTION_TONE,
  EVENT_TYPE_ICON,
  EVENT_TYPE_KEYS,
  EVENT_TYPE_LABEL,
  EVENT_TYPE_TONE,
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

// 사람 줄 하나에서 "냈음"을 켜고 끄는 두 동작. 목록 보기와 같은 함수를 쓴다.
type ReturnHandlers = {
  busy: boolean;
  onMarkReturned: (
    received: GiftEntry,
    ids: string[],
    paid: ReturnPayment | null,
  ) => Promise<void>;
  onUnmarkReturned: (received: GiftEntry, ids: string[]) => Promise<void>;
};

// 답례의 기준이 되는 받은 기록 = 가장 최근에 받은 것 (entries 는 날짜 내림차순)
function latestReceived(p: PersonSummary): GiftEntry | null {
  return p.entries.find((e) => e.direction === "received") ?? null;
}

// 한 묶음(아직 안 냄 / 답례 완료 / 내가 낸 것만)의 표
function RowsTable({
  rows,
  busy,
  onMarkReturned,
  onUnmarkReturned,
}: { rows: PersonSummary[] } & ReturnHandlers) {
  // 금액 적기 폼을 연 사람. mark = 아직 표시 전, fill = 표시는 됐고 금액만 채우는 중
  const [formFor, setFormFor] = useState<{
    personName: string;
    mode: "mark" | "fill";
  } | null>(null);

  return (
    <StTableWrap>
      <StTable $minWidth="40rem">
        {/* 묶음마다 표를 따로 그리므로 열 너비를 여기서 못박아 서로 맞춘다.
            관계는 바로 위 소제목("친구 · 대학 동기")에 이미 있어 칸을 두지 않는다.
            답례 칸은 "✓ 냈음 + 금액 적기 + 취소"까지 들어가야 해서 가장 넓다. */}
        <colgroup>
          <col style={{ width: "22%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "17%" }} />
          <col style={{ width: "30%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>이름</th>
            <th className="amount">받은 돈</th>
            <th className="amount">낸 돈</th>
            <th className="amount">차액</th>
            <th className="actions">답례</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const s = statusOf(p);
            // 답례의 기준이 되는 받은 기록. 없으면 "냈음" 자체를 물어볼 게 없다
            const received = latestReceived(p);
            const formOpen = formFor?.personName === p.personName && received;
            return (
              <Fragment key={p.personName}>
                <tr>
                  <td title={p.personName}>
                    <b>{p.personName}</b>
                  </td>
                  <td className="amount received">
                    {p.receivedTotal ? formatAmount(p.receivedTotal) : "–"}
                  </td>
                  <td className="amount given">
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
                  <td className="actions">
                    {s === "given" ? (
                      <StBadge $tone="good">✓ 냈음</StBadge>
                    ) : s === "marked" ? (
                      <>
                        <StBadge $tone="good">✓ 냈음</StBadge>
                        <StRowActionBtn
                          type="button"
                          $tone="blue"
                          onClick={() =>
                            setFormFor({
                              personName: p.personName,
                              mode: "fill",
                            })
                          }
                        >
                          금액 적기
                        </StRowActionBtn>
                        <StRowActionBtn
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            received &&
                            onUnmarkReturned(received, p.receivedIds)
                          }
                        >
                          취소
                        </StRowActionBtn>
                      </>
                    ) : s === "pending" ? (
                      <StRowActionBtn
                        type="button"
                        $tone={DIRECTION_TONE.given}
                        onClick={() =>
                          setFormFor({ personName: p.personName, mode: "mark" })
                        }
                      >
                        냈음 표시
                      </StRowActionBtn>
                    ) : (
                      <StBadge $tone="neutral">받은 것 없음</StBadge>
                    )}
                  </td>
                </tr>
                {formOpen && formFor && received ? (
                  <tr>
                    {/* 금액 입력은 줄 아래 한 칸을 통째로 쓴다 (목록 보기와 같은 폼) */}
                    <td className="form" colSpan={5}>
                      <ReturnAmountForm
                        personName={p.personName}
                        receivedDate={received.date}
                        mode={formFor.mode}
                        busy={busy}
                        onSave={async (date, amount) => {
                          await onMarkReturned(received, p.receivedIds, {
                            date,
                            amount,
                          });
                          setFormFor(null);
                        }}
                        onSkipAmount={async () => {
                          await onMarkReturned(received, p.receivedIds, null);
                          setFormFor(null);
                        }}
                        onClose={() => setFormFor(null)}
                      />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
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
  ...handlers
}: {
  title: string;
  rows: PersonSummary[];
  defaultOpen: boolean;
} & ReturnHandlers) {
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
              <RowsTable rows={list} {...handlers} />
            </div>
          ))
        : null}
    </div>
  );
}

type Props = { entries: GiftEntry[] } & ReturnHandlers;

export default function ExchangeTable({ entries, ...handlers }: Props) {
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
            $tone={EVENT_TYPE_TONE[k]}
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
        {...handlers}
      />
      <Group
        key={`${tab}-done`}
        title="✓ 답례 완료"
        rows={done}
        defaultOpen={false}
        {...handlers}
      />
      <Group
        key={`${tab}-given`}
        title="💸 내가 낸 것만 있음"
        rows={givenOnly}
        defaultOpen={false}
        {...handlers}
      />
    </>
  );
}
