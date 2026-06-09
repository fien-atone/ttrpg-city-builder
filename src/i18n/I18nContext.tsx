import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { LANGS, locales, resolvePath, interpolate, type Lang } from './index';

type TFn = (path: string, params?: Record<string, string | number>) => string;

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  langs: Lang[];
  t: TFn;
  /** named scale labels, e.g. scale('scales.temperature') → ['Frigid', …] */
  scale: (path: string) => string[];
  /** locale-aware integer formatting */
  fmt: (n: number) => string;
}

const I18nContext = createContext<I18nValue | null>(null);
const STORAGE_KEY = 'settlement-sim.lang';

function initialLang(): Lang {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (saved === 'en' || saved === 'ru') return saved;
  return 'ru';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = l;
  }, []);

  const value = useMemo<I18nValue>(() => {
    const messages = locales[lang];
    const t: TFn = (path, params) => interpolate(resolvePath(messages, path), params);
    const scale = (path: string): string[] => {
      const v = path.split('.').reduce<unknown>((o, k) => (o == null ? o : (o as any)[k]), messages);
      return Array.isArray(v) ? (v as string[]) : [];
    };
    const nf = new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-US');
    const fmt = (n: number) => nf.format(Math.round(n));
    return { lang, setLang, langs: LANGS, t, scale, fmt };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
  return ctx;
}
