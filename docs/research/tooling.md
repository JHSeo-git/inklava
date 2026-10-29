# React·Bun·Oxc 개발 도구 조사

확인일: 2026-10-29. 공식 문서와 npm 레지스트리의 `latest` 및 배포 시각을 확인하고, 아래 조합으로 설치·타입 검사·린트·빌드를 실행했다. 정확한 의존성은 `package.json`과 `bun.lock`에 기록한다.

## 권장 조합

React SPA에는 **Bun + Vite 8 + `@vitejs/plugin-react` 6 + Oxlint + Oxfmt**를 권장한다. Vite 8이 Rolldown과 Oxc를 기본으로 사용하고 React 플러그인도 Oxc로 Fast Refresh를 처리하므로, 별도의 Oxc 빌드 플러그인을 조립할 필요가 없다. `@vitejs/plugin-react-oxc`는 폐기된 경로이므로 채택하지 않는다. [Vite 8 발표](https://vite.dev/blog/announcing-vite8), [기존 React Oxc 플러그인 안내](https://v7.vite.dev/guide/rolldown)

Vite+도 검토했다. 빌드·테스트·린트·포맷·런타임 관리를 통합하고 Bun을 패키지 매니저로 지원한다. 다만 이 앱에는 모노레포나 작업 실행기 요구가 없으므로, 처음에는 독립 도구를 Bun 스크립트로 연결하는 편이 이해하고 수정하기 쉽다는 판단이다. 통합 제품의 존재를 몰라서 제외하는 것이 아니라, 현재 요구에 필요한 설정만 유지하기 위한 선택이다. [Vite+](https://viteplus.dev/), [패키지 매니저 지원](https://viteplus.dev/guide/package-management)

## 확인한 버전

다음은 조사 시점의 값이다. 구현 시 npm 메타데이터를 다시 확인하고 선택한 버전을 고정했다. Bun은 개발 환경에서 실제 사용한 1.4.0으로 고정하며, 최신 버전 1.4.4로 임의 변경하지 않는다.

| 패키지                 | `latest`            | 배포일(UTC) |
| ---------------------- | ------------------- | ----------- |
| `vite`                 | 8.3.5               | 2026-10-21  |
| `@vitejs/plugin-react` | 6.1.2               | 2026-10-05  |
| `typescript`           | 7.0.2               | 2026-07-08  |
| `tsrs` (검토 후 보류)  | 0.20.1-ts7.1.0-beta | 2026-10-28  |
| `oxlint`               | 1.90.0              | 2026-10-27  |
| `oxlint-tsgolint`      | 7.0.2005            | 2026-10-22  |
| `oxfmt`                | 0.75.0              | 2026-10-27  |
| `bun`                  | 1.4.4               | 2026-10-22  |
| `vite-plus`            | 1.4.0               | 2026-10-23  |

출처는 각 패키지의 npm 레지스트리 메타데이터다: [Vite](https://registry.npmjs.org/vite), [React 플러그인](https://registry.npmjs.org/@vitejs/plugin-react), [TypeScript](https://registry.npmjs.org/typescript), [tsrs](https://registry.npmjs.org/tsrs), [Oxlint](https://registry.npmjs.org/oxlint), [tsgolint](https://registry.npmjs.org/oxlint-tsgolint), [Oxfmt](https://registry.npmjs.org/oxfmt), [Bun](https://registry.npmjs.org/bun), [Vite+](https://registry.npmjs.org/vite-plus).

Vite·React 플러그인·Oxc 도구는 최근 배포가 확인됐다. 이는 유지보수 활동의 근거이며, 앱에서의 호환성 검증을 대신하지 않는다. 구현에서는 React 19.3.1, Pele 1.12.0, TanStack Router 1.170.46을 함께 설치하고 Pele 렌더링, 네이티브 타입 검사, 타입 기반 린트, 정적 빌드를 확인했다. Playwright 1.64.1과 Wrangler 4.155.0을 검증 도구로 사용한다.

## 각 도구가 맡을 일

| 역할                      | 선택                     | 경계                                                                   |
| ------------------------- | ------------------------ | ---------------------------------------------------------------------- |
| 의존성 설치·스크립트 실행 | Bun                      | `bun install --frozen-lockfile`로 CI 설치를 재현한다.                  |
| 개발 서버·번들            | Vite 8                   | 내부의 Rolldown/Oxc를 사용한다. 별도 `bun build` 경로는 만들지 않는다. |
| React Fast Refresh        | `@vitejs/plugin-react` 6 | 초기에는 React Compiler 설정 없이 시작한다.                            |
| 코드 오류·React 규칙 검사 | Oxlint                   | 내장 규칙을 사용하고, 필요한 규칙이 없을 때만 추가 도구를 검토한다.    |
| 타입을 이용하는 린트      | `oxlint-tsgolint`        | `--type-aware`로 활성화한다.                                           |
| TypeScript 타입 검사      | TypeScript 7의 `tsc`     | `--noEmit`을 사용한다. 번들 출력은 Vite가 담당한다.                    |
| 포맷                      | Oxfmt                    | 기본 스타일을 사용하고 생성물만 제외한다.                              |
| Mermaid 해석              | Pele                     | Oxc parser의 역할이 아니다.                                            |

Vite는 TypeScript 구문을 JavaScript로 변환하지만 타입을 검사하지 않는다. 따라서 `vite build` 성공만으로 타입이 맞다고 판단해서는 안 된다. [Vite TypeScript 지원](https://vite.dev/guide/features#typescript)

Oxc parser는 JavaScript/TypeScript/JSX/TSX용이다. AST 변환 도구를 개발하는 요구가 없는 Inklava에서는 `oxc-parser`를 직접 의존성에 넣지 않는다. Vite와 Oxlint 내부에서 이미 활용되는 것으로 충분하다. [Oxc Parser](https://oxc.rs/docs/guide/usage/parser)

## `tsrs` 검토 결과: Go 기반 TypeScript 7을 채택한다

검토한 `tsrs`는 Cloudflare와 VoidZero가 Oxc 프로젝트에서 개발하는 TypeScript의 Rust 포트다. 2026-10-20 공식 발표는 현재 배포를 실험 단계로 소개한다. README도 TypeScript 7.1에 대한 100% 호환 안정판을 향후 목표로 명시한다. 조사 시점 최신 버전은 `0.20.1-ts7.1.0-beta`이며, 배포가 활발하다는 사실과 안정판이라는 판단은 구분해야 한다. [Cloudflare 발표](https://blog.cloudflare.com/typescript-rust-port), [tsrs README](https://github.com/oxc-project/tsrs), [0.20.1 릴리스](https://github.com/oxc-project/tsrs/releases/tag/v0.20.1)

공식 호환성 문서는 많은 upstream 기준 테스트를 통과했다고 보고하지만, 공개 저장소 비교에서 진단 차이와 실행 실패가 남아 있다고 기록한다. 선택적으로 켜는 `--fast` 모드에서는 일부 프로그램의 진단과 종료 코드가 달라질 수 있고, Windows watch와 일부 언어 서버 기능도 미지원이다. 이 앱이 해당 기능을 모두 필요로 하지는 않지만, 아직 안정성이 충분하지 않으면 Go 포트를 쓰겠다는 사용자 조건에 따라 **초기 타입 검사에는 tsrs를 채택하지 않는다.** 성능 문제도 측정되지 않은 신규 앱이므로 실험용 검사 경로를 병행하지 않는다. [지원 범위와 현재 검증 결과](https://github.com/oxc-project/tsrs/blob/main/docs/COMPATIBILITY.md)

대신 **Microsoft의 Go 기반 TypeScript 7 안정판**을 채택한다. 사용자가 대안으로 지정한 `tsgo` 계열이 정식 출시된 경로이며, 2026-07-08부터 일반 `typescript` 패키지의 실행 명령은 `tsc`다. 따라서 `typescript` 7.0.2와 `tsc --noEmit`을 사용하고 과거 미리보기 패키지인 `@typescript/native-preview`는 추가하지 않는다. tsrs는 안정판 출시와 호환성 결과를 확인한 뒤, 실제 앱에서 진단 일치와 속도 개선이 입증될 때 다시 검토한다. [TypeScript 7 발표](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/), [이전 개발 저장소의 명령 안내](https://github.com/microsoft/typescript-go)

TypeScript 7.0에는 기존 JavaScript Compiler API가 없다. 이 API를 직접 호출하는 개발 도구가 필요해지면 해당 도구의 지원 여부를 확인해야 한다. 현재 계획처럼 CLI 타입 검사, Oxc 변환·린트 중심으로 시작하는 경우에는 네이티브 컴파일러를 선택할 이유가 충분하다. 이것은 설계 판단이며 실제 의존성 조합의 검증 결과는 아니다. [공식 API 제약 안내](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)

## Oxlint와 Oxfmt 설정 방향

Oxlint 설정은 루트 `.oxlintrc.json` 하나로 시작한다. 기본 correctness 규칙에 React·접근성 규칙을 추가하고 Hooks 규칙을 명시적으로 확인한다. `plugins`를 지정하면 기본 목록을 대체하므로 필요한 기본 플러그인까지 함께 적어야 한다. 모든 규칙을 한꺼번에 켜거나 ESLint를 병행하는 구성은 피한다. [내장 플러그인 설정](https://oxc.rs/docs/guide/usage/linter/plugins)

`oxlint-tsgolint`를 개발 의존성으로 설치하고 `oxlint --type-aware`를 사용하면 Promise 처리처럼 타입 정보가 필요한 규칙을 검사할 수 있다. 이 옵션만으로 일반 TypeScript 오류까지 검사하는 것은 아니다. `--type-check`를 추가하면 타입 검사도 통합할 수 있으며 공식 문서는 이를 별도 `tsc --noEmit`의 대체 경로로 안내한다. 초기에는 `lint`와 `typecheck`를 분리해 실패 원인을 쉽게 확인하고, 중복 검사 비용이 실제 문제가 될 때 통합한다. [타입 기반 린트와 타입 검사](https://oxc.rs/docs/guide/usage/linter/type-aware)

Oxfmt는 조사 시점에도 0.x이며 공식 발표는 beta 단계다. 신규 프로젝트에서 요청한 포매터로 채택하되 정확한 버전을 고정하고 업데이트 때 포맷 차이를 검토한다. TSX·JSON·CSS·Markdown 등 앱에 필요한 형식을 지원한다. 초기에는 Prettier를 함께 설치하지 않는다. [Oxfmt beta](https://oxc.rs/blog/2026-02-24-oxfmt-beta), [지원 형식](https://oxc.rs/docs/guide/usage/formatter)

설정은 `.oxfmtrc.json`에 스키마와 생성물 제외만 둔다. 들여쓰기·따옴표 등은 기본값을 사용하며 import sorting이나 Tailwind 정렬을 임의로 활성화하지 않는다. `dist`, 캐시, 테스트 보고서처럼 재생성되는 파일은 검사 대상에서 제외한다. 편집기는 공식 Oxc 확장을 사용해 저장 시 포맷과 CLI 결과가 일치하도록 맞춘다. [Oxfmt 설정](https://oxc.rs/docs/guide/usage/formatter/config), [Oxc 편집기 확장](https://github.com/oxc-project/oxc-vscode)

다음 스크립트를 `package.json`에 연결했다. 전체 명령과 실행 방법은 README에서 확인한다.

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "oxlint --type-aware",
    "lint:fix": "oxlint --type-aware --fix",
    "typecheck": "tsc --noEmit",
    "fmt": "oxfmt",
    "fmt:check": "oxfmt --check"
  }
}
```

CI에서는 설치 후 포맷 검사·린트·타입 검사·대상 테스트·빌드를 각각 실행한다. `tsconfig`는 초기 단일 앱을 기준으로 하며 `strict`, `noEmit`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`를 사용한다. 설정 파일을 별도 프로젝트로 분리한다면 `typecheck`가 두 프로젝트를 모두 검사하도록 그때 수정한다.

## Bun과 배포 런타임

Bun을 선택한다고 브라우저 코드나 Cloudflare Workers가 Bun에서 실행되는 것은 아니다. Bun은 설치와 스크립트 진입점으로 사용하고, 브라우저에는 Vite의 정적 산출물을 보낸다. Bun 공식 가이드도 Vite 사용 경로를 제공한다. [Bun과 Vite](https://bun.sh/guides/ecosystem/vite)

Workers는 자체 런타임이며 Node.js 호환 API도 별도 지원 범위와 설정이 있다. 따라서 향후 서버 코드를 추가하더라도 `Bun.*` API를 전제로 작성하지 않는다. 현재처럼 정적 SPA를 제공하는 단계에는 서버 런타임 코드를 만들 필요가 없다. [Cloudflare 런타임 호환성](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)

Vite 8과 Oxc 패키지 메타데이터의 Node 요구사항은 `^20.19.0 || >=22.12.0`이다. 이 저장소는 실제 검증한 Node 24.18.0과 Bun 1.4.0을 기준으로 한다. Node 타입도 24.x로 맞췄다. Bun을 설치·명령 진입점으로 사용하되 Node shebang을 사용하는 도구와 Wrangler의 실행에는 Node를 사용한다. `--bun`을 모든 도구에 강제하지 않는다.
