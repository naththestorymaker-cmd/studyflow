import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/sidebar.jsx'
import Dashboard from './pages/dashboard.jsx'
import Calendar from './components/calendar.jsx'
import Schedule from './components/schedule.jsx'
import Chatbot from './components/chatbot.jsx'
import Login from './pages/login.jsx'
import { useBreakpoint } from './hooks/useBreakpoint.js'
import { useAuth } from './hooks/useAuth.js'
import { useFirestoreField } from './hooks/useFirestore.js'
import { useNotificationPermission, useNotificationEngine } from './hooks/useNotifications.js'

const NOTIFIED_KEY = 'sf_notified'

export default function App() {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isDesktop = bp === 'desktop'

  const { user, loading: authLoading, loginGoogle, loginEmail, registerEmail, resetPassword, logout } = useAuth()

  const [activePage, setActivePage] = useState('dashboard')
  const [chatOpen, setChatOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('sf_theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '')
    localStorage.setItem('sf_theme', theme)
  }, [theme])

  // Lock body scroll only when app is shown (not on login page)
  useEffect(() => {
    if (user) {
      document.body.classList.add('app-loaded')
    } else {
      document.body.classList.remove('app-loaded')
    }
    return () => document.body.classList.remove('app-loaded')
  }, [user])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  const navigate = (page) => { setActivePage(page); setSidebarOpen(false) }

  const handleLogin = async () => {}  // unused, kept for safety

  // ── Firestore-backed data (per user) ──────────────────────────────────────
  const uid = user?.uid ?? null
  const [events,   setEvents]   = useFirestoreField(uid, 'events',   [])
  const [schedule, setSchedule] = useFirestoreField(uid, 'schedule', [])
  const [tasks,    setTasks]    = useFirestoreField(uid, 'tasks',    [])

  // ── Notifications ─────────────────────────────────────────────────────────
  const { request } = useNotificationPermission()
  useEffect(() => { if (user) request() }, [user, request])

  const [toasts, setToasts] = useState([])
  const onToast = useCallback((t) => {
    const id = Date.now()
    setToasts(prev => [...prev, { ...t, id }])
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 5000)
  }, [])
  useNotificationEngine({ events, tasks, onToast })

  // ── Loading states ────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ fontSize: '14px', color: 'var(--text2)' }}>Memuat...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <Login
        onLoginGoogle={loginGoogle}
        onLoginEmail={loginEmail}
        onRegister={registerEmail}
        onResetPassword={resetPassword}
      />
    )
  }

  const pages = { dashboard: Dashboard, calendar: Calendar, schedule: Schedule }
  const PageComponent = pages[activePage] || Dashboard
  const shared = { events, setEvents, schedule, setSchedule, tasks, setTasks, onModalChange: setModalOpen }

  return (
    <div style={st.app}>
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      {/* Toasts */}
      <div style={st.toastStack}>
        {toasts.map(t => (
          <div key={t.id} style={st.toast}>
            <div style={st.toastTitle}>{t.title}</div>
            <div style={st.toastBody}>{t.body}</div>
            <button style={st.toastDismiss} onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}>✕</button>
          </div>
        ))}
      </div>

      {!isDesktop && (
        <div className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`} onClick={() => setSidebarOpen(false)} />
      )}

      {isDesktop ? (
        <Sidebar activePage={activePage} setActivePage={navigate} theme={theme} toggleTheme={toggleTheme} isDesktop user={user} onLogout={logout} />
      ) : (
        <div style={{ ...st.drawer, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
          <Sidebar activePage={activePage} setActivePage={navigate} onClose={() => setSidebarOpen(false)} showClose theme={theme} toggleTheme={toggleTheme} user={user} onLogout={logout} />
        </div>
      )}

      <div style={st.mainArea}>
        {!isDesktop && (
          <header style={st.topBar}>
            <button style={st.hamburger} onClick={() => setSidebarOpen(true)} aria-label="Menu">
              <span style={st.hLine} /><span style={st.hLine} /><span style={st.hLine} />
            </button>
            <span style={st.topTitle}>StudyFlow</span>
            <button style={st.themeBtn} onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </header>
        )}
        <main style={{ ...st.main, padding: isDesktop ? '32px 40px 40px' : '16px 16px 24px' }}>
          <PageComponent {...shared} />
        </main>
      </div>

      {isMobile ? (
        <>
          <button className={`chat-fab${chatOpen ? ' open' : ''}`}
            style={{ opacity: modalOpen ? 0 : 1, pointerEvents: modalOpen ? 'none' : 'auto', transition: 'opacity 0.2s' }}
            onClick={() => setChatOpen(o => !o)} aria-label="FlowBot">
            {chatOpen ? '✕' : '💬'}
          </button>
          <div className={`chat-sheet${chatOpen ? ' open' : ''}`}>
            <Chatbot {...shared} onClose={() => setChatOpen(false)} />
          </div>
        </>
      ) : (
        <>
          <button className={`chat-fab${chatOpen ? ' open' : ''}`}
            style={{ fontSize: chatOpen ? '16px' : '20px', opacity: modalOpen ? 0 : 1, pointerEvents: modalOpen ? 'none' : 'auto', transition: 'opacity 0.2s' }}
            onClick={() => setChatOpen(o => !o)} aria-label="FlowBot">
            {chatOpen ? '✕' : '💬'}
          </button>
          <div className={`chat-panel${chatOpen ? ' visible' : ' hidden'}`}>
            <Chatbot {...shared} onClose={() => setChatOpen(false)} />
          </div>
        </>
      )}
    </div>
  )
}

const st = {
  app: { display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--bg)', position: 'relative' },
  drawer: { position: 'fixed', top: 0, left: 0, bottom: 0, width: '260px', zIndex: 150, transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)' },
  mainArea: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, position: 'relative', zIndex: 1 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', flexShrink: 0, background: 'transparent' },
  topTitle: { fontSize: '18px', fontWeight: '800', color: 'var(--text)' },
  hamburger: { width: '48px', height: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px', background: 'var(--surface)', border: 'none', cursor: 'pointer', borderRadius: '50%', boxShadow: 'var(--shadow)' },
  hLine: { display: 'block', width: '20px', height: '2px', background: 'var(--text2)', borderRadius: '2px' },
  themeBtn: { width: '48px', height: '48px', borderRadius: '50%', border: 'none', background: 'var(--surface)', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow)' },
  main: { flex: 1, overflow: 'auto', paddingBottom: '40px' },
  toastStack: { position: 'fixed', top: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 600, maxWidth: '340px', pointerEvents: 'none' },
  toast: { background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '4px solid var(--primary)', borderRadius: '12px', padding: '14px 40px 14px 16px', boxShadow: 'var(--shadow-lg)', pointerEvents: 'all', position: 'relative' },
  toastTitle: { fontSize: '14px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' },
  toastBody: { fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 },
  toastDismiss: { position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'var(--text3)', fontSize: '14px', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px' },
}
