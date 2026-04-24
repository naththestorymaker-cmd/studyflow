const NAV = [
  { id: 'dashboard',   label: 'Dashboard' },
  { id: 'calendar',    label: 'Kalender' },
  { id: 'schedule',    label: 'Jadwal' },
  { id: 'assignments', label: 'Tugas' },
]

export default function Sidebar({ activePage, setActivePage, showClose, onClose, isDesktop, user, onLogout }) {
  const displayName = user?.displayName || 'Siswa'
  const email       = user?.email || ''
  const photoURL    = user?.photoURL || null
  const initials    = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside style={s.sidebar}>
      {/* Logo */}
      <div style={s.header}>
        <div style={s.logo}>
          <img src="/assets/logo.png" alt="StudyFlow Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
          <span style={s.logoName}>StudyFlow</span>
        </div>
        {showClose && (
          <button style={s.iconBtn} onClick={onClose} aria-label="Tutup">
            <svg className="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={s.nav}>
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            style={{ ...s.navItem, ...(activePage === item.id ? s.navActive : {}) }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={s.footer}>
        <div style={s.userRow}>
          {photoURL
            ? <img src={photoURL} alt={displayName} style={s.avatarImg} referrerPolicy="no-referrer" />
            : <div style={s.avatar}>{initials}</div>
          }
          <div style={s.userInfo}>
            <div style={s.userName}>{displayName}</div>
            <div style={s.userEmail}>{email}</div>
          </div>
        </div>
        <button style={s.logoutBtn} onClick={onLogout}>
          <svg className="icon" viewBox="0 0 24 24" style={{ width: '15px', height: '15px', marginRight: '6px' }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Keluar
        </button>
      </div>
    </aside>
  )
}

const s = {
  sidebar: {
    width: '240px', height: '100%', flexShrink: 0,
    background: 'var(--surface)',
    display: 'flex', flexDirection: 'column',
    borderRight: '1px solid var(--border)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '28px 20px 20px',
  },
  logo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoMark: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: 'var(--primary)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', fontWeight: '800', flexShrink: 0,
  },
  logoName: { fontSize: '16px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.3px' },
  iconBtn: {
    background: 'transparent', border: 'none', color: 'var(--text2)',
    cursor: 'pointer', padding: '6px', borderRadius: '8px',
  },
  nav: {
    flex: 1, padding: '8px 12px',
    display: 'flex', flexDirection: 'column', gap: '4px',
  },
  navItem: {
    padding: '11px 16px', borderRadius: '99px',
    border: 'none', background: 'transparent',
    color: 'var(--text2)', cursor: 'pointer',
    textAlign: 'left', width: '100%',
    fontSize: '14px', fontWeight: '600',
    transition: 'all 0.15s ease',
  },
  navActive: {
    background: 'var(--primary)',
    color: '#fff',
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  userRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'var(--primary)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: '700', flexShrink: 0,
  },
  avatarImg: { width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, objectFit: 'cover' },
  userInfo: { minWidth: 0, flex: 1 },
  userName: { fontSize: '13px', fontWeight: '700', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userEmail: { fontSize: '11px', color: 'var(--text3)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  logoutBtn: {
    padding: '10px 16px', borderRadius: '99px',
    border: '1px solid var(--border)', background: 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text2)', fontSize: '13px', fontWeight: '600',
    cursor: 'pointer', transition: 'all 0.15s',
  },
}
