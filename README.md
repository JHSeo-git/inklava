# Inklava · 잉클라바

Mermaid 문법을 입력하면 [Pele](https://pele.run/)로 다이어그램을 표시하는 웹 앱입니다. React와 Vite로 만들었으며, 브라우저 안에서 편집·렌더링·초안 저장을 처리합니다.

이름은 Ink와 Lava를 합친 말로, 입력한 글이 다이어그램으로 흐르고 굳어지는 모습을 담았습니다.

## 실행

Bun **1.4.0**과 Node.js **24.18.0 이상**을 사용합니다. 기준 버전은 `.bun-version`, `.node-version`, `package.json`에 기록했습니다. 의존성은 정확한 버전과 `bun.lock`으로 고정합니다.

```sh
bun install --frozen-lockfile
bun run dev
```

터미널에 표시되는 로컬 주소를 열면 됩니다. 처음에는 짧은 예시가 표시됩니다. 소스 입력을 200ms 동안 멈추면 렌더링하며, 한글 조합 중에는 기다립니다. 문법 오류가 생기면 오류와 위치를 표시하고 마지막 성공 결과를 유지합니다. 입력을 모두 지우면 미리보기도 비워집니다.

초안은 현재 브라우저의 `localStorage`에 저장됩니다. 빈 초안도 그대로 복원하며, 저장소 사용이 차단되면 안내를 표시하고 편집을 계속 제공합니다. 서버 저장이나 계정 간 동기화는 지원하지 않습니다.

편집·미리보기 하단에는 상시 안내 영역을 두지 않습니다. 입력 오류나 초안 저장 실패가 있을 때만 편집 영역 아래에 메시지를 표시합니다.

## 소스 편집

CodeMirror 6 편집기는 줄 번호와 패널 내부 가로·세로 스크롤을 제공합니다. 긴 줄은 자동으로 줄바꿈하지 않고 가로 스크롤로 확인합니다. Pele Playground처럼 패널 포커스 테두리, 현재 줄·줄 번호 배경, 괄호 대응·선택 단어의 중복 강조, 줄 번호 옆 구분선은 표시하지 않습니다. 직접 선택한 텍스트와 검색 결과는 표시합니다. Mermaid 키워드·주석·큰따옴표 문자열·연결 기호에 기본 색상을 표시하며, 유효한 문법인지는 Pele 렌더링 결과로 판단합니다. 모든 Mermaid 구문을 분석하는 언어 서버는 아니며 자동완성·접기·자동 괄호 삽입·오류 위치 이동은 제공하지 않습니다.

`Mermaid 소스` 레이블을 누르면 문서와 선택 영역을 유지한 채 편집기로 포커스를 옮깁니다. 문법 오류나 저장 실패 안내가 바뀌어도 열린 검색창의 검색어와 포커스를 유지합니다.

너비 768px 이상에서는 소스와 미리보기 사이 구분선을 좌우로 드래그해 패널 크기를 조절합니다. 구분선에 포커스한 뒤 좌우 방향키로도 조절할 수 있으며, Home·End는 조절 한계로 이동하고 더블클릭은 초기 비율로 돌아갑니다. 소스는 최소 240px, 미리보기는 최소 360px을 확보합니다. 더 좁은 화면에서는 구분선을 숨기고 기존 위아래 배치를 사용합니다. 크기를 바꿔도 편집 기록과 미리보기 배율·중심 좌표는 유지하며, 패널 비율은 새로고침하면 초기화합니다.

| 입력                             | 동작                                |
| -------------------------------- | ----------------------------------- |
| Tab / Shift + Tab                | 두 칸 들여쓰기 / 내어쓰기           |
| Escape 다음 Tab                  | 편집기 밖으로 포커스 이동(2초 이내) |
| Ctrl/⌘ + Z / Ctrl/⌘ + Shift + Z  | 실행 취소 / 다시 실행               |
| Ctrl/⌘ + F                       | 소스 검색                           |
| 검색창에서 Enter / Shift + Enter | 다음 / 이전 검색 결과               |
| 검색창에서 Escape                | 검색 닫고 편집기로 복귀             |

## 미리보기 조작

| 입력                                     | 동작                                      |
| ---------------------------------------- | ----------------------------------------- |
| 스크롤·트랙패드 두 손가락 이동           | 가로·세로 이동                            |
| Shift + 세로 스크롤                      | 가로 이동                                 |
| Ctrl/⌘ + 스크롤·트랙패드 핀치            | 포인터를 기준으로 확대·축소               |
| 왼쪽·가운데 마우스 버튼 드래그           | 자유롭게 이동                             |
| `−`, `+`, `100%`, `화면에 맞춤`          | 화면 중심 확대·축소, 자연 크기, 전체 맞춤 |
| 미리보기 포커스 후 `+`, `−`, `0`, 방향키 | 확대·축소, 전체 맞춤, 이동                |

소스를 수정해도 현재 시점을 유지합니다. 창 크기가 바뀌면 배율과 화면 중심의 다이어그램 좌표를 유지합니다. 그림이 화면 밖으로 나갔을 때에는 `화면에 맞춤`으로 돌아올 수 있습니다. 입력창이나 도구 모음에서는 브라우저의 기본 스크롤·키보드 동작을 사용합니다.

미리보기 도구 모음의 다운로드 아이콘으로 전체 다이어그램을 `inklava-YYYYMMDD-HHmmss.png` 형식으로 저장합니다. 날짜와 시각은 버튼을 누른 시점의 기기 시간대를 사용합니다(예: `inklava-20261029-143052.png`). 현재 확대·이동 상태와 관계없이 흰 배경에 기본 2배 해상도로 내보내며, 큰 그림은 긴 변을 최대 4,096px로 줄여 비율을 유지합니다. 문법 오류로 마지막 성공 결과가 보이는 경우에는 그 결과를 저장합니다. 비어 있는 미리보기에서는 다운로드가 비활성화됩니다. 변환은 브라우저 안에서 처리하며 외부 서버에 업로드하지 않습니다.

## 개발과 검증

```sh
bun run check                 # 포맷, 타입 기반 린트, TypeScript 검사, 단위 테스트, 빌드
bunx playwright install chromium firefox webkit
bun run test:e2e              # Chromium·Firefox·WebKit, 개발 서버 자동 시작
bun run fmt                   # Oxfmt 기본 스타일 적용
bun run preview               # Vite 빌드 결과 확인
```

타입 검사는 Go 기반 TypeScript 7의 `tsc --noEmit`을 사용합니다. Vite 8과 React 플러그인 6의 Oxc 변환, Oxlint와 `oxlint-tsgolint`의 타입 기반 린트, Oxfmt를 연결했습니다. 실험 단계의 Rust 포트 `tsrs`는 도입하지 않았습니다. 선택 근거는 [개발 도구 조사](docs/research/tooling.md)에 있습니다.

앱 UI는 shadcn/ui의 Base UI 기반 Nova 스타일과 Tailwind CSS 4를 사용합니다. Button·Label·Badge·Resizable은 공식 CLI로 가져온 저장소 소스입니다. 소스 입력은 `@uiw/react-codemirror`로 조합하고 기존 CSS 변수에 맞춘 테마를 적용합니다. 패널 크기 조절은 `react-resizable-panels` 4.15.1을 사용합니다. 테마는 `src/styles/globals.css`, CLI 설정은 `components.json`에 있습니다. Geist Variable 폰트를 자체 호스팅하며 Pele 다이어그램은 기본 스타일과 글꼴을 유지합니다. 필요한 컴포넌트를 추가할 때에는 고정된 CLI로 `bunx shadcn add <component>`를 실행하고, 추가된 의존성 버전을 정확히 고정한 뒤 검증합니다. [공식 Vite 가이드](https://ui.shadcn.com/docs/installation/vite)

소스는 다음 역할로 나눕니다. 진입 파일은 `src/app/main.tsx`이며 `@/*` alias는 `src/*`를 가리킵니다.

```text
src/
  app/                  # 앱 진입과 라우터
  features/workbench/   # 편집 화면, Pele 렌더링, 화면 좌표와 단위 테스트
  components/ui/        # shadcn 기본 컴포넌트
  lib/                  # 클래스 병합 유틸리티
  styles/               # Tailwind·shadcn 전역 테마
```

좌표 계산·Mermaid 토큰 처리의 단위 테스트와 세 브라우저 엔진의 E2E로 오류 복구, 초안 복원·저장 실패, 한글 조합 이벤트, 들여쓰기·undo/redo·검색·Escape 후 Tab 이탈, 오류 변경 시 검색 유지·다음 결과 이동, 레이블 클릭 포커스·선택 보존, 줄 번호 정렬·긴 줄과 문서의 내부 스크롤, 포인터 중심 줌·이동, 편집 후 시점 보존, 숨겨진 패널의 첫 맞춤, 창 크기 변경, 모바일 배치를 확인합니다. 합성 조합 이벤트는 실제 OS 한글 입력기로 입력한 검증을 대신하지 않으며, macOS Safari와 트랙패드의 감도·관성 스크롤도 물리 장치 확인이 남아 있습니다.

## Cloudflare 정적 배포

```sh
bun run build
bun run preview:cloudflare    # Wrangler 로컬 서버: http://localhost:8787
```

`wrangler.jsonc`는 Workers Static Assets로 `dist/`를 제공합니다. Worker 서버 코드는 없습니다. 로컬에서 `/` 진입, 새로고침, `/missing`의 클라이언트 안내, 실제 JS·CSS 자산의 응답을 확인할 수 있습니다.

Cloudflare의 `single-page-application` 설정은 모든 미일치 경로에 `index.html`을 반환합니다. 로컬 Wrangler에서도 **존재하지 않는 `/assets/missing.js`가 HTML 200으로 응답**하는 것을 확인했습니다. 이는 현재 assets-only 배포 방식의 제약입니다. 없는 자산까지 404로 구분하려면 별도 Worker 경로 처리가 필요합니다. [공식 SPA 라우팅 설명](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)

실제 배포를 결정한 뒤 Cloudflare 계정 인증과 Worker 이름·도메인을 확인하고 `bun run deploy`를 실행합니다. 이 명령은 빌드 후 외부 배포를 수행합니다. 현재 저장소에서는 로컬 검증까지 마쳤으며 실제 Cloudflare 배포는 수행하지 않았습니다.

## 현재 범위

Pele의 기본 스타일과 내장 Mermaid 호환 범위를 사용합니다. Mermaid.js와 레이아웃이 동일하지 않으며 외부 플러그인은 지원하지 않습니다. 미리보기의 링크와 외부 이미지는 비활성화합니다. [Pele 호환성](https://pele.run/compatibility)

Pele 전체 내장 타입과 CodeMirror, 패널 조절 기능을 함께 로드하므로 초기 JS는 약 **1.50MB, gzip 518KB**이며 Vite의 큰 청크 경고가 발생합니다. 코드 분할과 Web Worker는 도입하지 않았습니다. 큰 입력에서는 main thread가 잠시 멈출 수 있으며 실제 장치에서 렌더링 지연을 측정한 뒤 후속 최적화 여부를 결정합니다. 공유, 협업, 터치스크린 멀티터치 조작은 현재 범위에 없습니다.

## 설계

- [ADR 001: React와 Pele 기반 다이어그램 작업 화면](docs/adr/001-react-pele-workbench.md): 최초 기술 선택, 편집·렌더링 흐름, 줌·이동 동작을 정리합니다.
- [ADR 002: shadcn/ui와 역할별 소스 배치](docs/adr/002-shadcn-ui-and-source-structure.md): 현재 UI 도구와 폴더 구성을 기록합니다.
- [ADR 003: CodeMirror 기반 Mermaid 소스 편집기](docs/adr/003-codemirror-source-editor.md): 편집 기능·하이라이트·입력 상태 보존과 검증 범위를 기록합니다.
- [코드 편집기 조사](docs/research/code-editor.md): CodeMirror·Monaco와 Mermaid 언어 지원의 도입 근거를 정리합니다.
- [개발 도구 조사](docs/research/tooling.md): Bun, Vite, Oxc, TypeScript 도구의 공식 지원 상태와 선택 근거를 정리합니다.

## 참고

- [Pele 공식 사이트 및 문서](https://pele.run/)
- [Pele 소스 코드](https://github.com/obsidianmd/pele)

## 라이선스

[MIT](LICENSE)
