# 커넥트 화면 보드(screens) 명세

- 상태: **확정** (2026-10-10, 사용자 승인). 이 명세에 적힌 것만 개발함
- 담당: 개발 1팀. 기획 세션이 단방향으로 전달함. 질문이 있으면 명세에 없는 것만 기획 세션(projects-04)에 SendMessage
- 대상 저장소: `C:\Users\PC\Desktop\Projects\conect` (main 브랜치에서 직접 작업. 브랜치를 따지 않음)
- 근거 노트(읽기 전용): `C:\Users\PC\Desktop\Projects\conect-sd-design-system\_thinking\003-screens-계획\001-스딩-screens-조사와-커넥트-계획.md`
- 참고 구현(읽기 전용): `C:\Users\PC\Desktop\Projects\sding\src\lib\screens\*`, `...\sding\src\app\screens\*`

## 1. 목적

커넥트 모든 화면을 목업 없이 실제 코드 그대로 축소 iframe 으로 한 페이지(`#/screens`)에 깔아 훑어보는 내부 보기 전용 보드.

## 2. 확정된 결정

| 항목 | 결정 |
| --- | --- |
| 방식 | 라이브 iframe. 정적 캡처는 이번 범위 밖 |
| 목록 원본 | `src/screens/registry.ts` 한 곳(SSOT). md 생성기 없음 |
| 로그인 상태 | 주소 `?as=` + `preview=1` 로 **메모리 세션**만 덮음. `localStorage` 세션을 쓰지 않음 |
| 쓰기 | preview 모드에서는 `store.ts` 쓰기 전부 차단(읽기 전용) |
| 피드백/판단 버튼 | 만들지 않음 (스딩에서 만들었다 걷어낸 이력) |
| 동시 로드 | iframe 동시 3개 큐, 15초 타임아웃 |
| 운영 | 네이티브(Capacitor)·운영 빌드에서 `/screens` 라우트 제외 |
| 디자인 시스템 이식 | 이번 범위 밖. 현재 스타일 그대로 |

## 3. 현황 (확인한 사실)

- Vite + React + `HashRouter`. 라우트는 `src/main.tsx` 에 31개 직접 선언
- 별칭: `@/app/conect3` -> `src/conect3`, `@` -> `src` (`vite.config.ts`)
- 세션: `src/conect3/_lib/session.tsx` 가 `data.ts` 의 `session`(localStorage 계층)을 씀. 같은 출처 iframe 은 이 세션을 공유함
- 데이터: `src/conect3/_lib/store.ts`, `data.ts`, `seed.ts`, `seed-scenario.ts` (`seedOnce()` 가 첫 진입에서 씨앗을 채움)
- 테스트 러너 없음, `package.json` scripts: dev/build/preview/cap:sync 등

## 4. 설계

### 4.1 레지스트리

```ts
// src/screens/types.ts
export type Area = 'user' | 'expert' | 'admin';
export type Persona = 'guest' | 'user' | 'expert' | 'admin';
export type SkipKind = '조작' | '만들 화면' | '앱 밖' | '기다림';

export interface Case {
  code: string;          // 'USR-S06.2'
  label: string;         // '예약 상세 · 결제 완료'
  href: string | null;   // 해시 라우트 경로. 예: '/my/reservations/rsv-001'
  as?: Persona;          // 기본 guest
  note?: string;
  skip?: SkipKind;       // 있으면 칸 대신 글줄
}
export interface ScreenDef {
  code: string;          // 'USR-S06'
  path: string;          // 라우트 패턴. 예: '/my/reservations/:id'
  name: string;
  area: Area;
  cases: Case[];         // 비어 있으면 안 됨. 기본 칸 하나 이상 또는 skip
}
```

- ID: 영역 접두 `USR`/`EXP`/`ADM` + `-S` + 두 자리 번호, 경우는 `.n`. 번호 재사용 금지, 없앤 화면은 줄을 남기고 상태만 바꿈
- `registry.ts` 는 `fixtures/user.ts`, `fixtures/expert.ts`, `fixtures/admin.ts` 를 합침. 같은 코드가 두 파일에 있으면 throw

### 4.2 preview 모드 (메모리 세션 + 읽기 전용)

- 활성 조건: 해시 쿼리에 `preview=1` (예: `#/my?preview=1&as=user`)
- `as` 값: `guest | user | expert | admin`. 각각 시드의 고정 사용자로 매핑(아래 4.3)
- `session` 계층이 preview 모드에서는 `localStorage` 를 읽거나 쓰지 않고, 모듈 메모리 값 하나로만 동작
- `store.ts` 의 insert/update/remove 및 `session.set` 은 preview 에서 no-op (콘솔 경고 한 줄). 결제 확정·예약 생성이 돌면 안 됨
- 일반 진입(`preview` 없음)의 동작은 한 글자도 바뀌면 안 됨

### 4.3 시드 고정 id

- `seed-scenario.ts` 에 preview 용 고정 id 를 보장: 사용자 1명(`as=user`), 전문가 계정 1명(`as=expert`), 관리자(`as=admin`, 기존 `ADMIN_EMAIL`)
- 예약 상세·후기·커뮤니티 글 등 동적 주소에 쓸 고정 id 목록을 `src/screens/samples.ts` 에 export. 시드가 그 id 를 실제로 만들어야 함

### 4.4 보드 페이지

- 라우트 `/screens` (해시 라우터 안). `MobileFrame` 을 적용하지 않고 넓은 레이아웃
- 구조: 영역 탭(`?area=`) + 묶음 칩 > 화면 섹션(이름, 코드, 경로) > 경우 칸 그리드
- 칸 크기: 사용자·전문가 390x844 를 0.6배, 운영자 1280x800 을 0.375배
- iframe `src`: `${location.pathname}#${href}?preview=1&as=${as}` (같은 앱 번들 재사용)
- 칸에 persona 배지(손님/사용자/전문가/운영자), note 표시. 칸 클릭은 해당 화면을 일반 모드로 새 탭에서 열기
- `LazyFrame`(IntersectionObserver) + 전역 큐 동시 3개, 15초 타임아웃 후 점선 칸 "불러오지 못함"
- skip 은 칸 대신 글줄(종류 + why)

### 4.5 운영 제외

- `import.meta.env.DEV` 또는 빌드 플래그 `VITE_SCREENS=1` 일 때만 라우트 등록. 기본 빌드(`npm run build`, `cap:sync`)에는 포함되지 않음

### 4.6 coverage 테스트

- vitest 도입(`vitest` devDependency, `npm test`)
- 검사: (a) `main.tsx` 의 모든 `<Route path>` 가 레지스트리 `path` 에 있음(`*` 제외) (b) 레지스트리에 없는 라우트가 남지 않음 (c) 모든 화면에 case 1개 이상 (d) case 는 href 또는 skip (e) 코드 중복 없음 (f) href 가 `/` 로 시작

## 5. 개발 레인과 파일 소유 (에이전트 팀으로 병렬 진행)

개발 세션은 `/oh-my-claudecode:team` 스킬을 명시 호출해 팀 규율(스테이지 파이프라인, 상태, 핸드오프)을 활성화하고, 워커를 아래 레인대로 최대한 병렬로 띄움.

| 레인 | 범위 | 건드릴 것 | 건드리지 말 것 | 선행 |
| --- | --- | --- | --- | --- |
| L0 | 타입, preview 세션·읽기 전용, 시드 고정 id, samples, 라우트 등록, vitest 설치 | `src/screens/types.ts`, `src/screens/samples.ts`, `src/conect3/_lib/session.tsx`, `data.ts`, `store.ts`, `seed-scenario.ts`, `src/main.tsx`, `package.json`, lockfile | 화면 컴포넌트, fixtures | 없음 |
| L1 | 보드 UI, LazyFrame, 큐, 스타일 | `src/screens/Board.tsx`, `LazyFrame.tsx`, `load-queue.ts`, `screens.css` | registry, fixtures, L0 파일 | L0 |
| L2 | 사용자 영역 경우 목록 | `src/screens/fixtures/user.ts` | 다른 영역 파일 | L0 |
| L3 | 전문가 영역 경우 목록 | `src/screens/fixtures/expert.ts` | 다른 영역 파일 | L0 |
| L4 | 운영자 영역 경우 목록 | `src/screens/fixtures/admin.ts` | 다른 영역 파일 | L0 |
| L5 | coverage 테스트, `registry.ts` 합침 | `src/screens/registry.ts`, `src/screens/coverage.test.ts` | fixtures 값 | L0 |
| 검증 | 별도 레인 | 수정 금지 | - | L1~L5 |

- **L0 는 단독 워커**: `package.json`·lockfile 과 공유 등록 파일(`main.tsx`)은 리드가 직접 하거나 워커 한 명만
- L1~L5 는 L0 완료 후 병렬. 파일 소유가 겹치지 않음
- 검증은 작성 워커와 분리된 `verifier`/`code-reviewer` 레인. 작성자가 자기 결과를 승인하지 않음

## 6. 화면 인벤토리 (라우트 31개 + 보드 1)

| 영역 | 경로 |
| --- | --- |
| user | `/`, `/search`, `/experts`, `/experts/:slug`, `/experts/:slug/reviews`, `/community`, `/community/write`, `/community/:id`, `/login`, `/my`, `/my/settings`, `/my/licenses`, `/my/reservations/:id`, `/notifications`, `/checkout`, `/checkout/pay`, `/checkout/done` |
| expert | `/expert`, `/expert/apply`, `/expert/bookings`, `/expert/bookings/:id`, `/expert/profile`, `/expert/schedule`, `/expert/settlements` |
| admin | `/admin`, `/admin/bookings`, `/admin/experts`, `/admin/payments`, `/admin/reports`, `/admin/settlements`, `/admin/users` |

- 로그인 전/후, 빈 상태/데이터 있음, 권한 없음 등 **경우**는 각 레인이 화면을 열어 보고 정함. 칸이 안 채워지면 skip 사유를 적음
- 화면 코드 번호는 위 표 순서대로 부여(USR-S01 부터)

## 7. 완료 기준

1. `npm run build` 통과(타입 검사 포함), 기본 빌드에 `/screens` 가 포함되지 않음
2. `npm test` 통과(coverage 6개 검사)
3. 개발 서버에서 `#/screens` 가 열리고 세 영역 탭 모두 칸이 채워짐. 점선 칸은 skip 사유가 있는 것뿐
4. preview 모드에서 결제·예약·가입 조작이 데이터를 바꾸지 않음(실측으로 확인)
5. 일반 진입 동작 변화 없음(홈, 로그인, 예약 흐름 수동 확인)
6. 변경 파일에 `TODO` 같은 자리표시, `.skip`, 스텁 없음

## 8. 개발 규칙 (전역 지침 반영)

- 배포하지 않음. push 는 이 작업 단위가 끝난 뒤 한 번만
- 커밋은 경로를 명시해서 함(`git add <경로>`, `git commit -- <경로>`). **`git add -A`·`git add .` 금지**(워커가 올려 둔 미완성 변경이 딸려 들어감)
- 커밋 메시지는 "무엇" 대신 "왜 + 결정 경위". 본문에 외주 관계는 적지 않음. 한국어, em dash 금지
- 서브에이전트 스폰 프롬프트 첫 줄에 보고 계약: "최종 산출은 SendMessage 보고, 텍스트 응답은 전달되지 않음, 핵심 작업은 포그라운드 실행"
- `node` 전체 kill 금지(PID 기반만). 안 쓰는 Monitor 는 정리
- 한글이 든 파일은 저장 후 다시 읽어 인코딩 확인
- 이 명세에 없는 결정이 필요하면 임의로 정하지 말고 기획 세션에 묻고, 답 전까지 그 부분은 비워 두고 나머지를 진행
