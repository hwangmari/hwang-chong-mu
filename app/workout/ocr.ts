import type { RunningEnvironment, RunningType } from "./types";

// =========================
// OCR 실행
// =========================
export async function runWorkoutOcr(
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<string> {
  const { createWorker, PSM } = await import("tesseract.js");
  const worker = await createWorker("kor+eng", undefined, {
    logger: onProgress
      ? (m) => {
          if (m.status === "recognizing text") onProgress(m.progress);
        }
      : undefined,
  });

  try {
    await worker.setParameters({
      preserve_interword_spaces: "1",
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
    });
    const {
      data: { text },
    } = await worker.recognize(file);
    return text;
  } finally {
    await worker.terminate();
  }
}

// =========================
// 파싱 결과 타입
// =========================
export type ParsedRun = {
  source: "apple-fitness" | "treadmill" | "generic";
  environment?: RunningEnvironment;
  runType?: RunningType;
  distanceKm?: number;
  durationSec?: number;
  avgPaceSec?: number;
  avgHeartRate?: number;
  avgCadence?: number;
  calories?: number;
};

// =========================
// 유틸
// =========================
function num(s: string | undefined | null): number | undefined {
  if (!s) return undefined;
  const n = Number(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function parseHms(input: string): number | undefined {
  // "0:32:13" | "32:13" | "30:01"
  const match = input.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return undefined;
  const a = Number(match[1]);
  const b = Number(match[2]);
  const c = match[3] ? Number(match[3]) : undefined;
  if (c !== undefined) return a * 3600 + b * 60 + c;
  return a * 60 + b;
}

function parsePaceToSec(input: string): number | undefined {
  // 8'16"/KM  or  8'16  (분'초)
  const match = input.match(/(\d{1,2})\s*['′]\s*(\d{1,2})/);
  if (!match) return undefined;
  return Number(match[1]) * 60 + Number(match[2]);
}

// =========================
// 소스 감지
// =========================
function detectSource(text: string): ParsedRun["source"] {
  const upper = text.toUpperCase();
  const hasAppleMarks =
    /KCAL/.test(upper) && (/SPM/.test(upper) || /BPM/.test(upper));
  if (hasAppleMarks) return "apple-fitness";

  const hasTreadmillMarks =
    /KM\/H/.test(upper) || /경사도/.test(text) || /min:sec/i.test(text);
  if (hasTreadmillMarks) return "treadmill";

  return "generic";
}

// =========================
// Apple Fitness 파서
// =========================
function parseAppleFitness(text: string): ParsedRun {
  const upper = text.toUpperCase();
  const result: ParsedRun = { source: "apple-fitness" };

  // 실내/실외 감지
  if (/실내/.test(text) || /INDOOR/i.test(text)) {
    result.environment = "indoor";
  } else if (/실외/.test(text) || /OUTDOOR/i.test(text)) {
    result.environment = "outdoor";
  }

  // 거리: 3.90KM
  const distMatch = upper.match(/([\d.]+)\s*KM/);
  if (distMatch) result.distanceKm = num(distMatch[1]);

  // 시간: 0:32:13 (또는 32:13)
  const durMatch = text.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
  if (durMatch) result.durationSec = parseHms(durMatch[1]);

  // 페이스: 8'16"/KM
  const paceMatch = text.match(/(\d{1,2}['′]\s*\d{1,2})["″']?\s*\/?\s*KM/i);
  if (paceMatch) result.avgPaceSec = parsePaceToSec(paceMatch[1]);

  // 심박: 154BPM (레이블 있든 없든)
  const hrMatch = upper.match(/(\d{2,3})\s*BPM/);
  if (hrMatch) result.avgHeartRate = num(hrMatch[1]);

  // 케이던스: 149SPM
  const cadMatch = upper.match(/(\d{2,3})\s*SPM/);
  if (cadMatch) result.avgCadence = num(cadMatch[1]);

  // 칼로리: "총 킬로칼로리 286KCAL" 우선, 없으면 첫 KCAL
  const totalCalMatch = text.match(/총\s*킬로\s*칼로리[^\d]{0,8}(\d{2,4})/);
  if (totalCalMatch) {
    result.calories = num(totalCalMatch[1]);
  } else {
    const calMatch = upper.match(/(\d{2,4})\s*KCAL/);
    if (calMatch) result.calories = num(calMatch[1]);
  }

  // runType 힌트 (Zone2/Easy 추정)
  if (result.avgHeartRate && result.avgHeartRate < 145) {
    result.runType = "zone2";
  } else if (result.avgPaceSec && result.avgPaceSec > 480) {
    result.runType = "easy";
  }

  return result;
}

// =========================
// 트레드밀 디스플레이 파서
// =========================
function parseTreadmill(text: string): ParsedRun {
  const result: ParsedRun = { source: "treadmill", environment: "indoor" };

  // 라벨 뒤에 오는 숫자 기반 매칭
  // 거리: "거리" 근처 숫자, 뒤에 km
  const distMatch =
    text.match(/거리[^\d-]{0,15}([\d.]+)/) ||
    text.match(/([\d.]+)\s*KM(?!\/H)/i);
  if (distMatch) result.distanceKm = num(distMatch[1]);

  // 기간: "기간" 또는 "min:sec" 뒤에 오는 mm:ss
  const durMatch =
    text.match(/기간[^\d:]{0,20}(\d{1,2}:\d{2}(?::\d{2})?)/) ||
    text.match(/min\s*:\s*sec[^\d]{0,20}(\d{1,2}:\d{2})/i);
  if (durMatch) result.durationSec = parseHms(durMatch[1]);

  // 페이스 (있으면)
  const paceMatch = text.match(/페이스[^\d]{0,15}(\d{1,2}:\d{2})/);
  if (paceMatch) {
    const [m, s] = paceMatch[1].split(":").map(Number);
    result.avgPaceSec = m * 60 + s;
  }

  // 칼로리가 있다면
  const calMatch = text.match(/(\d{2,4})\s*KCAL/i);
  if (calMatch) result.calories = num(calMatch[1]);

  // 심박
  const hrMatch = text.match(/(\d{2,3})\s*BPM/i);
  if (hrMatch) result.avgHeartRate = num(hrMatch[1]);

  return result;
}

// =========================
// Generic fallback
// =========================
function parseGeneric(text: string): ParsedRun {
  const result: ParsedRun = { source: "generic" };

  const distMatch = text.match(/([\d.]+)\s*KM(?!\/H)/i);
  if (distMatch) result.distanceKm = num(distMatch[1]);

  const durMatch = text.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
  if (durMatch) result.durationSec = parseHms(durMatch[1]);

  const hrMatch = text.match(/(\d{2,3})\s*BPM/i);
  if (hrMatch) result.avgHeartRate = num(hrMatch[1]);

  const calMatch = text.match(/(\d{2,4})\s*KCAL/i);
  if (calMatch) result.calories = num(calMatch[1]);

  return result;
}

// =========================
// 메인 파서
// =========================
export function parseRunFromText(text: string): ParsedRun {
  const source = detectSource(text);
  if (source === "apple-fitness") return parseAppleFitness(text);
  if (source === "treadmill") return parseTreadmill(text);
  return parseGeneric(text);
}

// =========================
// 헬스/웨이트 OCR 결과 타입
// =========================
export type ParsedGym = {
  source: "apple-fitness" | "generic";
  durationMin?: number;
  durationSec?: number;
  calories?: number;
  avgHeartRate?: number;
};

// =========================
// 헬스 파서 (Apple Fitness 근력/기타 운동 요약)
// =========================
export function parseGymFromText(text: string): ParsedGym {
  const upper = text.toUpperCase();
  const isApple =
    /KCAL/.test(upper) && (/BPM/.test(upper) || /킬로\s*칼로리/.test(text));
  const result: ParsedGym = {
    source: isApple ? "apple-fitness" : "generic",
  };

  // 운동 시간: 0:32:13 | 32:13
  const durMatch = text.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
  if (durMatch) {
    const sec = parseHms(durMatch[1]);
    if (sec !== undefined) {
      result.durationSec = sec;
      result.durationMin = Math.round(sec / 60);
    }
  }

  // 총 킬로칼로리 우선, 없으면 활동 칼로리, 그 다음 첫 KCAL
  const totalCalMatch = text.match(/총\s*킬로\s*칼로리[^\d]{0,8}(\d{2,4})/);
  const activeCalMatch = text.match(/활동\s*킬로\s*칼로리[^\d]{0,8}(\d{2,4})/);
  const anyCalMatch = upper.match(/(\d{2,4})\s*KCAL/);
  if (totalCalMatch) result.calories = num(totalCalMatch[1]);
  else if (activeCalMatch) result.calories = num(activeCalMatch[1]);
  else if (anyCalMatch) result.calories = num(anyCalMatch[1]);

  // 평균 심박수: 154BPM
  const hrMatch = upper.match(/(\d{2,3})\s*BPM/);
  if (hrMatch) result.avgHeartRate = num(hrMatch[1]);

  return result;
}
