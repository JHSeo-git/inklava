---
status: accepted
date: 2026-10-29
---

# ADR 002: shadcn/ui와 역할별 소스 배치

사용자가 앱 스타일과 기본 컴포넌트를 shadcn/ui로 전환하고 역할별 폴더를 요청했다. 수작업 CSS를 유지하는 대신 공식 Vite 기존 프로젝트 가이드에 따라 Tailwind CSS 4의 Vite 플러그인과 shadcn CLI로 UI를 구성한다. ADR 001의 일반 CSS 중심 스타일 선택과 평면 `src/` 배치를 이 결정으로 변경한다. 편집·렌더링·카메라 동작과 Pele의 기본 다이어그램 스타일은 유지한다. [공식 Vite 설치 가이드](https://ui.shadcn.com/docs/installation/vite)

2026-10-29 기준 CLI `shadcn` 4.23.0, Tailwind CSS와 `@tailwindcss/vite` 4.3.3, Base UI 1.9.0을 사용한다. 현재 CLI의 `--base base --preset nova`가 생성하는 `base-nova` 스타일과 neutral 색상, CSS 변수 테마를 채택한다. Button·Textarea·Label·Badge만 공식 registry에서 가져오며 앱 컴포넌트는 이를 조합한다. 컴포넌트 소스는 저장소에서 소유하고, 기존 CSS 컴포넌트 경로는 제거한다. [shadcn CLI](https://ui.shadcn.com/docs/cli), [Base UI Button](https://ui.shadcn.com/docs/components/base/button)

최신 registry는 클래스 병합에 shadcn 조직의 `cn` 0.5.0을 사용한다. 별도 clsx·tailwind-merge 경로를 추가하지 않는다. CLI가 추가한 Geist Variable 폰트는 패키지에서 자체 호스팅하며 앱 UI에만 적용한다. CLI/CSS 빌드 도구와 폰트를 포함한 직접 의존성은 정확한 버전과 `bun.lock`으로 고정했다. shadcn·Tailwind·Base UI의 최근 npm 배포와 공식 유지관리 주체를 확인했고, shadcn 공식 문서는 GitHub 관심도 약 12.7만을 표시한다. 이는 유지관리·채택의 참고 근거이며 이 앱의 실행 검증을 대신하지 않는다. [cn 저장소](https://github.com/shadcn-ui/cn), [shadcn 저장소](https://github.com/shadcn-ui/ui), [Tailwind 저장소](https://github.com/tailwindlabs/tailwindcss), [Base UI 저장소](https://github.com/mui/base-ui)

소스는 `app/`의 진입·라우팅, `features/workbench/`의 작업 화면과 렌더링·좌표 계산, `components/ui/`의 shadcn 컴포넌트, `lib/`의 클래스 유틸리티, `styles/`의 전역 테마로 나눈다. 작업 화면 내부는 파일 몇 개의 평면 구조를 유지하며 재수출용 index 파일이나 호환 경로를 만들지 않는다. `@/*`는 `./src/*`로 연결하고 TypeScript 7에 맞춰 `baseUrl` 없이 `paths`를 사용한다.

Tailwind preflight가 들어오므로 SVG의 최대 너비를 제한하지 않도록 명시하고 기본 글꼴·선·자연 크기를 브라우저에서 확인한다. Textarea의 기본 `field-sizing-content`는 편집기에서 `field-sizing-fixed`와 flex 크기로 덮어써 긴 입력도 패널 안에서 스크롤하도록 한다. Base UI Button을 링크로 렌더링하면 button 역할이 부여되므로, 없는 경로의 복귀 링크에는 `buttonVariants` 스타일을 직접 적용해 링크 의미를 유지한다. [Tailwind preflight](https://tailwindcss.com/docs/preflight)

헤더에는 영문 Inklava만 표시한다. 프로젝트 설명과 한국어 이름은 README에 남긴다. 기존 단위 테스트와 Chromium·Firefox·WebKit E2E로 입력·오류·저장·줌·이동 동작을 검증하며, SVG 자연 크기와 긴 입력의 패널 크기도 확인한다. 실제 트랙패드 조작감과 프로덕션 배포는 여전히 별도 검증 범위다.
