# Mermaid 코드 편집기 조사

확인일: 2026-10-29. Pele Playground의 공개 소스, 각 편집기의 공식 문서·저장소, npm 레지스트리를 확인했다. 이 문서는 도입 제안이며, 앱 코드·의존성·기존 ADR의 결정 상태는 변경하지 않았다.

## 추천

현재 Inklava에는 **CodeMirror 6 + `@uiw/react-codemirror`**를 추천한다. React용 컴포넌트가 이미 있으며 줄 번호, 현재 줄 강조, 실행 취소·다시 실행, 검색, 괄호 대응 표시를 제공한다. 기존 `SourceEditor`의 textarea를 이 컴포넌트로 교체하고 바깥 패널·버튼·색상은 shadcn 체계를 유지하면 된다. `@uiw/react-codemirror`는 CodeMirror 프로젝트의 공식 React 패키지가 아니라 uiw가 관리하는 커뮤니티 래퍼다. [React 래퍼](https://github.com/uiwjs/react-codemirror), [기본 확장 설정](https://github.com/uiwjs/react-codemirror/blob/master/extensions/basic-setup/README.md)

Pele Playground도 CodeMirror 6를 사용하므로 원하는 사용감과 같은 기반이다. Monaco의 모델·로더·Worker 구성을 도입할 필요가 없고, textarea에 줄 번호와 스크롤 동기화를 직접 붙일 필요도 줄어든다. 이는 현재처럼 Mermaid 문서 하나를 편집하는 앱의 요구를 기준으로 한 판단이다.

## Pele Playground는 어떻게 구현했는가

Pele 웹사이트는 Astro 안에서 CodeMirror를 직접 생성한다. 공개 편집기 코드는 `EditorView`, `EditorState`, `lineNumbers`, `drawSelection`, `history`, 기본 키맵과 `indentWithTab`을 조합한다. 줄바꿈 설정을 바꾸는 `Compartment`, 탭 너비 2, 오류의 행·열 위치로 선택 영역을 옮기는 `selectDiagnostic`도 있다. 완성된 React 편집기를 Pele에서 배포하는 구조는 아니다. [편집기 구현](https://github.com/obsidianmd/pele/blob/main/website/src/scripts/playground-editor.ts), [웹사이트 의존성](https://github.com/obsidianmd/pele/blob/main/website/package.json)

문법 색상은 자체 `highlightLine` 토크나이저를 `StreamLanguage.define`과 `HighlightStyle`에 연결한다. 자동완성은 별도 코드에서 `@codemirror/autocomplete`와 자체 `mermaidCompletions`, Pele의 `detectType`을 조합한다. 따라서 CodeMirror 설치만으로 Playground의 Mermaid 색상·추천 기능 전체가 생기지는 않는다. 편집기, 하이라이터, 자동완성, 실제 렌더링을 구분해야 한다. [하이라이터](https://github.com/obsidianmd/pele/blob/main/website/src/lib/editor-highlighting.ts), [자동완성](https://github.com/obsidianmd/pele/blob/main/website/src/scripts/playground-autocomplete.ts)

## 후보 비교

| 후보                                    | React 연결                                           | 현재 요구에 대한 판단                                                                                                            |
| --------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| CodeMirror 6 + `@uiw/react-codemirror`  | 커뮤니티 React 컴포넌트를 제공한다.                  | 추천한다. 기본 편집 기능과 확장 설정을 제공하며, Pele와 같은 기반이다. Mermaid 관련 기능은 별도로 연결한다.                      |
| CodeMirror 6 직접 연결                  | `EditorView`의 생성·갱신·정리를 React에서 관리한다.  | 가능하지만 값 동기화, 수명 관리, 개발 모드 재마운트를 직접 처리하게 된다. 래퍼가 요구를 충족하는 지금은 직접 연결할 이유가 작다. |
| Monaco + `@monaco-editor/react`         | Microsoft의 편집기에 커뮤니티 React 래퍼를 연결한다. | 다중 파일·모델·diff·언어 서비스가 필요할 때 유리하다. 현재 요구에서는 설정 범위가 커진다.                                        |
| `react-simple-code-editor` + 하이라이터 | React 컴포넌트다.                                    | 짧은 코드 입력에는 적합하지만, 줄 번호·검색·접기까지 확장하려면 직접 보완할 부분이 많다.                                         |
| shadcn Code Block                       | React 표시 컴포넌트다.                               | 코드 표시·줄 번호·복사·diff용이다. 편집 가능한 입력기를 대체하지 않는다.                                                         |

Monaco 래퍼는 React 19를 지원하고 Vite 통합 예제를 제공한다. npm 패키지로 자체 번들링할 때는 `loader.config({ monaco })`와 필요한 Worker의 연결을 다룬다. 여기에 Mermaid용 색상·완성·진단 기능은 별도 요구로 남는다. IDE 기능이 필요하다는 이유 없이 도입하기에는 현재 CodeMirror보다 관리할 설정이 많다는 판단이다. [Monaco React 문서](https://github.com/suren-atoyan/monaco-react#loaderconfig)

`react-simple-code-editor`는 textarea와 하이라이트된 pre를 겹쳐 놓는다. 외부 하이라이터, 들여쓰기, 자체 undo 기능을 제공하지만 글꼴·행 높이가 어긋나면 정렬이 깨질 수 있고 큰 문서 성능 제약도 README에 명시돼 있다. [공식 README](https://github.com/react-simple-code-editor/react-simple-code-editor)

shadcn Code Block의 줄 번호와 코드 색상은 읽기 경험을 위한 기능이다. 입력 편집기는 CodeMirror로 맡기고 shadcn의 CSS 변수로 배경·글자·경계·선택 영역을 맞추는 편이 자연스럽다. [shadcn Code Block](https://ui.shadcn.com/docs/components/base/code-block)

정확한 번들 크기는 이 저장소의 실제 빌드로 측정하지 않았다. 패키지 다운로드 크기나 README의 수치를 앱의 최종 전송 크기로 바꾸어 제시하지 않는다.

## 버전과 유지보수 확인

아래는 npm `latest`와 해당 버전의 배포일이다. 설치한 버전 목록이 아니므로 실제 도입 시 다시 확인하고 lockfile에 고정해야 한다.

| 패키지                     | 최신 버전 | 배포일(UTC) |
| -------------------------- | --------- | ----------- |
| `codemirror`               | 6.0.2     | 2025-06-19  |
| `@codemirror/view`         | 6.43.15   | 2026-10-19  |
| `@uiw/react-codemirror`    | 4.25.12   | 2026-09-24  |
| `monaco-editor`            | 0.57.0    | 2026-09-24  |
| `@monaco-editor/react`     | 4.7.0     | 2025-02-13  |
| `react-simple-code-editor` | 0.14.1    | 2024-07-04  |
| `codemirror-lang-mermaid`  | 0.5.0     | 2023-09-14  |

출처: [codemirror](https://registry.npmjs.org/codemirror), [CodeMirror view](https://registry.npmjs.org/@codemirror/view), [uiw React 래퍼](https://registry.npmjs.org/@uiw/react-codemirror), [Monaco](https://registry.npmjs.org/monaco-editor), [Monaco React 래퍼](https://registry.npmjs.org/@monaco-editor/react), [simple editor](https://registry.npmjs.org/react-simple-code-editor), [Mermaid 언어 패키지](https://registry.npmjs.org/codemirror-lang-mermaid).

CodeMirror는 패키지별로 배포하므로 기본 설정을 묶는 `codemirror`의 날짜만으로 전체 프로젝트가 오래됐다고 판단하면 안 된다. `@codemirror/view`는 이번 달에 배포됐다. uiw 래퍼도 2026-09-24 배포와 같은 날의 mainline 커밋을 확인했다. 저장소에 표시된 사용 규모는 uiw 래퍼 약 2.3천 stars, Monaco 래퍼 약 4.8천 stars이며, 인지도와 유지보수 확인의 보조 근거일 뿐 호환성 보장은 아니다. [uiw 저장소](https://github.com/uiwjs/react-codemirror), [uiw 커밋](https://github.com/uiwjs/react-codemirror/commits/master), [Monaco 래퍼 저장소](https://github.com/suren-atoyan/monaco-react)

uiw 래퍼의 React peer 범위는 `>=17.0.0`, Monaco 래퍼는 React 19를 포함한다. 현재 프로젝트의 React 19가 선언 범위에는 들어가지만 실제 도입 시 TypeScript 검사와 브라우저 입력 검증이 필요하다. 위 레지스트리 메타데이터에서 확인한 내용이다.

## Mermaid 하이라이트와 검증의 경계

`@codemirror/lang-mermaid`와 `@mermaid-js/codemirror-mermaid`는 조사 시점 npm 레지스트리에서 404였다. 이 이름을 설치 대상으로 제안하면 안 된다. 실제 존재하는 커뮤니티 패키지는 `codemirror-lang-mermaid`다. [첫 번째 패키지 조회](https://registry.npmjs.org/@codemirror/lang-mermaid), [두 번째 패키지 조회](https://registry.npmjs.org/@mermaid-js/codemirror-mermaid), [실제 패키지 저장소](https://github.com/inspirnathan/codemirror-lang-mermaid)

다만 `codemirror-lang-mermaid`의 최근 배포와 main 브랜치 마지막 커밋은 모두 2023-09-14다. README는 mindmap, pie, flowchart, sequence, journey, requirement, gantt 일곱 종류의 지원을 명시한다. 들여쓰기 기반 접기 확장은 있지만, 현재 Pele가 처리하는 모든 구문에 대한 완전한 지원·자동완성·의미 검증을 보장하지 않는다. **초기 기본 의존성으로는 추천하지 않는다.** [지원 범위와 접기 설명](https://github.com/inspirnathan/codemirror-lang-mermaid#supported-diagrams), [커밋 기록](https://github.com/inspirnathan/codemirror-lang-mermaid/commits/main)

권장 방향은 기본 편집 기능을 CodeMirror에 맡기고 Mermaid 문법 검증과 SVG 렌더링은 기존 Pele에 유지하는 것이다. 색상은 Pele Playground의 `StreamLanguage` 방식처럼 작은 로컬 확장으로 필요한 토큰부터 지원할 수 있다. 자동완성은 별도 단계로 두고 실제 필요한 키워드·예제 제안부터 추가한다. Playground 소스를 가져올 경우에는 라이선스와 출처 표시 요건을 확인하고, 사용하는 부분의 유지보수 책임을 문서에 남겨야 한다.

## 도입 범위 제안

첫 구현에서는 줄 번호, 현재 줄·줄 번호 강조, undo/redo, 괄호 대응 표시, 검색 단축키, 두 칸 들여쓰기, 패널 내부 스크롤을 제공하는 구성이 적절하다. CodeMirror의 `basicSetup` 옵션으로 대부분 제어할 수 있다. 접기는 구조를 판단할 언어 지원이 있어야 의미가 있으므로 기본 단계에서 약속하지 않는다. 자동 괄호 닫기는 Mermaid 노드 표기와 한국어 입력에서 실제로 편한지 확인한 뒤 켜는 편이 좋다. [기본 설정 옵션](https://github.com/uiwjs/react-codemirror/blob/master/extensions/basic-setup/README.md)

구현 경계는 입력 컴포넌트 하나로 충분하다. 먼저 해당 컴포넌트의 입력 부분을 교체하고, 하이라이터가 실제로 필요해질 때 분리한다. 여러 편집기를 바꿔 끼우는 인터페이스나 범용 editor service를 먼저 만들 필요는 없다. 후속 폴더 정리에서는 [ADR 002](../adr/002-shadcn-ui-and-source-structure.md)에 따라 편집기 조합을 `src/components/source-editor.tsx`, 하이라이터를 `src/lib/mermaid-language.ts`에 두었다. `components/ui/`에는 shadcn 기본 컴포넌트만 둔다.

입력값은 즉시 React 상태에 반영하고 기존 200ms 지연은 미리보기 렌더링에만 유지한다. 편집기 인스턴스를 매 입력마다 새로 만들면 커서·선택·undo 기록이 사라질 수 있으므로 설정 객체와 확장을 안정적으로 유지한다. localStorage 초안, 마지막 성공 SVG 유지, 미리보기 확대·이동은 현재 흐름을 이어간다. 이는 현재 소스의 동작을 보존하기 위한 구현 기준이다.

한국어 IME 조합 처리는 기존 textarea 이벤트를 그대로 복사해서 끝낼 문제가 아니다. CodeMirror는 `EditorView.composing`과 `compositionStarted`를 제공하며 둘의 의미도 다르다. 전자는 현재 조합에서 문서 변경이 한 번 이상 일어난 상태까지 뜻한다. 실제 조합 시작·끝과 최종 문서 업데이트 순서를 확인하고, 조합 중 렌더링 보류와 조합 완료 후 반영을 함께 검증해야 한다. [CodeMirror IME 상태 API](https://codemirror.net/docs/ref/#view.EditorView.composing)

접근성에서는 CodeMirror core와 uiw 래퍼의 기본값 차이를 주의해야 한다. core는 Tab으로 편집기에서 빠져나가도록 기본 동작을 두지만 uiw 래퍼의 `indentWithTab` 기본값은 `true`다. 도입 시 값을 명시하고, Tab 들여쓰기를 선택하면 Escape 후 Tab으로 포커스를 이동할 수 있다는 안내를 문서나 필요한 시점의 도움말에 제공한다. 삭제했던 상시 하단 안내 영역을 되살릴 필요는 없다. 실제 편집 가능한 요소에 접근성 이름과 오류 연결도 전달해야 한다. [CodeMirror Tab 안내](https://codemirror.net/examples/tab/), [uiw 기본값 소스](https://github.com/uiwjs/react-codemirror/blob/master/core/src/useCodeMirror.ts)

오류 위치 강조는 후속으로 추가할 수 있다. 현재 `renderError`는 Pele 오류의 행·열을 문자열로 합쳐 `SourceEditor.error`에 전달하므로, 위치 이동이나 밑줄을 추가할 때는 행·열을 구조화된 값으로 유지해야 한다. 이를 CodeMirror 문서 위치에 대응시키되, 해당 오류가 현재 입력값에서 나온 결과인지 확인해야 한다. 입력이 바뀐 뒤 이전 오류 위치가 남거나 문서 범위를 벗어나지 않도록 한다. 색상·추천 결과를 실제 Mermaid 유효성 판정으로 사용하지 않는다.

도입 검증은 textarea 대상 테스트를 새 편집기 입력 방식에 맞추고, 한국어 조합 완료, undo/redo 후 미리보기 반영, 줄 번호와 스크롤 정렬, 검색과 Tab 포커스 이동, 오류 복구 후 SVG 유지에 집중하면 된다. 최종 번들 증가는 구현 전후 Vite 산출물로 비교한다. 이 조사에서는 설치·브라우저 호환성·번들 측정을 수행하지 않았다.
