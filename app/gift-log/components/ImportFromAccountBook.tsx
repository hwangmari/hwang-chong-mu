"use client";

import { useState } from "react";
import Link from "next/link";
import {
  fetchImportCandidates,
  resolveAccountBookSource,
  type ImportCandidate,
} from "../importFromAccountBook";
import { loadExcludedSourceIds, saveExcludedSourceIds } from "../storage";
import {
  StCard,
  StCardHead,
  StCardHint,
  StCardTitle,
  StChip,
  StChipRow,
  StEmpty,
  StError,
  StGhostBtn,
  StGhostDangerBtn,
  StImportFields,
  StImportHint,
  StImportList,
  StImportMeta,
  StImportRow,
  StPrimarySmallBtn,
  StRowActionBtn,
  StSmallInput,
  StTag,
} from "../page.styles";
import {
  DIRECTION_COLOR,
  DIRECTION_LABEL,
  EVENT_TYPE_COLOR,
  EVENT_TYPE_ICON,
  EVENT_TYPE_KEYS,
  EVENT_TYPE_LABEL,
  RELATION_COLOR,
  RELATION_KEYS,
  RELATION_LABEL,
  type GiftEntry,
  type GiftEntryInput,
  type GiftEventType,
  type GiftRelation,
} from "../types";
import { formatAmount } from "./giftFormat";

// 후보 한 줄에서 사람이 채우는 값
type Draft = {
  personName: string;
  eventType: GiftEventType;
  relation: GiftRelation;
};

type Props = {
  entries: GiftEntry[]; // 이미 담긴 것 판별용
  onImport: (input: GiftEntryInput) => Promise<void>;
};

export default function ImportFromAccountBook({ entries, onImport }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sourceKind, setSourceKind] = useState<"linked" | "recent" | "none" | null>(null);
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [showImported, setShowImported] = useState(false);
  // "경조사 아님"으로 제외한 가계부 항목 id (이 브라우저에 기억)
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [showExcluded, setShowExcluded] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setOpen(true);
    setLoading(true);
    setError("");
    setExcluded(loadExcludedSourceIds());
    try {
      const source = await resolveAccountBookSource();
      setSourceKind(source.kind);
      if (source.kind === "none") {
        setCandidates([]);
        return;
      }
      const list = await fetchImportCandidates(source.workspaceId, entries);
      setCandidates(list);
      // 초안: 추측한 이름/종류 + 관계는 친구로 시작
      const next: Record<string, Draft> = {};
      for (const c of list) {
        next[c.sourceId] = {
          personName: c.guessedName,
          eventType: c.guessedEventType,
          relation: "friend",
        };
      }
      setDrafts(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "가계부를 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }

  function setExcludedFor(id: string, on: boolean) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      saveExcludedSourceIds(next);
      return next;
    });
  }

  function patch(id: string, p: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...p } }));
  }

  async function importOne(c: ImportCandidate) {
    const draft = drafts[c.sourceId];
    const personName = draft?.personName.trim() ?? "";
    if (!personName) {
      setError("담기 전에 상대방 이름을 입력해 주세요.");
      return;
    }
    setSavingId(c.sourceId);
    setError("");
    try {
      await onImport({
        date: c.date,
        eventType: draft.eventType,
        direction: c.direction,
        personName,
        relation: draft.relation,
        relationDetail: "",
        amount: c.amount,
        memo: c.hint ? `가계부: ${c.hint}` : "",
      });
      // 담은 건 목록에서 "이미 담김"으로 표시
      setCandidates((prev) =>
        prev.map((item) =>
          item.sourceId === c.sourceId ? { ...item, alreadyImported: true } : item,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "담지 못했어요.");
    } finally {
      setSavingId(null);
    }
  }

  const visible = candidates.filter(
    (c) =>
      (showImported || !c.alreadyImported) &&
      (showExcluded || !excluded.has(c.sourceId)),
  );
  const importedCount = candidates.filter((c) => c.alreadyImported).length;
  const excludedCount = candidates.filter((c) => excluded.has(c.sourceId)).length;

  return (
    <StCard>
      <StCardHead>
        <StCardTitle>🧾 가계부에서 가져오기</StCardTitle>
        {open ? (
          <StGhostBtn type="button" onClick={() => void load()} disabled={loading}>
            {loading ? "불러오는 중..." : "다시 불러오기"}
          </StGhostBtn>
        ) : (
          <StGhostBtn type="button" onClick={() => void load()}>
            가계부 경조사 내역 불러오기
          </StGhostBtn>
        )}
      </StCardHead>
      <StCardHint>
        가계부의 <b>특별/기타 &gt; 경조사</b> 항목과 &ldquo;축의·조의&rdquo; 같은 단어가 있는
        내역을 찾아와요. 가계부엔 상대방 이름이 없어서 <b>이름만 채우고 담기</b>를 누르면
        장부에 들어갑니다. 경조사비 장부는 가계부 없이도 그대로 쓸 수 있어요.
      </StCardHint>

      {!open ? null : loading ? (
        <StEmpty>가계부를 읽는 중...</StEmpty>
      ) : sourceKind === "none" ? (
        <StEmpty>
          연결된 가계부를 찾지 못했어요.{" "}
          <Link href="/account">내 계정</Link>에서 가계부를 연결하거나,{" "}
          <Link href="/account-book">가계부</Link>를 한 번 열어본 뒤 다시 불러와 주세요.
        </StEmpty>
      ) : candidates.length === 0 ? (
        <StEmpty>가계부에서 경조사로 보이는 내역을 찾지 못했어요.</StEmpty>
      ) : (
        <>
          {error ? <StError>{error}</StError> : null}
          <StCardHint>
            {sourceKind === "recent"
              ? "이 브라우저에서 마지막으로 연 가계부 기준이에요. "
              : "계정에 연결된 가계부 기준이에요. "}
            후보 {candidates.length}건
            {importedCount > 0 ? ` · 이미 담긴 ${importedCount}건` : ""}
            {excludedCount > 0 ? ` · 제외한 ${excludedCount}건` : ""}
          </StCardHint>
          {importedCount > 0 || excludedCount > 0 ? (
            <StChipRow>
              {importedCount > 0 ? (
                <StGhostBtn type="button" onClick={() => setShowImported((v) => !v)}>
                  {showImported ? "담긴 것 숨기기" : "담긴 것도 보기"}
                </StGhostBtn>
              ) : null}
              {excludedCount > 0 ? (
                <StGhostBtn type="button" onClick={() => setShowExcluded((v) => !v)}>
                  {showExcluded ? "제외한 것 숨기기" : "제외한 것도 보기"}
                </StGhostBtn>
              ) : null}
            </StChipRow>
          ) : null}

          {visible.length === 0 ? (
            <StEmpty>남은 후보가 없어요 🎉</StEmpty>
          ) : (
            <StImportList>
              {visible.map((c) => {
                const draft = drafts[c.sourceId];
                if (!draft) return null;
                const isExcluded = excluded.has(c.sourceId);
                return (
                  <StImportRow key={c.sourceId} $muted={c.alreadyImported || isExcluded}>
                    <StImportMeta>
                      <time>{c.date}</time>
                      <StTag $color={DIRECTION_COLOR[c.direction]}>
                        {DIRECTION_LABEL[c.direction]}
                      </StTag>
                      <b style={{ color: DIRECTION_COLOR[c.direction] }}>
                        {formatAmount(c.amount)}
                      </b>
                      {c.alreadyImported ? (
                        <StTag $color="#7d8593">이미 담김</StTag>
                      ) : null}
                      {isExcluded ? (
                        <>
                          <StTag $color="#7d8593">제외함</StTag>
                          <StRowActionBtn
                            type="button"
                            onClick={() => setExcludedFor(c.sourceId, false)}
                          >
                            되살리기
                          </StRowActionBtn>
                        </>
                      ) : null}
                    </StImportMeta>
                    {c.hint ? <StImportHint>가계부 원문: {c.hint}</StImportHint> : null}

                    {c.alreadyImported || isExcluded ? null : (
                      <>
                        <StChipRow>
                          {EVENT_TYPE_KEYS.map((key) => (
                            <StChip
                              key={key}
                              type="button"
                              $active={draft.eventType === key}
                              $color={EVENT_TYPE_COLOR[key]}
                              onClick={() => patch(c.sourceId, { eventType: key })}
                            >
                              {EVENT_TYPE_ICON[key]} {EVENT_TYPE_LABEL[key]}
                            </StChip>
                          ))}
                        </StChipRow>
                        <StChipRow>
                          {RELATION_KEYS.map((key) => (
                            <StChip
                              key={key}
                              type="button"
                              $active={draft.relation === key}
                              $color={RELATION_COLOR[key]}
                              onClick={() => patch(c.sourceId, { relation: key })}
                            >
                              {RELATION_LABEL[key]}
                            </StChip>
                          ))}
                        </StChipRow>
                        <StImportFields>
                          <StSmallInput
                            type="text"
                            placeholder="상대방 이름 (필수)"
                            value={draft.personName}
                            autoComplete="off"
                            onChange={(e) =>
                              patch(c.sourceId, { personName: e.target.value })
                            }
                          />
                          <StChipRow>
                            <StPrimarySmallBtn
                              type="button"
                              disabled={savingId === c.sourceId || !draft.personName.trim()}
                              onClick={() => void importOne(c)}
                            >
                              {savingId === c.sourceId ? "담는 중..." : "장부에 담기"}
                            </StPrimarySmallBtn>
                            <StGhostDangerBtn
                              type="button"
                              title="경조사가 아니면 목록에서 치워요 (되살릴 수 있어요)"
                              onClick={() => setExcludedFor(c.sourceId, true)}
                            >
                              제외
                            </StGhostDangerBtn>
                          </StChipRow>
                        </StImportFields>
                      </>
                    )}
                  </StImportRow>
                );
              })}
            </StImportList>
          )}
        </>
      )}
    </StCard>
  );
}
