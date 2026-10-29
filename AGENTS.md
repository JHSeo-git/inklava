# 프로젝트 작업 규칙

- 작업 전 `README.md`를 읽고, 설계 선택을 바꿀 때에는 `docs/adr/`의 관련 결정을 확인·갱신한다.
- React·TypeScript·Vite와 Bun을 유지한다. 명령과 버전은 `package.json`을 기준으로 삼는다.
- 소스 파일명은 kebab-case로 짓는다. 앱 컴포넌트는 `src/components/` 바로 아래, shadcn 기본 컴포넌트는 `components/ui/`, 훅은 `hooks/`, 로직과 해당 단위 테스트는 `lib/`에 둔다. `features/` 계층은 만들지 않는다.
- UI는 기존 shadcn 컴포넌트와 테마를 사용하고, Pele의 기본 다이어그램 스타일을 유지한다. 편집·미리보기 화면은 상시 안내와 불필요한 강조 없이 간결하게 구성한다.
- 현재 요구에 필요한 만큼만 구현한다. 성급한 공통화보다 읽기 쉬운 반복을 택한다.
- 의존성 추가·갱신 시 공식 문서와 유지관리 상태를 확인하고 정확한 버전과 `bun.lock`을 함께 기록한다.
- 코드 변경 후 `bun run check`를 실행한다. 편집·렌더링·줌·다운로드 동작을 바꾸면 관련 Playwright 테스트도 실행한다. 실제 입력기·트랙패드 검증과 합성 이벤트 테스트를 구분해 보고한다.
- 사용자에게 보이는 동작이 바뀌면 `README.md`와 `CHANGELOG.md`를 갱신한다.
- 커밋은 Conventional Commits를 따른다. `ship`은 변경 이력 정리·관련 커밋·push·pull까지이며, 릴리스 발행과 Cloudflare 배포는 각각 명시적으로 요청받았을 때 수행한다.
