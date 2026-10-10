// 화면 보드(#/screens)가 iframe 으로 여는 미리보기 모드.
// 주소 해시에 preview=1 이 있으면 켜지고, 문서가 열려 있는 동안 고정된다.
// 켜지면 저장소는 localStorage 를 읽지도 쓰지도 않고, 쓰기는 전부 막는다(store.ts).
// 일반 진입(preview 없음)에서는 이 파일이 아무 일도 하지 않는다.

export type PreviewPersona = "guest" | "user" | "expert" | "admin";

const PERSONAS: readonly PreviewPersona[] = ["guest", "user", "expert", "admin"];

function detect(): { on: boolean; as: PreviewPersona } {
  if (typeof window === "undefined") return { on: false, as: "guest" };
  const hash = window.location.hash;
  const q = hash.indexOf("?");
  if (q < 0) return { on: false, as: "guest" };
  const params = new URLSearchParams(hash.slice(q + 1));
  if (params.get("preview") !== "1") return { on: false, as: "guest" };
  const as = params.get("as");
  const persona = PERSONAS.find((p) => p === as) ?? "guest";
  return { on: true, as: persona };
}

// 해시 안의 화면 이동은 쿼리를 잃으므로 모듈이 처음 불릴 때 한 번만 읽는다.
const detected = detect();

export const isPreview: boolean = detected.on;
export const previewPersona: PreviewPersona = detected.as;

const warned = new Set<string>();

/** 막은 쓰기를 콘솔에 한 줄로 남긴다. 같은 대상은 한 번만. */
export function warnReadOnly(target: string) {
  if (warned.has(target)) return;
  warned.add(target);
  console.warn(`[screens preview] 읽기 전용이라 쓰기를 막았습니다: ${target}`);
}
