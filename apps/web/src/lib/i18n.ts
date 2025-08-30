import fr from '@storyflux/shared/i18n/fr.json';
import en from '@storyflux/shared/i18n/en.json';
export type Lang = 'fr' | 'en';
const dict = { fr, en } as const;

export function t(lang: Lang, key: string, vars?: Record<string, string | number>) {
  const s = (dict[lang] as any)[key] ?? key;
  if (!vars) return s;
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), s);
}
