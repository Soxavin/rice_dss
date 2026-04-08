import { createContext, useContext, useState } from 'react'
import { translations } from '../data/translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en')
  const [isTransitioning, setIsTransitioning] = useState(false)

  const t = (key) => {
    return translations[lang]?.[key] || translations.en[key] || key
  }

  const switchLang = (newLang) => {
    if (newLang === lang) return
    setIsTransitioning(true)
    setTimeout(() => {
      setLang(newLang)
      setIsTransitioning(false)
      // C7: keep HTML lang attribute in sync for screen readers (WCAG 3.1.1)
      document.documentElement.lang = newLang === 'km' ? 'km' : 'en'
    }, 130)
  }

  return (
    // W2: setLang intentionally omitted — always use switchLang for the fade transition
    <LanguageContext.Provider value={{ lang, switchLang, isTransitioning, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
