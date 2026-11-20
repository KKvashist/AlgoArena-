import type { CSSProperties, ReactElement } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import BackgroundFX from './components/BackgroundFX'
import StatusBar from './components/StatusBar'
import ProtectedRoute from './components/ProtectedRoute'
import ArenaDock from './components/ArenaDock'
import { ArenaProvider, ARENA_WIDTHS, useArena } from './context/ArenaContext'
import { useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Notes from './pages/Notes'
import TopicPage from './pages/TopicPage'
import { JourneyProvider } from './context/JourneyContext'
import JourneyEntry from './journey/JourneyEntry'
import Onboarding from './journey/Onboarding'
import Assessment from './journey/Assessment'
import Complete from './journey/Complete'
import Roadmap from './journey/Roadmap'
import Progress from './journey/Progress'

// Login / Signup pages: agar user already logged in hai to seedha Home bhej do
function PublicOnly({ children }: { children: ReactElement }) {
  const { user } = useAuth()
  if (user) return <Navigate to="/" replace />
  return children
}

function Shell() {
  const { user } = useAuth()
  const { open, size } = useArena()

  // Full screen covers the page, so no shift is needed in that mode
  const shift = user && open && size !== 'full' ? ARENA_WIDTHS[size] : '0px'

  return (
    <>
      <BackgroundFX />

      {/* The whole page shifts left when the panel opens (large screens) */}
      <div
        className="relative z-10 transition-[margin] duration-300 ease-out lg:mr-[var(--arena-w)]"
        style={{ '--arena-w': shift } as CSSProperties}
      >
        <Navbar />
        <StatusBar />
        <Routes>
          {/* Public: sirf login / signup */}
          <Route
            path="/login"
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnly>
                <Signup />
              </PublicOnly>
            }
          />

          {/* Baaki sab kuch login ke peeche. "/" bhi, taaki site khulte hi login aaye */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/topic/:slug" element={<TopicPage />} />

            {/* Personalised DSA journey */}
            <Route path="/journey" element={<JourneyEntry />} />
            <Route path="/journey/onboarding" element={<Onboarding />} />
            <Route path="/journey/assessment" element={<Assessment />} />
            <Route path="/journey/complete" element={<Complete />} />
            <Route path="/journey/roadmap" element={<Roadmap />} />
            <Route path="/journey/progress" element={<Progress />} />
          </Route>

          {/* Unknown URL -> Home (jo login na ho to login par jayega) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {user && <ArenaDock key={user.id} />}
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ArenaProvider>
        <JourneyProvider>
          <Shell />
        </JourneyProvider>
      </ArenaProvider>
    </BrowserRouter>
  )
}

export default App
