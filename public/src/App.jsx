import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/sidebar.jsx'
import Dashboard from './pages/dashboard.jsx'
import Calendar from './components/calendar.jsx'
import Schedule from './components/schedule.jsx'
import Assignments from './pages/assignments.jsx'
import Chatbot from './components/chatbot.jsx'
import Login from './pages/login.jsx'
import { useBreakpoint } from './hooks/useBreakpoint.js'
import { useAuth } from './hooks/useAuth.js'
import { useFirestoreField } from './hooks/useFirestore.js'
import { useNotificationPermission, useNotificationEngine } from './hooks/useNotifications.js'

export default function App() {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isDesktop = bp === 'desktop'

  const { user, loading: authLoading, loginGoogle, loginEmail, registerEmail, resetPassword, logout } = useAuth()

  const [activePage, setActivePage] = useState('dashboard')
  const [chatOpen, setChatOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  // Lock body scroll only when app is shown
  useEffect(() => {
    if (user) document.body.classList.add('app-loaded')
    else document.body.classList.remove('app-loaded')
    return () => document.body.classList.remove('app-loaded')
  }, [user])

  const navigate = (page) => { setActivePage(page); setSidebarOpen(false) }

  const uid = user?.uid ?? null
  const [events,      setEvents]      = useFirestoreField(uid, 'events',      [])
  const [schedule,    setSchedule]    = useFirestoreField(uid, 'schedule',    [])
  const [tasks,       setTasks]       = useFirestoreField(uid, 'tasks',       [])
  const [assignments, setAssignments] = useFirestoreField(uid, 'assignments', [])

  const { request } = useNotificationPermission()
  useEffect(() => { if (user) request() }, [user, request])

  const [toasts, setToasts] = useState([])
  const onToast = useCallback((t) => {
    const id = Date.now()
    setToasts(prev => [...prev, { ...t, id }])
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 5000)
  }, [])
  useNotificationEngine({ events, tasks, assignments, onToast })

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

  const pages = { dashboard: Dashboard, calendar: Calendar, schedule: Schedule, assignments: Assignments }
  const PageComponent = pages[activePage] || Dashboard
  const shared = { events, setEvents, schedule, setSchedule, tasks, setTasks, assignments, setAssignments, onModalChange: setModalOpen }

  return (
    <div style={st.app}>
      {/* Toasts */}
      <div style={st.toastStack}>
        {toasts.map(t => (
          <div key={t.id} style={st.toast} className="toast-in">
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
        <Sidebar activePage={activePage} setActivePage={navigate} isDesktop user={user} onLogout={logout} />
      ) : (
        <div style={{ ...st.drawer, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
          <Sidebar activePage={activePage} setActivePage={navigate} onClose={() => setSidebarOpen(false)} showClose user={user} onLogout={logout} />
        </div>
      )}

      <div style={st.mainArea}>
        {!isDesktop && (
          <header style={st.topBar}>
            <button style={st.hamburger} onClick={() => setSidebarOpen(true)} aria-label="Menu">
              <span style={st.hLine} /><span style={st.hLine} /><span style={st.hLine} />
            </button>
            <span style={st.topTitle}>StudyFlow</span>
            <div style={{ width: '48px' }} />
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
            {chatOpen
              ? <svg className="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg className="icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            }
          </button>
          <div className={`chat-sheet${chatOpen ? ' open' : ''}`}>
            <Chatbot {...shared} onClose={() => setChatOpen(false)} />
          </div>
        </>
      ) : (
        <>
          <button className={`chat-fab${chatOpen ? ' open' : ''}`}
            style={{ opacity: modalOpen ? 0 : 1, pointerEvents: modalOpen ? 'none' : 'auto', transition: 'opacity 0.2s' }}
            onClick={() => setChatOpen(o => !o)} aria-label="FlowBot">
            {chatOpen
              ? <svg className="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg className="icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            }
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
  app: { display: 'flex', height: '100dvh', background: 'var(--bg)', position: 'relative' },
  drawer: { position: 'fixed', top: 0, left: 0, bottom: 0, width: '240px', zIndex: 150, transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)' },
  mainArea: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)' },
  topTitle: { fontSize: '16px', fontWeight: '800', color: 'var(--text)' },
  hamburger: { width: '40px', height: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '8px' },
  hLine: { display: 'block', width: '18px', height: '2px', background: 'var(--text)', borderRadius: '2px' },
  main: { flex: 1, overflow: 'auto', paddingBottom: '40px' },
  toastStack: { position: 'fixed', top: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 600, maxWidth: '320px', pointerEvents: 'none' },
  toast: { background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid #374151', borderRadius: '12px', padding: '14px 40px 14px 16px', boxShadow: 'var(--shadow-lg)', pointerEvents: 'all', position: 'relative' },
  toastTitle: { fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '3px' },
  toastBody: { fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5 },
  toastDismiss: { position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'var(--text3)', fontSize: '13px', cursor: 'pointer', padding: '2px 6px' },
}
