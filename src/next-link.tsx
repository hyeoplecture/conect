import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | { pathname?: string; query?: Record<string, string> };
  children: ReactNode;
};

function mobileHref(href: Props["href"]) {
  if (typeof href === "string") return href.replace(/^\/conect3(?=\/|$)/, "") || "/";
  const path = (href.pathname ?? "/").replace(/^\/conect3(?=\/|$)/, "") || "/";
  const query = new URLSearchParams(href.query).toString();
  return query ? `${path}?${query}` : path;
}

export default function Link({ href, children, ...props }: Props) {
  return <RouterLink to={mobileHref(href)} {...props}>{children}</RouterLink>;
}
