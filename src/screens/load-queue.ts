// iframe 동시 로드 제한. 화면 보드는 iframe 을 수십 개 두므로
// 한꺼번에 로드되면 탭 렌더러가 멈춘다. React 의존 없는 순수 TS 라 단위 테스트로 검증할 수 있다.

type Starter = () => void;

export interface FrameQueue {
  /** 차례를 신청한다. 슬롯이 비어 있으면 바로 onStart 를 부르고, 없으면 대기열에 둔다 */
  request(id: string, onStart: Starter): void;
  /** 로드 완료(또는 시간 초과)로 슬롯을 비우고 대기열의 다음 칸을 연다 */
  release(id: string): void;
  /** 아직 차례가 안 온 칸을 대기열에서 뺀다(화면 밖으로 멀어짐) */
  cancel(id: string): void;
  /** 테스트용 내부 상태 */
  _state(): { activeSize: number; queue: string[] };
}

/** limit 개까지만 동시에 로드시키는 대기열을 만든다 */
export function createFrameQueue(limit: number): FrameQueue {
  const active = new Set<string>();
  const queue: string[] = [];
  const waiters = new Map<string, Starter>();

  function pump() {
    while (active.size < limit && queue.length > 0) {
      const id = queue.shift()!;
      const onStart = waiters.get(id);
      waiters.delete(id);
      if (!onStart) continue; // 대기 중 cancel 된 칸
      active.add(id);
      onStart();
    }
  }

  return {
    request(id, onStart) {
      if (active.has(id) || waiters.has(id)) return; // 이미 신청된 칸
      if (active.size < limit) {
        active.add(id);
        onStart();
        return;
      }
      queue.push(id);
      waiters.set(id, onStart);
    },
    release(id) {
      if (active.delete(id)) pump();
    },
    cancel(id) {
      if (!waiters.has(id)) return;
      waiters.delete(id);
      const idx = queue.indexOf(id);
      if (idx >= 0) queue.splice(idx, 1);
    },
    _state() {
      return { activeSize: active.size, queue: [...queue] };
    },
  };
}

/** 화면 보드가 쓰는 전역 대기열. 동시 3개 */
export const frameQueue = createFrameQueue(3);
