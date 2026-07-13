import manifest from "../manifest";

// Next.js의 manifest.ts 파일 컨벤션은 app 루트에서만 동작하므로,
// 가계부 전용 manifest는 이 라우트 핸들러로 직접 서빙한다.
// (layout.tsx의 metadata.manifest가 이 경로를 링크함)
export function GET() {
  return Response.json(manifest(), {
    headers: { "content-type": "application/manifest+json" },
  });
}
