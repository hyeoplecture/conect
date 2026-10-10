import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { matchPath } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { buildPreviewScenario } from "../conect3/_lib/seed-scenario";
import { SCREENS } from "./registry";
import { SAMPLE } from "./samples";

const MAIN_PATH = fileURLToPath(new URL("../main.tsx", import.meta.url));

function joinPath(parent: string, child: string): string {
  const base = parent === "/" ? "" : parent;
  return `${base}/${child}`.replace(/\/{2,}/g, "/");
}

// main.tsx 의 <Route> 를 한 줄씩 훑어 절대 경로 목록을 만든다.
// 한 줄에 하나의 <Route ...> 가 있고, 자식을 가진 부모는 `>` 로 끝나며 `</Route>` 로 닫힌다는 형식을 전제한다.
// `index` 는 부모 경로 자체(부모와 같은 값이라 중복 제거), 상대 경로는 부모 경로를 붙인다. `*` 는 제외한다.
// 반환값에는 `*` 와 index 중복도 포함한다(`<Route` 출현 횟수와 대조하기 위함). `*` 는 "*" 로 남긴다.
function parseRouteEntries(source: string): string[] {
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
    paths.push(full ?? "");
    if (!selfClosing) stack.push(full ?? parent);
  }
  return paths;
}

export function parseRoutePaths(source: string): string[] {
  const entries = parseRouteEntries(source).filter((p) => p !== "" && p !== "*" && !p.endsWith("/*"));
  return [...new Set(entries)];
}

function countRouteTags(source: string): number {
  return (source.match(/<Route[\s>]/g) ?? []).length;
}

const mainSource = readFileSync(MAIN_PATH, "utf8");
const routePaths = parseRoutePaths(mainSource);
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

  it("(g) 모든 href 의 경로가 자기 화면 path 와 matchPath 로 맞는다", () => {
    const bad: string[] = [];
    for (const screen of SCREENS) {
      for (const c of screen.cases) {
        if (c.href === null) continue;
        const hrefPath = c.href.split("?")[0].split("#")[0];
        if (!matchPath({ path: screen.path, end: true }, hrefPath)) {
          bad.push(`${c.code}: ${c.href} (화면 ${screen.code} ${screen.path})`);
        }
      }
    }
    expect(bad, `화면 path 와 맞지 않는 href: ${bad.join(" | ")}`).toEqual([]);
  });

  it("(h) SAMPLE 고정 id 가 buildPreviewScenario 결과에 실제로 있다", () => {
    const d = buildPreviewScenario("admin@conect.kr");
    const missing: string[] = [];
    const need = (kind: string, key: string, value: string, pool: string[]) => {
      if (!pool.includes(value)) missing.push(`${kind} ${key}=${value}`);
    };
    const bookingIds = d.bookings.map((b) => b.id);
    const expertSlugs = d.experts.map((e) => e.slug);
    need("bookings", "bookingConfirmed", SAMPLE.bookingConfirmed, bookingIds);
    need("bookings", "bookingCompleted", SAMPLE.bookingCompleted, bookingIds);
    need("bookings", "bookingCanceled", SAMPLE.bookingCanceled, bookingIds);
    need("bookings", "bookingNoShow", SAMPLE.bookingNoShow, bookingIds);
    need("experts.slug", "expertSlug", SAMPLE.expertSlug, expertSlugs);
    need("experts.slug", "newcomerSlug", SAMPLE.newcomerSlug, expertSlugs);
    need("posts", "postId", SAMPLE.postId, d.posts.map((p) => p.id));
    need("reviews", "reviewId", SAMPLE.reviewId, d.reviews.map((r) => r.id));
    expect(missing, `시드에 없는 SAMPLE id: ${missing.join(", ")}`).toEqual([]);
  });

  it("(i) 파싱한 Route 수가 main.tsx 의 <Route 출현 횟수와 같다", () => {
    const parsed = parseRouteEntries(mainSource).length;
    const tags = countRouteTags(mainSource);
    expect(parsed, "여러 줄 Route 등으로 파서가 놓친 항목이 있음").toBe(tags);
  });
});
