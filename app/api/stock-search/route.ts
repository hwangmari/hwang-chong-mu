import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// 네이버 금융 종목 자동완성 프록시. 국내(KOR) 종목만 필터해 반환한다.

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 30;
const MAX_RESULTS = 10;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `검색어는 ${MIN_QUERY_LENGTH}자 이상이어야 합니다` },
      { status: 400 },
    );
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `검색어는 ${MAX_QUERY_LENGTH}자 이하여야 합니다` },
      { status: 400 },
    );
  }

  if (!checkRateLimit(`stocksearch:${getClientIp(request)}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "요청이 많습니다. 잠시 후 다시 시도해 주세요" },
      { status: 429 },
    );
  }

  const url = `https://ac.stock.naver.com/ac?q=${encodeURIComponent(query)}&target=stock`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("종목 검색 API 에러:", res.status);
      return NextResponse.json(
        { error: "종목 검색 요청 실패" },
        { status: res.status },
      );
    }

    const data = (await res.json()) as {
      items?: Array<{
        code?: string;
        name?: string;
        typeName?: string;
        nationCode?: string;
      }>;
    };

    const items = (data.items || [])
      .filter((item) => item.nationCode === "KOR" && item.code && item.name)
      .slice(0, MAX_RESULTS)
      .map((item) => ({
        code: item.code as string,
        name: item.name as string,
        market: item.typeName || "",
      }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("종목 검색 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
