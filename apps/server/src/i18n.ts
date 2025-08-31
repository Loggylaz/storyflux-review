import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Charge les JSON sans import attributes (compatible Node 20)
const fr = require('@storyflux/shared/i18n/fr.json') as Record<string, string>;
const en = require('@storyflux/shared/i18n/en.json') as Record<string, string>;

export const dict = { fr, en } as const;
export type LangKey = keyof typeof dict;

export function t(lang: LangKey, key: string, vars?: Record<string, string | number>) {
  const table = dict[lang] ?? dict.fr;
  const s = table[key] ?? key;
  if (!vars) return s;
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), s);
}
