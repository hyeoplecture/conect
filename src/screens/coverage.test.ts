import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SCREENS } from "./registry";

const MAIN_PATH = fileURLToPath(new URL("../main.tsx", import.meta.url));

function joinPath(parent: string, child: string): string {
  const base = parent === "/" ? "" : parent;
  return `${base}/${child}`.replace(/\/{2,}/g, "/");
}

// main.tsx 의 <Route> 를 한 줄씩 훑어 절대 경로 목록을 만든다.
// 한 줄에 하나의 <Route ...> 가 있고, 자식을 가진 부모는 `>` 로 끝나며 `</Route>` 로 닫힌다는 형식을 전제한다.
// `index` 는 부모 경로 자체(부모와 같은 값이라 중복 제거), 상대 경로는 부모 경로를 붙인다. `*` 는 제외한다.
export function parseRoutePaths(source: string): string[] {
  const stack: string[] = [];
  const paths: string[] = [];
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("</Route>")) {
      stack.pop();
      continue;
    }
    if (!line.startsWith("<Route ") && !line.startsWith("<Route>")) continue;

    const parent = stack.length > 0 ? stack[stack.length - 1] : "";
    const pathAttr = /\spath="([^"]*)"/.exec(line)?.[1];
    const isIndex = /\sindex(\s|\/|>)/.test(line);
    let full: string | null = null;
    if (pathAttr !== undefined) {
      full = pathAttr.startsWith("/") ? pathAttr : joinPath(parent || "/", pathAttr);
    } else if (isIndex) {
      full = parent || "/";
    }

    const selfClosing = line.endsWith("/>");
    if (full !== null && full !== "*" && !full.endsWith("/*")) paths.push(full);
    if (!selfClosing) stack.push(full ?? parent);
  }
  return [...new Set(paths)];
}

const routePaths = parseRoutePaths(readFileSync(MAIN_PATH, "utf8"));
const registryPaths = new Set(SCREENS.map((s) => s.path));

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) dup.add(v);
    seen.add(v);
  }
  return [...dup];
}

describe("화면 레지스트리 coverage", () => {
  it("main.tsx 라우트를 한 개 이상 읽는다", () => {
    expect(routePaths.length).toBeGreaterThan(0);
  });

  it("(a) main.tsx 의 모든 Route path 가 레지스트리에 있다", () => {
    const missing = routePaths.filter((p) => !registryPaths.has(p));
    expect(missing, `레지스트리에 없는 라우트: ${missing.join(", ")}`).toEqual([]);
  });

  it("(b) 레지스트리에 있는데 main.tsx 에 없는 라우트가 없다", () => {
    const known = new Set(routePaths);
    const extra = [...registryPaths].filter((p) => !known.has(p));
    expect(extra, `main.tsx 에 없는 경로: ${extra.join(", ")}`).toEqual([]);
  });

  it("(c) 모든 화면에 case 가 1개 이상 있다", () => {
    const empty = SCREENS.filter((s) => s.cases.length === 0).map((s) => s.code);
    expect(empty, `case 가 없는 화면: ${empty.join(", ")}`).toEqual([]);
  });

  it("(d) 모든 case 는 href 또는 skip 이 있다", () => {
    const bad = SCREENS.flatMap((s) => s.cases)
      .filter((c) => !c.skip && (c.href === null || c.href === ""))
      .map((c) => c.code);
    expect(bad, `href 도 skip 도 없는 case: ${bad.join(", ")}`).toEqual([]);
  });

  it("(e) 화면 코드와 경우 코드에 중복이 없다", () => {
    const screenDup = duplicates(SCREENS.map((s) => s.code));
    const caseDup = duplicates(SCREENS.flatMap((s) => s.cases.map((c) => c.code)));
    expect(screenDup, `중복 화면 코드: ${screenDup.join(", ")}`).toEqual([]);
    expect(caseDup, `중복 경우 코드: ${caseDup.join(", ")}`).toEqual([]);
  });

  it("(f) 모든 href 가 '/' 로 시작한다", () => {
    const bad = SCREENS.flatMap((s) => s.cases)
      .filter((c) => c.href !== null && !c.href.startsWith("/"))
      .map((c) => `${c.code}: ${c.href}`);
    expect(bad, `'/' 로 시작하지 않는 href: ${bad.join(", ")}`).toEqual([]);
  });
});
