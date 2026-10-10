// 화면 보드 레지스트리. 영역별 fixtures 를 합친다. 명세: .omc/specs/screens-board.md 4.1
import type { ScreenDef } from "./types";
import { userScreens } from "./fixtures/user";
import { expertScreens } from "./fixtures/expert";
import { adminScreens } from "./fixtures/admin";

const SOURCES: { file: string; screens: ScreenDef[] }[] = [
  { file: "fixtures/user.ts", screens: userScreens },
  { file: "fixtures/expert.ts", screens: expertScreens },
  { file: "fixtures/admin.ts", screens: adminScreens },
];

// 같은 화면 코드나 경우 코드가 두 번 나오면 로드 시점에 바로 실패시킨다.
function assertUniqueCodes(): void {
  const screenCodes = new Map<string, string>();
  const caseCodes = new Map<string, string>();
  for (const { file, screens } of SOURCES) {
    for (const screen of screens) {
      const prevScreen = screenCodes.get(screen.code);
      if (prevScreen) {
        throw new Error(`화면 코드 중복: ${screen.code} (${prevScreen} 와 ${file})`);
      }
      screenCodes.set(screen.code, file);
      for (const c of screen.cases) {
        const prevCase = caseCodes.get(c.code);
        if (prevCase) {
          throw new Error(`경우 코드 중복: ${c.code} (${prevCase} 와 ${file}, 화면 ${screen.code})`);
        }
        caseCodes.set(c.code, file);
      }
    }
  }
}

assertUniqueCodes();

export const SCREENS: ScreenDef[] = SOURCES.flatMap((s) => s.screens);
