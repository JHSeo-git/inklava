---
status: accepted
date: 2026-10-29
---

# ADR 003: CodeMirror 기반 Mermaid 소스 편집기

Pele Playground처럼 줄 번호와 기본 코드 편집 기능을 제공하기 위해 `SourceEditor`의 textarea를 **CodeMirror 6 + `@uiw/react-codemirror`**로 교체한다. React 래퍼가 편집기 생성·정리와 값 동기화를 맡고, 앱은 필요한 확장만 설정한다. Pele Playground도 CodeMirror를 사용한다. Monaco의 모델·로더·Worker 구성이나 textarea의 줄 번호·스크롤 동기화를 직접 관리하는 방식보다 현재 단일 문서 편집에 적합하다. 이 결정은 ADR 001·002의 입력 컴포넌트 선택을 변경하며, React·Pele·shadcn·Bun 구성은 유지한다. [조사 문서](../research/code-editor.md), [React 래퍼](https://github.com/uiwjs/react-codemirror), [Pele 편집기](https://github.com/obsidianmd/pele/blob/main/website/src/scripts/playground-editor.ts)

## 편집 경험

줄 번호, 실행 취소·다시 실행, 검색, 두 칸 들여쓰기, 패널 내부 가로·세로 스크롤을 제공한다. 후속 UI 요청에 따라 자동 줄바꿈을 끄고 긴 소스 줄은 가로 스크롤로 확인한다. Tab과 Shift+Tab은 들여쓰기·내어쓰기에 사용하고 Escape 후 Tab으로 편집기 밖으로 이동할 수 있게 한다. 검색과 포커스 이동 방법은 README에 기록하며, 앞서 제거한 상시 하단 안내 영역은 다시 만들지 않는다. 자동 괄호 삽입, 접기, 자동완성은 이번 범위에 포함하지 않는다. [CodeMirror Tab 접근성](https://codemirror.net/examples/tab/)

후속 UI 요청에 따라 최초 설정의 현재 줄·줄 번호 배경과 괄호 대응·선택 단어의 중복 강조를 끈다. Pele Playground를 참고해 소스·미리보기 포커스 외곽선과 줄 번호 옆 구분선도 제거한다. 텍스트를 직접 선택한 영역과 검색 결과, 기본 구문 색상은 유지한다. 버튼과 검색 입력창의 포커스 표시는 기존 shadcn·편집기 설정을 따른다. [Pele 편집기 스타일](https://github.com/obsidianmd/pele/blob/main/website/src/styles/playground.scss)

Mermaid 키워드·주석·문자열·연결 기호 등 기본 색상 표시는 `StreamLanguage` 기반의 작은 로컬 확장으로 추가한다. 현재 Mermaid 전용 커뮤니티 언어 패키지는 오래된 지원 범위 때문에 도입하지 않는다. 하이라이터는 읽기를 돕는 용도이며, 문법의 유효성은 기존 Pele 렌더링 결과로 판단한다. 모든 다이어그램의 정밀한 구문 분석이나 의미 기반 자동완성을 구현하지 않는다. Pele의 구현 방식만 참고하고 필요한 토큰 처리를 직접 작성한다. [Pele 하이라이터](https://github.com/obsidianmd/pele/blob/main/website/src/lib/editor-highlighting.ts)

## 구현 경계와 상태

패널 너비 조절은 공식 shadcn Resizable과 `react-resizable-panels` 4.15.1로 처리한다. 이 버전은 2026-10-28에 배포됐으며 React 19를 지원한다. 너비 768px 이상에서 가로 조절선을 제공하고, 소스 240px·미리보기 360px의 최소 너비를 둔다. 좁은 화면에서는 같은 편집기 인스턴스를 유지한 채 세로 배치로 전환하고 조절선을 숨긴다. 구분선의 확장된 클릭 영역은 미리보기보다 위에 두어 그림 이동과 크기 조절이 동시에 시작되지 않게 한다. 패널 비율을 별도 저장하는 계층은 추가하지 않는다. [shadcn Resizable](https://ui.shadcn.com/docs/components/base/resizable), [패키지](https://github.com/bvaughn/react-resizable-panels)

편집기 조합은 `src/components/source-editor.tsx`에 두고, Mermaid 색상 확장은 `src/lib/mermaid-language.ts`로 나눈다. 여러 편집기를 교체하는 공통 인터페이스나 서비스 계층을 만들지 않는다. 더 이상 사용하지 않는 shadcn Textarea 소스는 삭제한다. 바깥 패널·레이블·배지는 기존 shadcn 컴포넌트를 유지하고 편집기 배경·글자·경계·선택·검색 UI는 기존 CSS 변수와 맞춘다. 코드에는 고정폭 글꼴을 사용하며 Pele 다이어그램 스타일은 바꾸지 않는다.

입력은 즉시 React 상태에 반영하고, 기존 200ms 렌더링 지연과 초안 저장을 유지한다. 문서가 바뀔 때마다 편집기 인스턴스를 다시 생성하지 않으며, 확장·테마 설정을 안정적으로 유지해 커서·선택·스크롤·undo 기록을 보존한다. 한글 조합 시작에는 예약된 미리보기를 취소하고, 조합 중에는 렌더링을 보류하며, 조합 종료 후 최종 입력으로 다시 예약한다. CodeMirror의 DOM 이벤트와 문서 업데이트 순서를 확인해 최종 입력이 누락되지 않게 한다.

오류가 발생하면 현재처럼 메시지와 위치를 표시하고 마지막 성공 SVG를 유지한다. 빈 입력은 미리보기를 비우며, 입력 수정으로 카메라를 초기화하지 않는다. 오류 위치로 이동하거나 밑줄을 표시하는 기능은 후속 범위다. 이를 추가할 때는 현재 문자열 오류를 행·열과 해당 소스를 포함한 구조화된 값으로 변경한다. 편집 가능한 요소에는 접근성 이름·여러 줄 입력 의미·오류 상태를 연결하고, 오류와 저장 실패 메시지는 필요한 때만 표시한다.

## 의존성과 검증

조사 당시 `@uiw/react-codemirror`는 4.25.12, `@codemirror/view`는 6.43.15였다. 구현 시 공식 문서와 npm 메타데이터를 다시 확인하고, 실제로 직접 import하는 패키지를 정확한 버전과 `bun.lock`으로 고정한다. 전이 의존성에만 기대어 import하지 않는다. UIW는 커뮤니티 래퍼이며 선언된 React peer 범위에 현재 React 19가 포함된다. 최신 버전이라는 사실만으로 실제 호환성을 대신하지 않는다.

기존 textarea 대상 E2E를 새 입력 방식에 맞추고 Chromium·Firefox·WebKit에서 초안 복원, 오류 복구, 빈 입력, 카메라 보존, 한글 조합 이벤트를 검증한다. 줄 번호와 패널 내부 스크롤, 들여쓰기와 undo/redo, 검색과 Escape 후 Tab 포커스 이동을 추가로 확인한다. 직접 작성한 토큰 처리에는 주석·문자열·연결 기호가 서로 잘못 섞이지 않는 사례를 검증한다. 포맷·타입 기반 린트·타입 검사·단위 테스트·프로덕션 빌드를 실행하고 편집기 도입 전후 JS 크기를 기록한다. 합성 이벤트 검증과 실제 OS 한글 입력기 검증은 구분한다.
