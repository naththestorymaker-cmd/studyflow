const NAV = [
  { id: 'dashboard', label: 'Dashboard', sub: 'Ringkasan hari ini' },
  { id: 'calendar',  label: 'Kalender',  sub: 'Event & kegiatan' },
  { id: 'schedule',  label: 'Jadwal',    sub: 'Jadwal pelajaran' },
]

export default function Sidebar({ activePage, setActivePage, showClose, onClose, theme, toggleTheme, isDesktop, user, onLogout }) {
  const displayName = user?.displayName || 'Siswa'
  const email       = user?.email || ''
  const photoURL    = user?.photoURL || null
  const initials    = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside style={s.sidebar}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>
          <div style={s.logoMark}>SF</div>
          <div>
            <div style={s.logoName}>StudyFlow</div>
            <div style={s.logoSub}>Manajemen Belajar</div>
          </div>
        </div>
        {showClose && <button style={s.iconBtn} onClick={onClose} aria-label="Tutup">✕</button>}
      </div>

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navSection}>MENU</div>
        {NAV.map(item => (
          <button
            key={item.id}
            className="nav-item-hover"
            onClick={() => setActivePage(item.id)}
            style={{ ...s.navItem, ...(activePage === item.id ? s.navActive : {}) }}
          >
            <div style={s.navText}>
              <span style={s.navName}>{item.label}</span>
              <span style={s.navSub}>{item.sub}</span>
            </div>
          </button>
        ))}
      </nav>

      {/* Footer — user info + theme + logout */}
      <div style={s.footer}>
        <div style={s.userRow}>
          {/* Avatar */}
          {photoURL
            ? <img src={photoURL} alt={displayName} style={s.avatarImg} referrerPolicy="no-referrer" />
            : <div style={s.avatar}>{initials}</div>
          }
          <div style={s.userInfo}>
            <div style={s.userName}>{displayName}</div>
            <div style={s.userEmail}>{email}</div>
          </div>
        </div>

        <div style={s.footerActions}>
          {isDesktop && (
            <button style={s.iconAction} onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          )}
          <button style={s.logoutBtn} onClick={onLogout} title="Keluar">
            ⎋ Keluar
          </button>
        </div>
      </div>
    </aside>
  )
}

const s = {
  sidebar: {
    width: '260px', height: '100%', flexShrink: 0,
    background: 'var(--surface)',
    borderRight: 'none',
    display: 'flex', flexDirection: 'column',
    boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
    zIndex: 10,
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '24px 20px', borderBottom: 'none',
  },
  logo: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoMark: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: 'var(--primary)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '15px', fontWeight: '800', flexShrink: 0,
    boxShadow: '0 4px 12px rgba(113,131,85,0.3)',
  },
  logoName: { fontSize: '18px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.5px' },
  logoSub: { fontSize: '12px', color: 'var(--text3)', marginTop: '2px', fontWeight: '600' },
  iconBtn: {
    background: 'var(--surface2)', border: 'none', color: 'var(--text)',
    fontSize: '16px', cursor: 'pointer', padding: '8px', borderRadius: '50%',
  },
  nav: { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' },
  navSection: {
    fontSize: '12px', fontWeight: '800', color: 'var(--text3)',
    letterSpacing: '1px', padding: '0 12px', marginBottom: '12px',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '14px 16px', borderRadius: '99px',
    border: 'none', background: 'transparent',
    color: 'var(--text2)', cursor: 'pointer', textAlign: 'left', width: '100%',
  },
  navActive: {
    background: 'rgba(113, 131, 85, 0.12)', color: 'var(--primary)',
  },
  navText: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 },
  navName: { fontSize: '15px', fontWeight: '700', lineHeight: 1.3 },
  navSub: { fontSize: '12px', color: 'var(--text3)', marginTop: '2px' },
  footer: {
    padding: '20px', borderTop: 'none',
    display: 'flex', flexDirection: 'column', gap: '16px',
    background: 'var(--surface2)', borderRadius: '24px 24px 0 0', margin: '0 8px',
  },
  userRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: 'var(--primary)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: '700', flexShrink: 0,
  },
  avatarImg: { width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, objectFit: 'cover' },
  userInfo: { minWidth: 0, flex: 1 },
  userName: { fontSize: '14px', fontWeight: '700', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userEmail: { fontSize: '12px', color: 'var(--text3)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  footerActions: { display: 'flex', gap: '8px', alignItems: 'center' },
  iconAction: {
    width: '40px', height: '40px', borderRadius: '50%',
    border: 'none', background: 'var(--surface)',
    fontSize: '18px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  logoutBtn: {
    flex: 1, padding: '10px 16px', borderRadius: '99px',
    border: 'none', background: 'var(--surface)',
    color: 'var(--danger)', fontSize: '14px', fontWeight: '700',
    cursor: 'pointer', textAlign: 'center',
    transition: 'background 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
}
