import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Landing from './pages/Landing'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import SearchResults from './pages/SearchResults'
import Step1Upload from './pages/Detection/Step1Upload'
import Step2Questions from './pages/Detection/Step2Questions'
import Step3Results from './pages/Detection/Step3Results'
import ResourcesList from './pages/Learning/ResourcesList'
import ArticleDetail from './pages/Learning/ArticleDetail'
import VideoDetail from './pages/Learning/VideoDetail'
import ExpertsPage from './pages/Experts/ExpertsPage'
import CropIntegration from './pages/CropIntegration'

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
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
              <Route path="/crop-integration" element={<CropIntegration />} />
            </Route>
            {/* Auth pages — no navbar/footer layout */}
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  )
}
