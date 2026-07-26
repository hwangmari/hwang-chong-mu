// 루트 manifest를 라우트 핸들러로 서빙한다.
// Next의 app/manifest.ts 파일 컨벤션은 모든 페이지 head에 이 링크를 전역 주입해서
// 하위 레이아웃(예: 가계부)의 metadata.manifest 오버라이드를 무력화한다.
// 라우트 핸들러 + 레이아웃별 metadata.manifest 방식으로 바꿔 구역별 manifest가 적용되게 한다.
export function GET() {
  return Response.json(
    {
      name: "황총무의 습관 방",
      short_name: "황총무",
      description: "매일매일 쌓이는 성실함의 농도",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#22c55e",
      icons: [
        {
          src: "/favicon.ico",
          sizes: "any",
          type: "image/x-icon",
        },
      ],
    },
    { headers: { "content-type": "application/manifest+json" } },
  );
}
