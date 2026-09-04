import {
  useLocation,
  useNavigate,
  useParams as useRouterParams,
  useSearchParams as useRouterSearchParams,
} from "react-router-dom";

const normalize = (href: string) => href.replace(/^\/conect3(?=\/|$)/, "") || "/";

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (href: string) => navigate(normalize(href)),
    replace: (href: string) => navigate(normalize(href), { replace: true }),
    back: () => navigate(-1),
    refresh: () => window.location.reload(),
    prefetch: async () => undefined,
    forward: () => navigate(1),
  };
}

export function usePathname() {
  const { pathname } = useLocation();
  return pathname === "/" ? "/conect3" : `/conect3${pathname}`;
}

export function useParams<T extends Record<string, string | string[]>>() {
  return useRouterParams() as T;
}

export function useSearchParams() {
  return useRouterSearchParams()[0];
}
