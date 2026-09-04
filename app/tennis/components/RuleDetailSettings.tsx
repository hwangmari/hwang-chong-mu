"use client";

import { useMemo, useState } from "react";
import { checkCustomOrder, checkRuleRequirements, orderedPool, type Split } from "../generate";
import {
  PAIR_RELATION_LABEL,
  ROUND_ORDER_HINT,
  ROUND_ORDER_LABEL,
  hasDetailRules,
  normPair,
  type PairRelation,
  type RoundOrder,
  type RuleSettings,
} from "../rules";
import {
  StCardHint,
  StChip,
  StChipRow,
  StDetailPanel,
  StDetailSection,
  StDetailTitle,
  StFieldName,
  StGhostBtn,
  StMiniInput,
  StNotice,
  StPairRow,
  StSelect,
  StSlotBox,
  StSlotGrid,
  StSlotLabel,
  StTable,
  StTableWrap,
} from "../page.styles";
import { MATCH_TYPE_SHORT, type MatchType, type Player } from "../types";

type Props = {
  players: Player[];
  courts: number;
  totalMatches: number;
  rules: RuleSettings;
  onChange: (next: RuleSettings) => void;
  autoSplit: Split; // 인원에 맞춰 자동으로 고른 구성
  manualSplit: Split; // 사람이 직접 넣은 구성
  onManualSplitChange: (next: Split) => void;
};

type PairRow = { relation: PairRelation; a: string; b: string };

const RELATIONS: PairRelation[] = ["mustPair", "avoidPair", "avoidOpponent"];
const ROUND_ORDERS: RoundOrder[] = ["sameFirst", "mixedFirst", "alternate", "custom"];
const TYPES: MatchType[] = ["men", "women", "mixed"];

function rowsFromRules(rules: RuleSettings): PairRow[] {
  return [
    ...rules.mustPair.map(([a, b]) => ({ relation: "mustPair" as const, a, b })),
    ...rules.avoidPair.map(([a, b]) => ({ relation: "avoidPair" as const, a, b })),
    ...rules.avoidOpponent.map(([a, b]) => ({ relation: "avoidOpponent" as const, a, b })),
  ];
}

// 한 묶음에 코트 수만큼 경기가 들어간다. 마지막 묶음은 남은 만큼만
function slotCounts(totalMatches: number, courts: number): number[] {
  const rounds = Math.ceil(totalMatches / Math.max(1, courts));
  return Array.from({ length: rounds }, (_, i) =>
    Math.min(courts, totalMatches - i * courts),
  );
}

function chunk(list: MatchType[], counts: number[]): MatchType[][] {
  const out: MatchType[][] = [];
  let at = 0;
  for (const n of counts) {
    out.push(list.slice(at, at + n));
    at += n;
  }
  return out;
}

export default function RuleDetailSettings({
  players,
  courts,
  totalMatches,
  rules,
  onChange,
  autoSplit,
  manualSplit,
  onManualSplitChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showLimits, setShowLimits] = useState(
    () => Object.keys(rules.playerLimits).length > 0 || Object.keys(rules.restRounds).length > 0,
  );
  const [restText, setRestText] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<PairRow[]>(() => rowsFromRules(rules));

  const split = rules.splitMode === "manual" ? manualSplit : autoSplit;
  const men = players.filter((p) => p.gender === "M").length;
  const women = players.length - men;
  const counts = useMemo(() => slotCounts(totalMatches, courts), [totalMatches, courts]);
  const rounds = counts.length;

  function patch(next: Partial<RuleSettings>) {
    onChange({ ...rules, ...next });
  }

  // === 1. 종목 구성 직접 지정 ===
  const manualSum = manualSplit.menMatches + manualSplit.womenMatches + manualSplit.mixedMatches;
  const splitProblem = (() => {
    if (rules.splitMode !== "manual") return "";
    if (manualSum !== totalMatches) return `세 종목을 더하면 총 경기 수(${totalMatches})가 되어야 해요. 지금은 ${manualSum}경기예요.`;
    if (manualSplit.menMatches > 0 && men < 4) return "남자 복식을 하려면 남자가 4명 이상이어야 해요.";
    if (manualSplit.womenMatches > 0 && women < 4) return "여자 복식을 하려면 여자가 4명 이상이어야 해요.";
    if (manualSplit.mixedMatches > 0 && (men < 2 || women < 2)) return "혼합 복식을 하려면 남자·여자가 각각 2명 이상이어야 해요.";
    if (courts >= 2 && manualSplit.menMatches >= 2 && men < 8 && manualSplit.womenMatches + manualSplit.mixedMatches === 0)
      return "남자 복식만으로 코트 두 면을 동시에 채우려면 남자가 8명 이상 필요해요.";
    return "";
  })();

  function setManual(key: keyof Split, value: number) {
    onManualSplitChange({ ...manualSplit, [key]: Math.max(0, Math.min(60, value)) });
  }

  // === 2. 종목 순서 ===
  const customOrder = rules.customOrder ?? chunk(orderedPool(split, "sameFirst"), counts);
  const customProblem =
    rules.roundOrder === "custom"
      ? checkCustomOrder(rules.customOrder, split, courts, rounds, men, women)
      : "";

  function pickOrder(order: RoundOrder) {
    if (order !== "custom") {
      patch({ roundOrder: order, customOrder: null });
      return;
    }
    patch({ roundOrder: "custom", customOrder: chunk(orderedPool(split, "sameFirst"), counts) });
  }

  function setSlot(roundIndex: number, slotIndex: number, type: MatchType) {
    const next = customOrder.map((row, i) =>
      i === roundIndex ? row.map((t, j) => (j === slotIndex ? type : t)) : [...row],
    );
    patch({ customOrder: next });
  }

  // === 4·6. 사람별 출전 조정 ===
  function setLimit(name: string, key: "min" | "max", raw: string) {
    const limits = { ...rules.playerLimits };
    const current = { ...(limits[name] ?? {}) };
    if (raw.trim() === "") delete current[key];
    else current[key] = Math.max(0, Math.min(99, Number(raw) || 0));
    if (current.min === undefined && current.max === undefined) delete limits[name];
    else limits[name] = current;
    patch({ playerLimits: limits });
  }

  function setRest(name: string, raw: string) {
    setRestText((prev) => ({ ...prev, [name]: raw }));
    const list = [
      ...new Set(
        raw
          .split(/[,\s]+/)
          .map((t) => Number(t))
          .filter((n) => Number.isFinite(n) && n >= 1 && n <= rounds)
          .map((n) => Math.floor(n)),
      ),
    ].sort((a, b) => a - b);
    const next = { ...rules.restRounds };
    if (list.length === 0) delete next[name];
    else next[name] = list;
    patch({ restRounds: next });
  }

  // === 5. 짝 요건 ===
  function pushRows(next: PairRow[]) {
    setRows(next);
    const bucket: Record<PairRelation, [string, string][]> = {
      mustPair: [],
      avoidPair: [],
      avoidOpponent: [],
    };
    for (const row of next) {
      if (!row.a || !row.b || row.a === row.b) continue;
      const key = normPair(row.a, row.b);
      if (bucket[row.relation].some(([x, y]) => x === key[0] && y === key[1])) continue;
      bucket[row.relation].push(key);
    }
    patch({ mustPair: bucket.mustPair, avoidPair: bucket.avoidPair, avoidOpponent: bucket.avoidOpponent });
  }

  const requirementProblem = checkRuleRequirements(players, split, rules);
  const detailOn = hasDetailRules(rules);

  return (
    <>
      <StChipRow style={{ marginTop: "0.4rem" }}>
        <StGhostBtn type="button" onClick={() => setOpen((v) => !v)}>
          {open ? "세부 요건 설정 접기" : "⚙️ 세부 요건 설정 펼치기"}
        </StGhostBtn>
        {detailOn ? <StCardHint style={{ margin: 0 }}>세부 요건을 쓰고 있어요.</StCardHint> : null}
      </StChipRow>

      {!open ? null : (
        <StDetailPanel>
          {/* 1. 종목 구성 */}
          <StDetailSection>
            <StDetailTitle>1. 종목 수 — 남복 · 여복 · 혼복을 몇 경기씩</StDetailTitle>
            <StChipRow>
              <StChip
                type="button"
                $active={rules.splitMode === "manual"}
                $color="#1f8a54"
                onClick={() => patch({ splitMode: rules.splitMode === "manual" ? "auto" : "manual", customOrder: null, roundOrder: rules.roundOrder === "custom" ? "sameFirst" : rules.roundOrder })}
              >
                {rules.splitMode === "manual" ? "✓ " : ""}종목 수 직접 정하기
              </StChip>
            </StChipRow>
            {rules.splitMode === "manual" ? (
              <>
                <StPairRow>
                  <label>
                    <StFieldName>남자 복식</StFieldName>
                    <StMiniInput
                      type="number"
                      min={0}
                      max={60}
                      value={manualSplit.menMatches}
                      onChange={(e) => setManual("menMatches", Number(e.target.value) || 0)}
                    />
                  </label>
                  <label>
                    <StFieldName>여자 복식</StFieldName>
                    <StMiniInput
                      type="number"
                      min={0}
                      max={60}
                      value={manualSplit.womenMatches}
                      onChange={(e) => setManual("womenMatches", Number(e.target.value) || 0)}
                    />
                  </label>
                  <label>
                    <StFieldName>혼합 복식</StFieldName>
                    <StMiniInput
                      type="number"
                      min={0}
                      max={60}
                      value={manualSplit.mixedMatches}
                      onChange={(e) => setManual("mixedMatches", Number(e.target.value) || 0)}
                    />
                  </label>
                </StPairRow>
                {splitProblem ? <StNotice $tone="warn">{splitProblem}</StNotice> : null}
              </>
            ) : (
              <StCardHint>
                지금은 인원에 맞춰 자동으로 정해요 — 남복 {autoSplit.menMatches} · 여복{" "}
                {autoSplit.womenMatches} · 혼복 {autoSplit.mixedMatches}경기. 직접 정하고 싶으면 위 버튼을 누르세요.
              </StCardHint>
            )}
          </StDetailSection>

          {/* 2. 종목 순서 */}
          <StDetailSection>
            <StDetailTitle>2. 종목 순서 — 어떤 경기를 먼저 할지</StDetailTitle>
            <StChipRow>
              {ROUND_ORDERS.map((order) => (
                <StChip
                  key={order}
                  type="button"
                  $active={rules.roundOrder === order}
                  $color="#1f8a54"
                  title={ROUND_ORDER_HINT[order]}
                  onClick={() => pickOrder(order)}
                >
                  {ROUND_ORDER_LABEL[order]}
                </StChip>
              ))}
            </StChipRow>
            <StCardHint>{ROUND_ORDER_HINT[rules.roundOrder]}</StCardHint>
            {rules.roundOrder === "custom" ? (
              <>
                <StSlotGrid>
                  {customOrder.map((row, i) => (
                    <StSlotBox key={i}>
                      <StSlotLabel>{i + 1}번째 묶음</StSlotLabel>
                      {row.map((type, j) => (
                        <StSelect
                          key={j}
                          value={type}
                          aria-label={`${i + 1}번째 묶음 ${j + 1}번 코트 종목`}
                          onChange={(e) => setSlot(i, j, e.target.value as MatchType)}
                        >
                          {TYPES.map((t) => (
                            <option key={t} value={t}>
                              {MATCH_TYPE_SHORT[t]}
                            </option>
                          ))}
                        </StSelect>
                      ))}
                    </StSlotBox>
                  ))}
                </StSlotGrid>
                {customProblem ? <StNotice $tone="warn">{customProblem}</StNotice> : null}
              </>
            ) : null}
          </StDetailSection>

          {/* 3. 연속 휴식 */}
          <StDetailSection>
            <StDetailTitle>3. 최대 연속 휴식 — 몇 묶음까지 쉬어도 되는지</StDetailTitle>
            {rules.maxRest === null ? (
              <StCardHint>위쪽 &ldquo;연속 휴식 제한&rdquo; 칩을 켜면 숫자를 정할 수 있어요.</StCardHint>
            ) : (
              <StPairRow>
                <label>
                  <StFieldName>최대 연속 휴식 (묶음)</StFieldName>
                  <StMiniInput
                    type="number"
                    min={1}
                    max={5}
                    value={rules.maxRest}
                    onChange={(e) => patch({ maxRest: Math.max(1, Math.min(5, Number(e.target.value) || 1)) })}
                  />
                </label>
              </StPairRow>
            )}
            <StCardHint>한 묶음 = 코트 {courts}면이 동시에 뛰는 시간이에요. 숫자가 작을수록 자주 나와요.</StCardHint>
          </StDetailSection>

          {/* 4·6. 사람별 출전 조정 */}
          <StDetailSection>
            <StDetailTitle>4. 출전 횟수 — 전원 상한과 사람별 조정</StDetailTitle>
            <StPairRow>
              <label>
                <StFieldName>전원 출전 상한 (비우면 없음)</StFieldName>
                <StMiniInput
                  type="number"
                  min={1}
                  max={99}
                  value={rules.appearanceCap ?? ""}
                  onChange={(e) =>
                    patch({
                      appearanceCap: e.target.value.trim() === "" ? null : Math.max(1, Math.min(99, Number(e.target.value) || 1)),
                    })
                  }
                />
              </label>
            </StPairRow>
            <StChipRow>
              <StChip type="button" $active={showLimits} $color="#1f8a54" onClick={() => setShowLimits((v) => !v)}>
                {showLimits ? "✓ " : ""}사람별 출전 조정
              </StChip>
            </StChipRow>
            {showLimits ? (
              players.length === 0 ? (
                <StCardHint>선수 명단을 먼저 넣어 주세요.</StCardHint>
              ) : (
                <>
                  <StCardHint>
                    비워 두면 제한이 없어요. 늦게 오거나 먼저 가는 사람은 &ldquo;쉬는 묶음&rdquo;을 적어 주세요.
                  </StCardHint>
                  <StCardHint>쉬는 묶음: 쉼표로 묶음 번호 (예: 1,2)</StCardHint>
                  <StTableWrap>
                    <StTable>
                      <thead>
                        <tr>
                          <th>선수</th>
                          <th>최소</th>
                          <th>최대</th>
                          <th className="right">쉬는 묶음 (1~{rounds})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {players.map((p, index) => (
                          <tr key={p.name}>
                            <td>{p.name}</td>
                            <td>
                              <StMiniInput
                                type="number"
                                min={0}
                                max={99}
                                value={rules.playerLimits[p.name]?.min ?? ""}
                                aria-label={`${p.name} 최소 출전`}
                                onChange={(e) => setLimit(p.name, "min", e.target.value)}
                              />
                            </td>
                            <td>
                              <StMiniInput
                                type="number"
                                min={0}
                                max={99}
                                value={rules.playerLimits[p.name]?.max ?? ""}
                                aria-label={`${p.name} 최대 출전`}
                                onChange={(e) => setLimit(p.name, "max", e.target.value)}
                              />
                            </td>
                            <td className="right">
                              <StMiniInput
                                as="input"
                                type="text"
                                inputMode="numeric"
                                placeholder={index === 0 ? "예) 1,2" : ""}
                                style={{ width: "6.5rem" }}
                                aria-label={`${p.name} 쉬는 묶음`}
                                value={restText[p.name] ?? (rules.restRounds[p.name] ?? []).join(",")}
                                onChange={(e) => setRest(p.name, e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </StTable>
                  </StTableWrap>
                </>
              )
            ) : null}
          </StDetailSection>

          {/* 5. 짝 요건 */}
          <StDetailSection>
            <StDetailTitle>5. 짝 요건 — 꼭 같이 / 같이 말고 / 만나지 않게</StDetailTitle>
            <StCardHint>
              두 사람을 고르고 관계를 정하세요. &ldquo;꼭 같이 짝&rdquo;은 늘 한 팀, &ldquo;짝 금지&rdquo;는 한 팀이 되지
              않기, &ldquo;상대 금지&rdquo;는 서로 맞붙지 않기예요.
            </StCardHint>
            {rows.map((row, i) => (
              <StPairRow key={i}>
                <StSelect
                  value={row.a}
                  aria-label={`짝 요건 ${i + 1} 선수 A`}
                  onChange={(e) => pushRows(rows.map((r, j) => (j === i ? { ...r, a: e.target.value } : r)))}
                >
                  <option value="">선수 A</option>
                  {players.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </StSelect>
                <StSelect
                  value={row.relation}
                  aria-label={`짝 요건 ${i + 1} 관계`}
                  onChange={(e) =>
                    pushRows(rows.map((r, j) => (j === i ? { ...r, relation: e.target.value as PairRelation } : r)))
                  }
                >
                  {RELATIONS.map((rel) => (
                    <option key={rel} value={rel}>
                      {PAIR_RELATION_LABEL[rel]}
                    </option>
                  ))}
                </StSelect>
                <StSelect
                  value={row.b}
                  aria-label={`짝 요건 ${i + 1} 선수 B`}
                  onChange={(e) => pushRows(rows.map((r, j) => (j === i ? { ...r, b: e.target.value } : r)))}
                >
                  <option value="">선수 B</option>
                  {players.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </StSelect>
                <StGhostBtn type="button" onClick={() => pushRows(rows.filter((_, j) => j !== i))}>
                  삭제
                </StGhostBtn>
              </StPairRow>
            ))}
            <StChipRow>
              <StGhostBtn
                type="button"
                onClick={() => setRows([...rows, { relation: "mustPair", a: "", b: "" }])}
                disabled={players.length < 2}
              >
                + 요건 추가
              </StGhostBtn>
            </StChipRow>
          </StDetailSection>

          {/* 7. 구력 균형 허용 차 */}
          <StDetailSection>
            <StDetailTitle>6. 구력 차이 — 몇 년까지는 같다고 볼지</StDetailTitle>
            {rules.balancedYears ? (
              <>
                <StPairRow>
                  <label>
                    <StFieldName>허용 구력 차</StFieldName>
                    <StMiniInput
                      type="number"
                      min={0}
                      max={30}
                      value={rules.yearsTolerance ?? ""}
                      onChange={(e) =>
                        patch({
                          yearsTolerance:
                            e.target.value.trim() === "" ? null : Math.max(0, Math.min(30, Number(e.target.value) || 0)),
                        })
                      }
                    />
                  </label>
                </StPairRow>
                <StCardHint>단위는 년이에요. 비우면 자동으로 맞춰요.</StCardHint>
                <StCardHint>
                  두 팀의 구력 합 차이가 이 숫자 안이면 &ldquo;공평하다&rdquo;고 보고, 넘으면 강하게 피해요. 비워 두면
                  지금처럼 차이가 작을수록 좋다고만 봐요.
                </StCardHint>
              </>
            ) : (
              <StCardHint>위쪽 &ldquo;구력 균형&rdquo; 칩을 켜면 숫자를 정할 수 있어요.</StCardHint>
            )}
          </StDetailSection>

          {requirementProblem ? <StNotice $tone="error">{requirementProblem}</StNotice> : null}
        </StDetailPanel>
      )}
    </>
  );
}
