import { useLanguageStore } from '../stores/languageStore'
import type { Locale } from '../i18n'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguageStore()

  return (
    <div className="flex items-center bg-white/20 rounded-full p-0.5 text-xs font-semibold">
      <button
        onClick={() => setLocale('vi')}
        className={`px-2.5 py-1 rounded-full transition-all ${
          locale === 'vi'
            ? 'bg-white text-primary-700 shadow-sm'
            : 'text-white/80 hover:text-white'
        }`}
        aria-label="Tiếng Việt"
      >
        VN
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`px-2.5 py-1 rounded-full transition-all ${
          locale === 'en'
            ? 'bg-white text-primary-700 shadow-sm'
            : 'text-white/80 hover:text-white'
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  )
}
