"use client";

// 로그인. 이메일과 비밀번호로 실제로 가입하고 실제로 로그인한다.
// 비밀번호를 그대로 담는데, 껍데기라서 그렇다. 진짜 서비스에서는 절대 이렇게 하지 않는다.

import { ADMIN_EMAIL, experts, session, users, type Expert, type User } from "./data";
import { newId } from "./store";

export type SignResult = { ok: true; user: User } | { ok: false; message: string };

export function signUp(input: {
  email: string;
  password: string;
  name: string;
  phone: string;
}): SignResult {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) return { ok: false, message: "이메일 형식을 확인해 주세요" };
  if (input.password.length < 6) return { ok: false, message: "비밀번호는 6자 이상이어야 합니다" };
  if (!input.name.trim()) return { ok: false, message: "이름을 입력해 주세요" };

  const taken = users.list().some((u) => u.email === email && !u.deletedAt);
  if (taken) return { ok: false, message: "이미 가입된 이메일입니다" };

  const user: User = {
    id: newId("usr"),
    email,
    password: input.password,
    name: input.name.trim(),
    phone: input.phone.trim(),
    role: email === ADMIN_EMAIL ? "admin" : "user",
    expertId: null,
    marketing: false,
    createdAt: new Date().toISOString(),
    deletedAt: null,
  };
  users.insert(user);
  session.set(user.id);
  return { ok: true, user };
}

export function signIn(email: string, password: string): SignResult {
  const found = users
    .list()
    .find((u) => u.email === email.trim().toLowerCase() && !u.deletedAt);
  if (!found) return { ok: false, message: "가입되지 않은 이메일입니다" };
  if (found.password !== password) return { ok: false, message: "비밀번호가 맞지 않습니다" };
  session.set(found.id);
  return { ok: true, user: found };
}

export function signOut() {
  session.set(null);
}

/** 소프트 딜리트. 예약과 결제 기록은 남고 이름만 가려진다. */
export function withdraw(userId: string) {
  const u = users.find(userId);
  if (!u) return;
  const masked = u.name.length > 1 ? `${u.name[0]}${"O".repeat(u.name.length - 1)}` : u.name;
  users.update(userId, {
    name: masked,
    email: `deleted_${userId}@conect.kr`,
    phone: "",
    deletedAt: new Date().toISOString(),
  });
  session.set(null);
}

export type Session = {
  loaded: boolean;
  user: User | null;
  expert: Expert | null;
  isAdmin: boolean;
};

export function useSession(): Session {
  const { loaded, value: id } = session.use();
  const { rows: allUsers } = users.useList();
  const { rows: allExperts } = experts.useList();

  const user = id ? (allUsers.find((u) => u.id === id) ?? null) : null;
  const expert = user?.expertId
    ? (allExperts.find((e) => e.id === user.expertId) ?? null)
    : null;

  return { loaded, user, expert, isAdmin: user?.role === "admin" };
}
