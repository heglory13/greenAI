import vi from './vi'
import en from './en'

export type Locale = 'vi' | 'en'
export type Translations = typeof vi

const translations: Record<Locale, Translations> = { vi, en }

export default translations
