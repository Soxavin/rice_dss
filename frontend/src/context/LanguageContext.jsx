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
    }, 130)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, switchLang, isTransitioning, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
