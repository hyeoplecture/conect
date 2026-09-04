"use client";

// 화면 28개가 공유하는 어휘. 규격은 docs/conect3/SPEC.md.
// 여기 없는 모양이 필요하면 문서를 먼저 고치고 여기에 추가한다.

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import Link from "next/link";
import { IconStar, IconUser } from "./icons";

/* ---------- Avatar ---------- */

// 목록에 이름 첫 글자를 크게 박으면 한글 글자가 줄마다 튀어 시끄럽다.
// 항상 사람 아이콘만 그리고, name은 읽어주는 이름으로만 쓴다.
export function Avatar({ size = 46, name }: { size?: number; name?: string }) {
  const icon = size >= 56 ? 28 : size >= 46 ? 23 : size >= 40 ? 20 : 18;
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-bg-neutral-weak text-fg-placeholder"
      aria-hidden={name ? undefined : true}
      aria-label={name}
      role={name ? "img" : undefined}
    >
      <IconUser size={icon} />
    </div>
  );
}

/* ---------- Badge ---------- */

const badgeStyles = {
  brand: "bg-bg-brand-weak text-fg-brand font-semibold",
  line: "border border-stroke-neutral-weak text-fg-neutral-subtle",
  neutral: "bg-bg-neutral-weak text-fg-neutral-subtle",
  positive: "bg-bg-positive-weak text-fg-positive font-semibold",
  critical: "bg-bg-critical-weak text-fg-critical font-semibold",
  warning: "bg-bg-warning-weak text-fg-warning font-semibold",
} as const;

export function Badge({
  children,
  variant = "brand",
}: {
  children: React.ReactNode;
  variant?: keyof typeof badgeStyles;
}) {
  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center rounded-r2 px-[7px] text-t1 ${badgeStyles[variant]}`}
    >
      {children}
    </span>
  );
}

/* ---------- Chip ---------- */

export function Chip({
  children,
  selected = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  const style = selected
    ? "bg-bg-brand-solid text-fg-neutral-inverted font-semibold border-bg-brand-solid"
    : "bg-bg-layer-default text-fg-neutral-muted border-stroke-neutral-weak";
  return (
    <button
      type="button"
      className={`flex h-8 shrink-0 items-center rounded-full border px-[13px] text-t4 transition-colors ${style}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------- Segmented (두세 개 중 하나 고르기) ---------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-r3 bg-bg-neutral-weak p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`h-9 flex-1 rounded-r2 text-t4 transition-colors ${
            value === o.value
              ? "bg-bg-layer-default font-semibold text-fg-neutral shadow-sm"
              : "text-fg-neutral-subtle"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Button ---------- */

const buttonBase =
  "flex w-full items-center justify-center gap-1.5 rounded-r3 font-semibold transition-opacity active:opacity-70";

const buttonVariants = {
  primary: "bg-bg-brand-solid text-fg-neutral-inverted",
  secondary: "bg-bg-neutral-weak text-fg-neutral",
  outline: "border border-stroke-neutral-weak bg-bg-layer-default text-fg-neutral",
  critical: "bg-bg-neutral-weak text-fg-critical",
} as const;

const buttonSizes = { lg: "h-[50px] text-t5", md: "h-[42px] text-t4", sm: "h-9 px-3 text-t3" } as const;

type Variant = keyof typeof buttonVariants;
type Size = keyof typeof buttonSizes;

export function Button({
  variant = "primary",
  size = "lg",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={`${buttonBase} ${buttonSizes[size]} ${buttonVariants[variant]} disabled:bg-bg-disabled disabled:text-fg-disabled ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "lg",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${buttonBase} ${buttonSizes[size]} ${buttonVariants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

/* ---------- 입력 ---------- */

const fieldBase =
  "w-full rounded-r3 bg-bg-neutral-weak px-[13px] text-t4 text-fg-neutral outline-none " +
  "border border-transparent placeholder:text-fg-placeholder focus:border-stroke-brand-solid";

export function Field({
  label,
  hint,
  error,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-t3 text-fg-neutral-subtle">{label}</span> : null}
      <input
        className={`${fieldBase} h-[46px] ${error ? "border-stroke-critical" : ""} ${className}`}
        {...props}
      />
      {error ? (
        <span className="mt-2 block text-t3 text-fg-critical">{error}</span>
      ) : hint ? (
        <span className="mt-2 block text-t3 text-fg-placeholder">{hint}</span>
      ) : null}
    </label>
  );
}

export function TextArea({
  label,
  hint,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string }) {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-t3 text-fg-neutral-subtle">{label}</span> : null}
      <textarea className={`${fieldBase} min-h-24 resize-none py-3`} {...props} />
      {hint ? <span className="mt-2 block text-t3 text-fg-placeholder">{hint}</span> : null}
    </label>
  );
}

export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-t3 text-fg-neutral-subtle">{label}</span> : null}
      <select className={`${fieldBase} h-[46px] appearance-none`} {...props}>
        {children}
      </select>
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        checked ? "bg-bg-brand-solid" : "bg-bg-disabled"
      }`}
    >
      <span
        className={`absolute top-1 size-5 rounded-full bg-bg-layer-default transition-all ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

/* ---------- 평점 ---------- */

export function Rating({
  value,
  count,
  size = 13,
}: {
  value: number | null;
  count?: number;
  size?: number;
}) {
  // 후기가 세 개 미만이면 평점을 숨긴다. 한두 개짜리 평균은 오해를 만든다.
  // 대신 후기가 몇 개 쌓였는지는 그대로 보여준다.
  if (value === null) {
    if (count === undefined) return null;
    return (
      <span className="text-t2 text-fg-placeholder">
        {count === 0 ? "첫 상담을 기다리는 전문가" : `후기 ${count}개`}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-t2 text-fg-neutral-subtle">
      <span className="text-fg-warning">
        <IconStar size={size} />
      </span>
      <span className="font-semibold text-fg-neutral tabular-nums">{value.toFixed(1)}</span>
      {count !== undefined ? <span className="tabular-nums">({count})</span> : null}
    </span>
  );
}

/** 별 다섯 개를 눌러서 점수를 매긴다. */
export function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n}점`}
          onClick={() => onChange(n)}
          className={n <= value ? "text-fg-warning" : "text-fg-disabled"}
        >
          <IconStar size={30} />
        </button>
      ))}
    </div>
  );
}

/* ---------- 목록 도구 ---------- */

export function Divider() {
  return <div className="h-2 bg-bg-layer-basement" />;
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-t5 font-semibold">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-(--gutter) py-16 text-center">
      <p className="text-t4 font-medium text-fg-neutral-subtle">{title}</p>
      {body ? <p className="mt-1.5 text-t3 text-fg-placeholder">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** 어드민과 전문가 대시보드의 숫자 상자 */
export function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="rounded-r3 bg-bg-neutral-weak px-3.5 py-3">
      <p className="text-t2 text-fg-neutral-subtle">{label}</p>
      <p className="mt-1 text-t7 font-bold tabular-nums">
        {typeof value === "number" ? value.toLocaleString("ko-KR") : value}
        {suffix ? <span className="ml-0.5 text-t3 font-normal text-fg-neutral-subtle">{suffix}</span> : null}
      </p>
    </div>
  );
}

/** 마이·설정의 줄 하나 */
export function Row({
  label,
  value,
  href,
  onClick,
  right,
}: {
  label: string;
  value?: string;
  href?: string;
  onClick?: () => void;
  right?: React.ReactNode;
}) {
  const inner = (
    <>
      <span className="text-t4">{label}</span>
      <span className="flex items-center gap-1.5 text-t3 text-fg-neutral-subtle">
        {value}
        {right}
      </span>
    </>
  );
  const cls = "flex w-full items-center justify-between py-3.5 text-left";
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/** 정의 목록의 한 줄. 결제 내역처럼 이름과 값이 마주보는 곳에 쓴다. */
export function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-t4">
      <dt className="shrink-0 text-fg-neutral-subtle">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
