import { useState } from 'react'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
)

export default function Login({ onLoginEmail, onRegister, onResetPassword, onLoginGoogle }) {
  const [tab, setTab]         = useState('login')
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy]       = useState(false)

  const friendlyError = (code) => ({
    'auth/user-not-found':         'Email tidak ditemukan. Pastikan kamu sudah mendaftar.',
    'auth/wrong-password':         'Password salah.',
    'auth/invalid-credential':     'Email atau password salah.',
    'auth/email-already-in-use':   'Email sudah terdaftar. Silakan masuk.',
    'auth/weak-password':          'Password minimal 6 karakter.',
    'auth/invalid-email':          'Format email tidak valid.',
    'auth/too-many-requests':      'Terlalu banyak percobaan. Tunggu beberapa menit.',
    'auth/network-request-failed': 'Tidak ada koneksi internet.',
    'auth/popup-closed-by-user':   'Login Google dibatalkan.',
    'auth/popup-blocked':          'Popup diblokir browser. Coba izinkan popup untuk situs ini.',
    'auth/operation-not-allowed':  'Metode login belum diaktifkan di Firebase.',
  }[code] || `Terjadi kesalahan (${code || 'unknown'}). Coba lagi.`)

  const switchTab = (t) => { setTab(t); setError(''); setSuccess('') }

  const handleGoogle = async () => {
    setError(''); setBusy(true)
    try { await onLoginGoogle() }
    catch (e) { setError(friendlyError(e.code)) }
    setBusy(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setBusy(true)
    try {
      if (tab === 'reset') {
        if (!email.trim()) { setError('Masukkan email terlebih dahulu.'); setBusy(false); return }
        await onResetPassword(email.trim())
        setSuccess('Link reset password sudah dikirim! Cek inbox atau folder spam.')
      } else if (tab === 'login') {
        await onLoginEmail(email, password)
      } else {
        if (!name.trim()) { setError('Nama tidak boleh kosong.'); setBusy(false); return }
        await onRegister(name.trim(), email, password)
      }
    } catch (e) { setError(friendlyError(e.code)) }
    setBusy(false)
  }

  return (
    <div style={s.page}>
      <div style={s.card} className="login-card">
        {/* Logo */}
        <div style={s.logoRow}>
          <div style={s.logoMark}>SF</div>
          <div>
            <div style={s.logoName}>StudyFlow</div>
            <div style={s.logoSub}>Manajemen Belajar</div>
          </div>
        </div>

        {tab === 'reset' ? (
          <>
            <h2 style={s.heading}>Reset Password</h2>
            <p style={s.desc}>Masukkan emailmu dan kami kirimkan link untuk membuat password baru.</p>
            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Email</label>
                <input className="sf-input" type="email" placeholder="email@contoh.com"
                  value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              {error   && <div style={s.errorBox}>{error}</div>}
              {success && <div style={s.successBox}>{success}</div>}
              <button type="submit" style={s.submitBtn} disabled={busy}>
                {busy ? 'Mengirim...' : 'Kirim Link Reset'}
              </button>
            </form>
            <button style={s.linkBtn} onClick={() => switchTab('login')}>← Kembali ke halaman masuk</button>
          </>
        ) : (
          <>
            <p style={s.desc}>
              {tab === 'login' ? 'Masuk untuk melanjutkan belajarmu.' : 'Buat akun untuk mulai menggunakan StudyFlow.'}
            </p>

            {/* Tabs */}
            <div style={s.tabs}>
              <button style={{ ...s.tab, ...(tab === 'login' ? s.tabActive : {}) }} onClick={() => switchTab('login')}>Masuk</button>
              <button style={{ ...s.tab, ...(tab === 'register' ? s.tabActive : {}) }} onClick={() => switchTab('register')}>Daftar</button>
            </div>

            {/* Google button */}
            <button style={s.googleBtn} onClick={handleGoogle} disabled={busy} type="button">
              <GoogleIcon />
              {tab === 'login' ? 'Masuk dengan Google' : 'Daftar dengan Google'}
            </button>

            <div style={s.divider}>
              <div style={s.divLine} /><span style={s.divText}>atau</span><div style={s.divLine} />
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} style={s.form}>
              {tab === 'register' && (
                <div style={s.field}>
                  <label style={s.label}>Nama lengkap</label>
                  <input className="sf-input" type="text" placeholder="Nama kamu"
                    value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
                </div>
              )}
              <div style={s.field}>
                <label style={s.label}>Email</label>
                <input className="sf-input" type="email" placeholder="email@contoh.com"
                  value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Password</label>
                <input className="sf-input" type="password" placeholder="Minimal 6 karakter"
                  value={password} onChange={e => setPass(e.target.value)} required
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
              </div>
              {error && <div style={s.errorBox}>{error}</div>}
              <button type="submit" style={s.submitBtn} disabled={busy}>
                {busy ? 'Memuat...' : tab === 'login' ? 'Masuk' : 'Buat Akun'}
              </button>
            </form>

            {tab === 'login' && (
              <button style={s.linkBtn} onClick={() => switchTab('reset')}>Lupa password?</button>
            )}
          </>
        )}

        <p style={s.note}>Data tersimpan aman di cloud — bisa diakses dari perangkat mana saja.</p>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100dvh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    background: 'var(--bg)', padding: '24px 16px',
    paddingTop: 'max(32px, env(safe-area-inset-top, 32px))',
    paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))',
    overflowY: 'auto',
  },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '20px', padding: '32px 28px',
    width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-lg)',
    marginTop: 'auto', marginBottom: 'auto',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  logoMark: {
    width: '40px', height: '40px', borderRadius: '10px',
    background: 'var(--primary)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: '800',
  },
  logoName: { fontSize: '18px', fontWeight: '800', color: 'var(--text)' },
  logoSub: { fontSize: '12px', color: 'var(--text3)', marginTop: '1px' },
  heading: { fontSize: '18px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' },
  desc: { fontSize: '14px', color: 'var(--text2)', marginBottom: '18px', lineHeight: 1.5 },
  tabs: {
    display: 'flex', gap: '4px', marginBottom: '18px',
    background: 'var(--surface2)', borderRadius: '10px', padding: '4px',
  },
  tab: {
    flex: 1, padding: '9px', borderRadius: '8px', border: 'none',
    background: 'transparent', color: 'var(--text2)',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
  },
  tabActive: { background: 'var(--surface)', color: 'var(--text)', boxShadow: 'var(--shadow)' },
  googleBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    width: '100%', padding: '13px 20px', borderRadius: '10px',
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--text)', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
    marginBottom: '16px', minHeight: '50px',
  },
  divider: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
  divLine: { flex: 1, height: '1px', background: 'var(--border)' },
  divText: { fontSize: '12px', color: 'var(--text3)', whiteSpace: 'nowrap' },
  form: { display: 'flex', flexDirection: 'column' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text2)', marginBottom: '7px' },
  errorBox: {
    fontSize: '13px', color: '#f87171',
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', lineHeight: 1.5,
  },
  successBox: {
    fontSize: '13px', color: '#4ade80',
    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
    borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', lineHeight: 1.5,
  },
  submitBtn: {
    width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
    background: 'var(--primary)', color: '#fff',
    fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px', minHeight: '52px',
  },
  linkBtn: {
    background: 'transparent', border: 'none', color: 'var(--primary)',
    fontSize: '14px', cursor: 'pointer', padding: '8px 0', marginBottom: '12px',
    textAlign: 'left', display: 'flex', alignItems: 'center', minHeight: '44px',
  },
  note: { fontSize: '12px', color: 'var(--text3)', textAlign: 'center', lineHeight: 1.5, marginTop: '8px' },
}
