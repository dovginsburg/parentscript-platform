import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { registerSW } from './pwa-register'
import './index.css'

// Shared i18n bootstrap (see packages/shared/src/i18n.ts).
// 7 locales: en, es, fr, de, ja, pt-BR, ar. Default to the browser's
// language if it matches one of the supported codes, else fall back to
// English. Must run before React renders so the first paint already has
// translations available.
import { i18n, baseI18nOptions } from '@parentscript/shared'

const browserLang =
  typeof navigator !== 'undefined' ? navigator.language : 'en'
const supported = ['en', 'es', 'fr', 'de', 'ja', 'pt-BR', 'ar'] as const
const initialLng = (supported as readonly string[]).includes(browserLang)
  ? browserLang
  : browserLang.split('-')[0] &&
      (supported as readonly string[]).includes(browserLang.split('-')[0])
    ? browserLang.split('-')[0]
    : 'en'

void i18n.init({ ...baseI18nOptions(), lng: initialLng })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

registerSW()
