import fr from '@storyflux/shared/i18n/fr.json' assert { type: 'json' };
import en from '@storyflux/shared/i18n/en.json' assert { type: 'json' };
export const dict = { fr, en } as const;
export type LangKey = keyof typeof dict;

export function t(lang: LangKey, key: string, vars?: Record<string, string | number>) {
  const s = (dict[lang] as any)[key] ?? key;
  if (!vars) return s;
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), s);
}
