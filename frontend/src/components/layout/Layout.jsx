import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import { useLanguage } from '../../context/LanguageContext'

export default function Layout() {
  const { isTransitioning } = useLanguage()
  const location = useLocation()
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main
        key={location.key}
        className="flex-1 page-enter"
        style={{ opacity: isTransitioning ? 0 : 1, transition: 'opacity 0.13s ease' }}
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
