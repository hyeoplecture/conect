## Handoff: team-plan -> team-exec

- **Decided**: L0 은 리드가 직접 끝내고 커밋함(preview.ts, store/data/seed-scenario, samples.ts, types.ts, vitest). 보드는 main.tsx 의 App 안에서 pathname === "/screens" 일 때만 렌더(DEV 또는 VITE_SCREENS=1). 묶음 칩은 path 첫 세그먼트로 만듦(ScreenDef 에 group 필드 없음). registry 는 `SCREENS: ScreenDef[]` 를 export, fixtures 는 `userScreens`/`expertScreens`/`adminScreens` 를 export
- **Rejected**: 미리보기 시드를 일반 씨앗에 섞기(일반 진입 동작이 바뀜), localStorage 를 읽되 쓰기만 막기(사용자 세션이 iframe 에 새어 들어옴), main.tsx 에 `<Route path="/screens">` 추가(61행 이후 31개 라우트 트리를 건드리지 않으려 함)
- **Risks**: 경우 칸이 채워지는지는 브라우저로만 확인됨(L2~L4 는 코드 읽기로 작성하고 리드가 보드에서 실측). /checkout/done 이 어떤 데이터를 요구하는지 미확인. Board.tsx 는 L1 이 교체할 자리표시 파일
- **Files**: src/screens/{types,samples}.ts, src/conect3/_lib/{preview,store,data,seed-scenario}.ts, src/main.tsx, src/vite-env.d.ts, vite.config.ts, package.json
- **Remaining**: L1 보드 UI, L2~L4 경우 목록, L5 registry + coverage 테스트, 검증 레인(실측: preview 쓰기 차단, 일반 진입 무변화)
