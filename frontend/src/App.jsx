import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import AdminRoute from './components/AdminRoute'

// C9: route-level code splitting — each page chunk is loaded only when first visited
const Landing        = lazy(() => import('./pages/Landing'))
const SignIn         = lazy(() => import('./pages/SignIn'))
const SignUp         = lazy(() => import('./pages/SignUp'))
const SearchResults  = lazy(() => import('./pages/SearchResults'))
const Step1Upload    = lazy(() => import('./pages/Detection/Step1Upload'))
const Step2Questions = lazy(() => import('./pages/Detection/Step2Questions'))
const Step3Results   = lazy(() => import('./pages/Detection/Step3Results'))
const ResourcesList  = lazy(() => import('./pages/Learning/ResourcesList'))
const ArticleDetail  = lazy(() => import('./pages/Learning/ArticleDetail'))
const VideoDetail    = lazy(() => import('./pages/Learning/VideoDetail'))
const ExpertsPage    = lazy(() => import('./pages/Experts/ExpertsPage'))
const ProfilePage    = lazy(() => import('./pages/Profile/ProfilePage'))
const NotFound       = lazy(() => import('./pages/NotFound'))

// Admin pages
const AdminLayout    = lazy(() => import('./pages/Admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'))
const AdminUsers     = lazy(() => import('./pages/Admin/AdminUsers'))
const AdminResources = lazy(() => import('./pages/Admin/AdminResources'))
const ResourceEditor = lazy(() => import('./pages/Admin/ResourceEditor'))
const AdminProfiles  = lazy(() => import('./pages/Admin/AdminProfiles'))
const AdminAnalysis  = lazy(() => import('./pages/Admin/AdminAnalysis'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={null}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/detect" element={<Step1Upload />} />
                <Route path="/detect/questions" element={<Step2Questions />} />
                <Route path="/detect/results" element={<Step3Results />} />
                <Route path="/learn" element={<ResourcesList />} />
                <Route path="/learn/article/:id" element={<ArticleDetail />} />
                <Route path="/learn/video/:id" element={<VideoDetail />} />
                <Route path="/experts" element={<ExpertsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              {/* Auth pages — no navbar/footer layout */}
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />
              {/* Admin — role-gated, own layout */}
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="resources" element={<AdminResources />} />
                <Route path="resources/new" element={<ResourceEditor />} />
                <Route path="resources/:id" element={<ResourceEditor />} />
                <Route path="profiles" element={<AdminProfiles />} />
                <Route path="analysis" element={<AdminAnalysis />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  )
}
