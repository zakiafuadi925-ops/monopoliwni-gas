import { useCallback, useEffect, useState } from 'react';

export type AppRoutePath = '/' | '/lobby' | '/panduan' | '/statistik' | '/log' | '/dagang';

export interface ParsedAppRoute {
  path: AppRoutePath;
  roomCode?: string;
}

export function parseAppRoute(pathname: string): ParsedAppRoute {
  const normalized = pathname.replace(/\/+$/, '') || '/';

  const lobbyCodeMatch = normalized.match(/^\/lobby\/([a-zA-Z0-9_-]+)$/);
  if (lobbyCodeMatch) {
    return { path: '/lobby', roomCode: lobbyCodeMatch[1].toUpperCase() };
  }

  if (normalized === '/lobby') return { path: '/lobby' };
  if (normalized === '/panduan' || normalized === '/guide') return { path: '/panduan' };
  if (normalized === '/statistik' || normalized === '/stats') return { path: '/statistik' };
  if (normalized === '/log' || normalized === '/logs') return { path: '/log' };
  if (normalized === '/dagang' || normalized === '/trade') return { path: '/dagang' };

  return { path: '/' };
}

export function useAppRouter() {
  const [route, setRoute] = useState<ParsedAppRoute>(() =>
    parseAppRoute(typeof window !== 'undefined' ? window.location.pathname : '/')
  );

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseAppRoute(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((targetPath: string, replace = false) => {
    const parsed = parseAppRoute(targetPath);
    const nextUrl =
      parsed.path === '/lobby' && parsed.roomCode
        ? `/lobby/${parsed.roomCode}`
        : parsed.path;

    if (typeof window !== 'undefined' && window.location.pathname !== nextUrl) {
      if (replace) {
        window.history.replaceState(null, '', nextUrl);
      } else {
        window.history.pushState(null, '', nextUrl);
      }
    }
    setRoute(parsed);
  }, []);

  return {
    route,
    navigate,
  };
}
