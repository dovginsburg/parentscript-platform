/**
 * i18next setup for ParentScript.
 *
 * 7 locales — machine-translated by Claude from the English source.
 * Requires Mira's sign-off before shipping per-market.
 */
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import ja from "./locales/ja.json";
import ptBR from "./locales/pt-BR.json";
import ar from "./locales/ar.json";

// Wire react-i18next so host apps can call useTranslation() without
// having to remember to init the React adapter themselves.
i18next.use(initReactI18next);

export const i18nResources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  ja: { translation: ja },
  "pt-BR": { translation: ptBR },
  ar: { translation: ar },
};

export const DEFAULT_LOCALE = "en";

export function baseI18nOptions(overrides: any = {}): any {
  return {
    resources: i18nResources,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
    ...overrides,
  };
}

export type ParentscriptI18n = typeof i18next;

// Named export so consumers can do `import { i18n } from "@parentscript/shared"`
// without needing to know it's a default export underneath.
export const i18n = i18next;

export default i18next;
