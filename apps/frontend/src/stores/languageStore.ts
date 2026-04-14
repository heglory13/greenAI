import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import translations, { Locale, Translations } from '../i18n'

interface LanguageState {
  locale: Locale
  t: Translations
  setLocale: (locale: Locale) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      locale: 'vi',
      t: translations.vi,
      setLocale: (locale: Locale) =>
        set({ locale, t: translations[locale] }),
    }),
    { name: 'language-storage' }
  )
)
