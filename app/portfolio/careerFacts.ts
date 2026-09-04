// 포트폴리오 상단 "사실 띠"와 커리어 리본이 쓰는 숫자들.
// 문구를 새로 지어내지 않기 위해, 값은 전부 data/experiences.tsx에서 계산해 온다.
import { experiences } from "@/data/experiences";
import { TOY_PROJECTS } from "./project/toyProjects";

export interface CareerSpan {
  id: string;
  company: string;
  role: string;
  period: string;
  /** data/experiences.tsx의 tailwind 스타일 색 이름 (예: "bg-orange-500") */
  colorClass: string;
  summary: string[];
  /** 1970년 1월을 0으로 두고 센 개월 수 — 리본의 길이 계산용 */
  startMonth: number;
  endMonth: number;
  months: number;
  ongoing: boolean;
  projectCount: number;
  startYear: number;
  endYear: number;
  /** data의 period 괄호 안에 적힌 재직 기간. 없으면(재직 중) null */
  durationLabel: string | null;
}

const YEAR_MONTH = /(\d{4})\.(\d{1,2})/g;

function toMonthIndex(year: number, month: number) {
  return year * 12 + (month - 1);
}

function nowMonthIndex() {
  const now = new Date();
  return toMonthIndex(now.getFullYear(), now.getMonth() + 1);
}

/** "2020.07 - 2023.08 (3년 2개월)" / "2023.08 - 재직 중" 두 형태를 모두 읽는다. */
function parsePeriod(period: string) {
  const found = [...period.matchAll(YEAR_MONTH)].map((m) => ({
    year: Number(m[1]),
    month: Number(m[2]),
  }));
  const start = found[0];
  const end = found[1];
  const startMonth = start ? toMonthIndex(start.year, start.month) : nowMonthIndex();
  const endMonth = end ? toMonthIndex(end.year, end.month) : nowMonthIndex();
  return {
    startMonth,
    endMonth,
    ongoing: !end,
    startYear: start ? start.year : new Date().getFullYear(),
    endYear: end ? end.year : new Date().getFullYear(),
  };
}

/** 오래된 순(왼쪽) → 최근 순(오른쪽). 리본은 이 순서를 그대로 쓴다. */
export const careerSpans: CareerSpan[] = experiences
  .map((exp) => {
    const parsed = parsePeriod(exp.period);
    return {
      id: exp.id,
      company: exp.company,
      role: exp.role,
      period: exp.period,
      colorClass: exp.color,
      summary: exp.summary,
      projectCount: exp.projects.length,
      months: Math.max(1, parsed.endMonth - parsed.startMonth),
      durationLabel: exp.period.match(/\(([^)]+)\)/)?.[1] ?? null,
      ...parsed,
    };
  })
  .sort((a, b) => a.startMonth - b.startMonth);

const firstStart = careerSpans[0]?.startMonth ?? nowMonthIndex();

/** 첫 입사부터 오늘까지의 햇수 */
export const careerYears = Math.max(1, Math.floor((nowMonthIndex() - firstStart) / 12));
export const careerStartYear = careerSpans[0]?.startYear ?? new Date().getFullYear();
export const careerEndYear = new Date().getFullYear();
export const companyCount = careerSpans.length;
export const keyProjectCount = experiences.reduce((n, exp) => n + exp.projects.length, 0);
export const toyProjectCount = TOY_PROJECTS.length;

/** 리본 위 눈금이 될 연도들: 각 구간의 시작 연도 + 마지막 연도 */
export const boundaryYears = [
  ...careerSpans.map((span) => span.startYear),
  new Date().getFullYear(),
];

export const totalCareerMonths = careerSpans.reduce((n, span) => n + span.months, 0);

export const heroFacts = [
  { label: "경력", value: careerYears, unit: "년" },
  { label: "거쳐온 회사", value: companyCount, unit: "곳" },
  { label: "주요 프로젝트", value: keyProjectCount, unit: "개" },
  { label: "직접 만든 서비스", value: toyProjectCount, unit: "개" },
];
