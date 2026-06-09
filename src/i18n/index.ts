import { en } from './locales/en';
import { ru } from './locales/ru';

/** `en` is the source of truth for the shape; every locale must conform. */
export type Messages = typeof en;
export type Lang = 'en' | 'ru';

export const locales: Record<Lang, Messages> = { en, ru };
export const LANGS: Lang[] = ['ru', 'en'];

/** Dot-path lookup, e.g. resolve(msgs, 'controls.startPop'). */
export function resolvePath(obj: unknown, path: string): string {
  const v = path
    .split('.')
    .reduce<unknown>((o, k) => (o == null ? o : (o as Record<string, unknown>)[k]), obj);
  return typeof v === 'string' ? v : path; // fall back to the key if missing
}

/** Replace {name} placeholders. */
export function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in params ? String(params[k]) : `{${k}}`,
  );
}
