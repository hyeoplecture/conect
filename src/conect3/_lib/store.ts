"use client";

// 브라우저 저장소를 감싸는 한 겹. 화면 코드는 localStorage를 직접 건드리지 않는다.
// 나중에 Supabase로 갈아끼울 때 이 파일만 바꾸면 화면은 그대로 둔다.
//
// 읽기는 useSyncExternalStore로 한다. 서버에서 그린 화면과 브라우저 화면이 어긋나면
// React가 경고를 띄우고 화면이 한 번 깜빡인다. 서버 몫으로는 항상 빈 값을 준다.

import { useSyncExternalStore } from "react";

const PREFIX = "conect3.";

/* ---------- 아주 얇은 저장소 ---------- */

const cache = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();

function read<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T;
  let value = fallback;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      if (raw) value = JSON.parse(raw) as T;
    } catch {
      // 저장소를 못 읽는 브라우저에서는 빈 값으로 시작한다
    }
  }
  cache.set(key, value);
  return value;
}

function write<T>(key: string, value: T) {
  cache.set(key, value);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // 용량이 찼거나 막혀 있어도 화면은 계속 돌아가야 한다
    }
  }
  listeners.get(key)?.forEach((fn) => fn());
}

function subscribe(key: string, fn: () => void) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(fn);
  return () => {
    listeners.get(key)!.delete(fn);
  };
}

/** 저장된 값 전체를 지운다. 설정 화면의 초기화에서 쓴다. */
export function resetAll() {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k?.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach((k) => window.localStorage.removeItem(k));
  cache.clear();
  listeners.forEach((set) => set.forEach((fn) => fn()));
}

/* ---------- 표 하나 ---------- */

export type Row = { id: string };

// 서버에서 읽을 때 돌려줄 빈 배열. 매번 새로 만들면 무한 렌더에 빠진다.
const EMPTY: never[] = [];

export type Table<T extends Row> = {
  list(): T[];
  find(id: string): T | undefined;
  where(fn: (row: T) => boolean): T[];
  insert(row: T): T;
  insertMany(rows: T[]): T[];
  update(id: string, patch: Partial<T>): T | undefined;
  remove(id: string): void;
  replaceAll(rows: T[]): void;
  useList(): { loaded: boolean; rows: T[] };
  useOne(id: string): { loaded: boolean; row: T | undefined };
};

export function table<T extends Row>(name: string): Table<T> {
  const get = () => read<T[]>(name, EMPTY as unknown as T[]);

  const api: Table<T> = {
    list: get,
    find: (id) => get().find((r) => r.id === id),
    where: (fn) => get().filter(fn),

    insert(row) {
      write(name, [...get(), row]);
      return row;
    },
    insertMany(rows) {
      write(name, [...get(), ...rows]);
      return rows;
    },
    update(id, patch) {
      const rows = get();
      const i = rows.findIndex((r) => r.id === id);
      if (i < 0) return undefined;
      const next = { ...rows[i], ...patch };
      write(name, [...rows.slice(0, i), next, ...rows.slice(i + 1)]);
      return next;
    },
    remove(id) {
      write(name, get().filter((r) => r.id !== id));
    },
    replaceAll(rows) {
      write(name, rows);
    },

    useList() {
      const rows = useSyncExternalStore(
        (fn) => subscribe(name, fn),
        get,
        () => EMPTY as unknown as T[],
      );
      const loaded = useSyncExternalStore(
        (fn) => subscribe(name, fn),
        () => true,
        () => false,
      );
      return { loaded, rows };
    },

    useOne(id) {
      const { loaded, rows } = api.useList();
      return { loaded, row: rows.find((r) => r.id === id) };
    },
  };

  return api;
}

/* ---------- 값 하나 ---------- */

export type Cell<T> = {
  get(): T;
  set(value: T): void;
  use(): { loaded: boolean; value: T };
};

export function cell<T>(name: string, fallback: T): Cell<T> {
  return {
    get: () => read<T>(name, fallback),
    set: (value) => write(name, value),
    use() {
      const value = useSyncExternalStore(
        (fn) => subscribe(name, fn),
        () => read<T>(name, fallback),
        () => fallback,
      );
      const loaded = useSyncExternalStore(
        (fn) => subscribe(name, fn),
        () => true,
        () => false,
      );
      return { loaded, value };
    },
  };
}

/* ---------- id 만들기 ---------- */

let counter = 0;

export function newId(prefix: string) {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}

/** 화면에 보여주는 예약번호. C 다음에 날짜와 네 자리. */
export function newCode() {
  const d = new Date();
  const ymd = `${d.getFullYear()}`.slice(2) + `${d.getMonth() + 1}`.padStart(2, "0") + `${d.getDate()}`.padStart(2, "0");
  counter += 1;
  return `C${ymd}${(1000 + (counter % 9000)).toString()}`;
}
