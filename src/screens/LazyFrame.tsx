import { useEffect, useId, useRef, useState } from "react";
import { frameQueue } from "./load-queue";

const TIMEOUT_MS = 15000;

interface Props {
  src: string;
  /** 있으면 칸을 눌러 새 탭으로 여는 주소 */
  open: string | null;
  title: string;
  /** iframe 원 크기 */
  width: number;
  height: number;
  scale: number;
}

/**
 * 줄인 실제 화면. 화면 가까이 올 때만, 전역 대기열 차례가 왔을 때만 iframe 을 붙인다.
 * 15초 안에 load 가 없으면 슬롯을 반납하고 "불러오지 못함" 칸으로 바꾼다.
 */
export function LazyFrame({ src, open, title, width, height, scale }: Props) {
  const id = useId();
  const ref = useRef<HTMLDivElement & HTMLAnchorElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const startedRef = useRef(false);
  const releasedRef = useRef(false);

  function release() {
    if (releasedRef.current) return;
    releasedRef.current = true;
    frameQueue.release(id);
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let requested = false;

    const io = new IntersectionObserver(
      (entries) => {
        const near = entries.some((e) => e.isIntersecting);
        if (near && !requested && !startedRef.current) {
          requested = true;
          frameQueue.request(id, () => {
            startedRef.current = true;
            setStarted(true);
          });
        } else if (!near && requested && !startedRef.current) {
          frameQueue.cancel(id);
          requested = false;
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (requested && !startedRef.current) frameQueue.cancel(id);
      // 시작했는데 load 도 시간 초과도 못 보고 사라지면 슬롯을 비워야 다음 칸이 돈다
      if (startedRef.current && !releasedRef.current) {
        releasedRef.current = true;
        frameQueue.release(id);
      }
    };
  }, [id]);

  useEffect(() => {
    if (!started || releasedRef.current) return;
    const t = setTimeout(() => {
      if (releasedRef.current) return;
      release();
      setFailed(true);
    }, TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [started]);

  const box = { width: Math.round(width * scale), height: Math.round(height * scale) };
  const body = failed ? (
    <span className="screens-fail">불러오지 못함</span>
  ) : (
    started && (
      <iframe
        className="screens-frame"
        src={src}
        title={title}
        tabIndex={-1}
        style={{ width, height, transform: `scale(${scale})` }}
        onLoad={release}
      />
    )
  );
  const cls = failed ? "screens-box screens-box-fail" : "screens-box";

  if (!open) {
    return (
      <div ref={ref} className={cls} style={box} aria-label={title}>
        {body}
      </div>
    );
  }
  return (
    <a ref={ref} className={cls} style={box} href={open} target="_blank" rel="noopener" aria-label={title}>
      {body}
    </a>
  );
}
