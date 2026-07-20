import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// 네이버 금융 비공식 실시간 시세 프록시.
// 공개 엔드포인트라 별도 인증키는 필요 없고, User-Agent 헤더만 부여한다.
// 개별 종목 fetch 실패는 그 종목만 누락하고 전체는 성공으로 처리한다.

const MAX_CODES = 20;
const CODE_PATTERN = /^[0-9A-Z]{6}$/;

// 콤마·공백이 섞인 문자열("244,000")을 숫자로 변환한다.
function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const cleaned = value.replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

type StockQuote = {
  code: string;
  name: string;
  price: number;
  change: number;
  changeRate: number;
  marketState: string;
};

async function fetchQuote(code: string): Promise<StockQuote | null> {
  try {
    const res = await fetch(
      `https://polling.finance.naver.com/api/realtime/domestic/stock/${code}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      datas?: Array<{
        itemCode?: string;
        stockName?: string;
        closePrice?: string;
        compareToPreviousClosePrice?: string;
        compareToPreviousPrice?: { name?: string };
        fluctuationsRatio?: string;
        marketStatus?: string;
        tradeStopType?: { text?: string };
      }>;
    };
    const item = data.datas?.[0];
    if (!item) return null;

    const change = toNumber(item.compareToPreviousClosePrice);
    const isFalling = item.compareToPreviousPrice?.name === "FALLING";
    return {
      code: item.itemCode || code,
      name: item.stockName || "",
      price: toNumber(item.closePrice),
      change: isFalling ? -Math.abs(change) : change,
      changeRate: toNumber(item.fluctuationsRatio),
      marketState: item.marketStatus ?? item.tradeStopType?.text ?? "",
    };
  } catch (error) {
    console.error("시세 종목 조회 실패:", code, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const codesParam = request.nextUrl.searchParams.get("codes");

  if (!codesParam) {
    return NextResponse.json(
      { error: "codes 파라미터가 필요합니다" },
      { status: 400 },
    );
  }

  const codes = codesParam
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);

  if (codes.length === 0) {
    return NextResponse.json(
      { error: "codes 파라미터가 필요합니다" },
      { status: 400 },
    );
  }

  if (codes.length > MAX_CODES) {
    return NextResponse.json(
      { error: `종목 코드는 최대 ${MAX_CODES}개까지 조회할 수 있습니다` },
      { status: 400 },
    );
  }

  if (codes.some((code) => !CODE_PATTERN.test(code))) {
    return NextResponse.json(
      { error: "종목 코드 형식이 올바르지 않습니다" },
      { status: 400 },
    );
  }

  if (!checkRateLimit(`stock:${getClientIp(request)}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "요청이 많습니다. 잠시 후 다시 시도해 주세요" },
      { status: 429 },
    );
  }

  const results = await Promise.all(codes.map((code) => fetchQuote(code)));
  const quotes = results.filter((quote): quote is StockQuote => quote !== null);

  return NextResponse.json({ quotes });
}
