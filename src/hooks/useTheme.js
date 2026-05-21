import { useEffect, useState } from 'react';

const STORAGE_KEY = 'mangalist:theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  // Respeita a preferência do sistema, com escuro como padrão.
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/**
 * Gerencia o tema claro/escuro, persiste em localStorage e reflete no
 * atributo [data-theme] do <html> (lido pelo theme.css).
 */
export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return { theme, isDark: theme === 'dark', toggleTheme };
}
