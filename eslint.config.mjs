import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // UI 컴포넌트에서 supabase 직접 호출 금지 — 데이터 접근은 services/ 또는 각 서비스의 repository로
    files: ["app/**/components/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["**/lib/supabase"],
              message: "컴포넌트에서 supabase를 직접 호출하지 마세요. services/ 또는 repository 모듈을 경유하세요.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
