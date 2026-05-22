import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { translations, LANGS } from './translations';

const STORAGE_KEY = 'mangalist_lang';
const HTML_LANG = { pt: 'pt-BR', en: 'en', es: 'es-419' };

// Idioma inicial: preferência salva → idioma do navegador → inglês.
function detectInitial() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGS.includes(saved)) return saved;
  } catch {
    /* localStorage indisponível */
  }
  const nav = (navigator.language || 'en').toLowerCase();
  if (nav.startsWith('pt')) return 'pt';
  if (nav.startsWith('es')) return 'es';
  return 'en';
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectInitial);

  const setLang = useCallback((next) => {
    if (!LANGS.includes(next)) return;
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = HTML_LANG[next] || next;
  }, []);

  // t(key, vars?) — busca no idioma atual, cai pro inglês, e por fim devolve a
  // própria chave. Interpola {var} a partir de `vars`.
  const t = useCallback(
    (key, vars) => {
      const dict = translations[lang] || translations.en;
      let s = dict[key] ?? translations.en[key] ?? key;
      if (vars) {
        for (const k of Object.keys(vars)) {
          s = s.replaceAll(`{${k}}`, String(vars[k]));
        }
      }
      return s;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n precisa estar dentro de <I18nProvider>');
  return ctx;
}
