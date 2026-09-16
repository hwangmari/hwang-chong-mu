// 링크 공유 이미지(OG 이미지)에 쓸 한글 글꼴을 가져온다.
//
// 이미지를 그리는 도구(satori)에 들어 있는 기본 글꼴에는 한글이 없어서,
// 글꼴 파일을 직접 넣어 주지 않으면 한글이 네모(□□□)로 나온다.
//
// 글꼴 파일 전체는 몇 MB라 매번 받기엔 너무 크다. 그래서 구글 폰트의
// "이 글자들만 담아 주세요"(text=) 기능을 써서 그 이미지에 실제로 쓰이는
// 글자만 담긴 작은 파일(보통 100KB 아래)을 받아 온다.
//
// 주의: 최신 브라우저인 척(User-Agent)하면 구글이 woff2 형식으로 주는데
// satori는 그걸 못 읽는다. 그래서 일부러 아주 단순한 User-Agent를 보내
// truetype(.ttf) 형식을 받는다.

/** 이미지에 쓰는 굵기는 두 가지뿐이다. 보통(400)과 아주 굵게(800). */
export const OG_FONT_WEIGHTS = [400, 800] as const;

export const OG_FONT_FAMILY = "Noto Sans KR";

type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 800;
  style: "normal";
};

// 같은 글자 묶음을 또 받지 않도록 기억해 둔다. (한 번 받으면 계속 재사용)
const cache = new Map<string, Promise<ArrayBuffer>>();

const CSS_ENDPOINT = "https://fonts.googleapis.com/css2";

/** 글꼴 파일에 꼭 들어 있어야 하는 기본 글자들 (숫자·기호·영문) */
const ALWAYS =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ .,·/-~%()·:원일명주회↑↓✓✕→";

/** 문자열 여러 개에서 실제로 쓰인 글자만 중복 없이 모은다. */
export function collectGlyphs(...parts: (string | undefined | null)[]) {
  const set = new Set<string>();
  for (const part of [ALWAYS, ...parts]) {
    if (!part) continue;
    for (const ch of part) {
      // 이모지는 글꼴이 아니라 그림으로 따로 그려지므로 굳이 담지 않는다.
      if (ch.codePointAt(0)! > 0xffff) continue;
      set.add(ch);
    }
  }
  return [...set].join("");
}

async function fetchSubset(weight: number, text: string): Promise<ArrayBuffer> {
  const url = `${CSS_ENDPOINT}?family=Noto+Sans+KR:wght@${weight}&text=${encodeURIComponent(text)}&display=swap`;
  // 글꼴 CSS·파일은 바뀌지 않으니 캐시에 두어 공유 이미지를 매번 새로 받지 않게 (2026-09-16: 카카오 미리보기 지연 대응)
  const cssResponse = await fetch(url, {
    cache: "force-cache",
    // 단순한 User-Agent여야 truetype(.ttf)으로 내려온다. 최신 브라우저처럼 보이면 woff2가 와서 못 읽는다.
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!cssResponse.ok) {
    throw new Error(`글꼴 목록을 못 받았습니다 (${cssResponse.status})`);
  }
  const css = await cssResponse.text();
  const match = css.match(/src:\s*url\((https:\/\/[^)]+)\)\s*format\('truetype'\)/);
  if (!match) {
    throw new Error("글꼴 주소를 CSS에서 찾지 못했습니다");
  }
  const fontResponse = await fetch(match[1], { cache: "force-cache" });
  if (!fontResponse.ok) {
    throw new Error(`글꼴 파일을 못 받았습니다 (${fontResponse.status})`);
  }
  return fontResponse.arrayBuffer();
}

function load(weight: number, text: string) {
  const key = `${weight}:${text}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const pending = fetchSubset(weight, text).catch((error) => {
    // 실패한 시도는 기억하지 않는다 — 다음 요청에서 다시 받아 볼 수 있게.
    cache.delete(key);
    throw error;
  });
  cache.set(key, pending);
  return pending;
}

/**
 * 이미지에 실제로 쓰이는 글자만 담은 한글 글꼴을 굵기별로 가져온다.
 * 네트워크가 막혀 못 받아도 이미지 자체는 나와야 하므로, 실패하면 빈 배열을 준다.
 */
// 글꼴을 못 받아오면 undefined를 돌려준다. 빈 배열 []을 넘기면 next/og가 기본 글꼴로 안 바꾸고 "No fonts are loaded"로 터진다 (리뷰 2026-09-15)
export async function loadOgFonts(text: string): Promise<OgFont[] | undefined> {
  const glyphs = collectGlyphs(text);
  try {
    const buffers = await Promise.all(
      OG_FONT_WEIGHTS.map((weight) => load(weight, glyphs)),
    );
    return OG_FONT_WEIGHTS.map((weight, index) => ({
      name: OG_FONT_FAMILY,
      data: buffers[index],
      weight,
      style: "normal" as const,
    }));
  } catch {
    return undefined;
  }
}
