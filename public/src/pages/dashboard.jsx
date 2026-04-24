import { useState, useEffect } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint.js'

const QUOTES = [
  'Konsistensi adalah kunci. Terus maju!',
  'Hari ini adalah kesempatan baru.',
  'Satu tugas selesai = satu langkah maju.',
  'Belajar itu investasi terbaik.',
  'Fokus pada progres, bukan kesempurnaan.',
  'Kamu bisa lebih dari yang kamu kira.',
  'Mulai dari yang kecil, tetap konsisten.',
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Selamat pagi!'
  if (h < 18) return 'Selamat siang!'
  return 'Selamat malam!'
}

// Get ISO week date range (Mon–Sun)
function getWeekRange() {
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7)); mon.setHours(0,0,0,0)
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999)
  return { mon, sun }
}

const DAYS_ID = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']

export default function Dashboard({ events, tasks, setTasks, schedule, assignments = [], setAssignments = () => {} }) {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isDesktop = bp === 'desktop'

  const [greet, setGreet] = useState(getGreeting)
  useEffect(() => {
    const t = setInterval(() => setGreet(getGreeting()), 60_000)
    return () => clearInterval(t)
  }, [])

  const today = new Date()
  const todayStr = (() => {
    const y = today.getFullYear()
    const m = String(today.getMonth()+1).padStart(2,'0')
    const d = String(today.getDate()).padStart(2,'0')
    return `${y}-${m}-${d}`
  })()
  const nowMinutes = today.getHours() * 60 + today.getMinutes()
  const todayName = DAYS_ID[today.getDay()]

  // Only show events that haven't ended yet
  const todayEvents = events.filter(e => {
    if (e.date !== todayStr) return false
    if (!e.endTime) return true
    const [h, m] = e.endTime.split(':').map(Number)
    return (h * 60 + m) > nowMinutes
  })
  const [productiveDays, setProductiveDays] = useState(0)

  useEffect(() => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${now.getMonth()}`
    const todayStr = now.toISOString().split('T')[0]

    let streakData = { month: currentMonth, days: [] }
    try {
      const stored = JSON.parse(localStorage.getItem('studyflow_streak'))
      if (stored && stored.month === currentMonth) {
        streakData = stored
      }
    } catch(e) {}

    if (!streakData.days.includes(todayStr)) {
      streakData.days.push(todayStr)
      localStorage.setItem('studyflow_streak', JSON.stringify(streakData))
    }

    setProductiveDays(streakData.days.length)
  }, [])

  const todaySchedule = schedule.filter(s => s.day === todayName)
  const pendingTasks  = tasks.filter(t => !t.done)
  const doneTasks     = tasks.filter(t => t.done)
  const taskPct       = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0
  const toggle = (id) => setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t))
  const quote = QUOTES[today.getDay() % QUOTES.length]

  // ── Assignment stats ──────────────────────────────────────────────────────
  const DIFF_RANK_D = { 'Mudah': 0, 'Sedang': 1, 'Sulit': 2, 'Sangat Sulit': 3 }
  const DIFF_COLOR  = { 'Mudah': '#5db870', 'Sedang': '#e07d3c', 'Sulit': '#e8b84b', 'Sangat Sulit': '#d05c5c' }
  const pendingAssignments = assignments.filter(a => !a.done)
  const urgentAssignments  = pendingAssignments.filter(a => {
    if (!a.deadline) return false
    const today2 = new Date(); today2.setHours(0,0,0,0)
    const dl = new Date(a.deadline); dl.setHours(0,0,0,0)
    return Math.round((dl - today2) / 86400000) <= 3
  })
  // Top 3 by priority (deadline + difficulty) — used for both Focus and Priority cards
  const priorityAssignments = [...pendingAssignments].sort((a, b) => {
    const daysA = a.deadline ? Math.max(Math.round((new Date(a.deadline) - new Date()) / 86400000), 0) : 999
    const daysB = b.deadline ? Math.max(Math.round((new Date(b.deadline) - new Date()) / 86400000), 0) : 999
    const scoreA = daysA - (3 - (DIFF_RANK_D[a.difficulty] ?? 1)) * 3
    const scoreB = daysB - (3 - (DIFF_RANK_D[b.difficulty] ?? 1)) * 3
    return scoreA - scoreB
  }).slice(0, 3)

  const toggleAssignment = (id) => setAssignments(p => p.map(a => a.id === id ? { ...a, done: !a.done } : a))
  const { mon, sun } = getWeekRange()
  const weekEvents = events.filter(e => { const d = new Date(e.date); return d >= mon && d <= sun })
  const weekDone   = tasks.filter(t => t.done).length
  const weekTotal  = tasks.length
  const weekPct    = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0

  // Busiest day: which day has most schedule items
  const dayCounts = DAYS_ID.slice(1).map(d => ({ day: d, count: schedule.filter(s => s.day === d).length }))
  const busiestDay = dayCounts.reduce((a, b) => b.count > a.count ? b : a, { day: '', count: 0 })

  // Top 3 pending tasks for Today Focus
  const focusTasks = pendingTasks.slice(0, 3)

  // Insights
  const insights = []
  if (productiveDays > 0) insights.push(`Kamu telah produktif selama ${productiveDays} hari bulan ini!`)
  if (weekDone > 0) insights.push(`Kamu menyelesaikan ${weekDone} tugas minggu ini`)
  if (busiestDay.count > 0) insights.push(`Hari paling sibuk: ${busiestDay.day} (${busiestDay.count} kelas)`)
  if (weekEvents.length > 0) insights.push(`${weekEvents.length} event minggu ini`)

  const cardCols = isMobile ? '1fr' : isDesktop ? '1fr 1fr 1fr 1fr' : '1fr 1fr'
  const panelCols = isMobile ? '1fr' : isDesktop ? '2fr 1fr 1fr' : '1fr 1fr'

  return (
    <div style={{ maxWidth: '1280px', width: '100%' }} className="fade-up page-enter">

      {/* ── Greeting header ── */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>{greet}</h1>
          <p style={s.date}>
            {today.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p style={s.quote}>{quote}</p>
        </div>
      </div>

      {/* ── Stat strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? '10px' : '14px', marginBottom: '28px' }}>
        {[
          { label: 'Event Hari Ini',  value: todayEvents.length,        color: '#2d3b2e', bg: '#e8eee9' },
          { label: 'Jadwal Hari Ini', value: todaySchedule.length,      color: '#253026', bg: '#d6e2d8' },
          { label: 'Tugas Pending',   value: pendingAssignments.length, color: '#1c251d', bg: '#c4d6c7' },
          { label: 'Tugas Mendesak',  value: urgentAssignments.length,  color: urgentAssignments.length > 0 ? 'var(--danger)' : '#141a14', bg: urgentAssignments.length > 0 ? 'rgba(208,92,92,0.12)' : '#b3cbb6' },
        ].map(st => (
          <div key={st.label} style={{ ...s.statCard, background: st.bg, border: 'none' }} className="stat-in">
            <div style={{ ...s.statNum, color: st.color }}>{st.value}</div>
            <div style={{ ...s.statLbl, color: st.color, opacity: 0.75 }}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: cardCols, gap: '20px', alignItems: 'stretch' }}>

        {/* Events */}
        <div className="card" style={s.card}>
          <div style={s.cardHead}>
            <div>
              <div style={s.cardTitle}>Event Hari Ini</div>
              <div style={s.cardSub}>{todayEvents.length} event terjadwal</div>
            </div>
            <span className="badge" style={s.badgeBlue}>{todayEvents.length}</span>
          </div>
          {todayEvents.length === 0 ? (
            <div style={s.empty}>
              <div style={{ ...s.emptyIcon, color: 'var(--primary)' }}>
                <svg className="icon-lg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <p style={s.emptyTitle}>Tidak ada event hari ini</p>
              <p style={s.emptyHint}>Tambah event di halaman Kalender</p>
            </div>
          ) : todayEvents.map(ev => (
            <div key={ev.id} style={s.row}>
              <div style={{ ...s.rowAccent, background: 'var(--primary)' }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={s.rowTitle}>{ev.title}</div>
                <div style={s.rowSub}>{ev.startTime} – {ev.endTime}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Schedule */}
        <div className="card" style={s.card}>
          <div style={s.cardHead}>
            <div>
              <div style={s.cardTitle}>Jadwal {todayName}</div>
              <div style={s.cardSub}>{todaySchedule.length} kelas hari ini</div>
            </div>
            <span className="badge" style={s.badgeGreen}>{todaySchedule.length}</span>
          </div>
          {todaySchedule.length === 0 ? (
            <div style={s.empty}>
              <div style={{ ...s.emptyIcon, color: 'var(--success)' }}>
                 <svg className="icon-lg" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              </div>
              <p style={s.emptyTitle}>Tidak ada kelas hari ini</p>
              <p style={s.emptyHint}>Atur jadwal di halaman Jadwal</p>
            </div>
          ) : todaySchedule.map(sc => (
            <div key={sc.id} style={s.row}>
              <div style={{ ...s.rowAccent, background: 'var(--success)' }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={s.rowTitle}>{sc.subject}</div>
                <div style={s.rowSub}>{sc.startTime} – {sc.endTime} · {sc.location}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tugas — uses assignments, synced with all other cards */}
        <div className="card" style={s.card}>
          <div style={s.cardHead}>
            <div>
              <div style={s.cardTitle}>Tugas</div>
              <div style={s.cardSub}>{pendingAssignments.length} belum selesai</div>
            </div>
            <span className="badge" style={pendingAssignments.length > 0 ? s.badgeYellow : s.badgeGreen}>
              {assignments.filter(a => a.done).length}/{assignments.length}
            </span>
          </div>
          {assignments.length === 0 ? (
            <div style={s.empty}>
              <div style={{ ...s.emptyIcon, color: 'var(--accent)' }}>
                 <svg className="icon-lg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <p style={s.emptyTitle}>Belum ada tugas</p>
              <p style={s.emptyHint}>Tambah di halaman Tugas atau FlowBot</p>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {assignments.map(a => (
                  <div key={a.id} style={s.taskRow} onClick={() => toggleAssignment(a.id)}>
                    <div style={{ ...s.check, ...(a.done ? s.checkDone : {}) }}>
                      {a.done && <span style={{ fontSize: '10px', color: '#fff', lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ ...s.taskText, ...(a.done ? s.taskDone : {}) }}>{a.title}</span>
                  </div>
                ))}
              </div>
              <div style={s.progress}>
                <div style={s.progressTrack}>
                  <div style={{ ...s.progressFill, width: `${assignments.length > 0 ? Math.round((assignments.filter(a=>a.done).length/assignments.length)*100) : 0}%` }} />
                </div>
                <span style={s.progressLbl}>{assignments.length > 0 ? Math.round((assignments.filter(a=>a.done).length/assignments.length)*100) : 0}%</span>
              </div>
            </>
          )}
        </div>

        {/* Assignments Priority */}
        <div className="card" style={s.card}>
          <div style={s.cardHead}>
            <div>
              <div style={s.cardTitle}>Prioritas Tugas</div>
              <div style={s.cardSub}>{pendingAssignments.length} tugas belum selesai</div>
            </div>
            {urgentAssignments.length > 0 && (
              <span className="badge" style={{ background: 'var(--surface2)', color: 'var(--danger)', border: '1px solid var(--border)' }}>
                {urgentAssignments.length} mendesak
              </span>
            )}
          </div>
          {priorityAssignments.length === 0 ? (
            <div style={s.empty}>
              <div style={{ ...s.emptyIcon, color: 'var(--success)' }}>
                 <svg className="icon-lg" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <p style={s.emptyTitle}>Tidak ada tugas pending</p>
              <p style={s.emptyHint}>Tambah tugas di halaman Tugas</p>
            </div>
          ) : priorityAssignments.map((a, i) => {
            const today2 = new Date(); today2.setHours(0,0,0,0)
            const dl = a.deadline ? new Date(a.deadline) : null
            const daysLeft = dl ? Math.round((dl - today2) / 86400000) : null
            const isUrgent = daysLeft !== null && daysLeft <= 3
            return (
              <div key={a.id} style={{ ...s.row, cursor: 'pointer' }} onClick={() => toggleAssignment(a.id)}>
                <div style={{ ...s.rowAccent, background: DIFF_COLOR[a.difficulty] || 'var(--primary)' }} />
                <div style={{ ...s.check, ...(a.done ? s.checkDone : {}), flexShrink: 0 }}>
                  {a.done && <span style={{ fontSize: '10px', color: '#fff', lineHeight: 1 }}>✓</span>}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ ...s.rowTitle, ...(a.done ? s.taskDone : {}) }}>{a.title}</div>
                  <div style={s.rowSub}>
                    {a.subject && `${a.subject} · `}
                    {a.deadline && (
                      <span style={{ color: isUrgent ? '#F87171' : 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg className="icon-sm" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        {daysLeft === 0 ? 'Hari ini!' : daysLeft < 0 ? 'Terlambat!' : `${daysLeft} hari lagi`}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: '10px', color: DIFF_COLOR[a.difficulty], background: 'var(--surface2)', padding: '2px 6px', borderRadius: '99px', flexShrink: 0 }}>
                  {a.difficulty}
                </span>
              </div>
            )
          })}
          {pendingAssignments.length > 3 && (
            <p style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'center', marginTop: '8px' }}>
              +{pendingAssignments.length - 3} tugas lainnya
            </p>
          )}
        </div>

      </div>

      {/* ── Productivity Panel ── */}
      <div style={s.panelSection}>
        <div style={s.panelLabel}>Produktivitas</div>
        <div style={{ display: 'grid', gridTemplateColumns: panelCols, gap: '20px', alignItems: 'start' }}>

          {/* Today Focus — shows top priority assignments, toggleable */}
          <div className="card" style={s.focusCard}>
            <div style={s.cardHead}>
              <div>
                <div style={s.focusTitle}>Fokus Hari Ini</div>
                <div style={s.cardSub}>Prioritas tugas teratas</div>
              </div>
              {priorityAssignments.length > 0 && (
                <span className="badge" style={s.badgeYellow}>{priorityAssignments.length}</span>
              )}
            </div>
            {priorityAssignments.length === 0 ? (
              <div style={s.empty}>
                <div style={{ ...s.emptyIcon, color: 'var(--text3)' }}>
                  <svg className="icon-lg" viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
                </div>
                <p style={s.emptyTitle}>Tidak ada tugas pending</p>
                <p style={s.emptyHint}>Tambah tugas di halaman Tugas</p>
              </div>
            ) : priorityAssignments.map((a, i) => {
              const today2 = new Date(); today2.setHours(0,0,0,0)
              const dl = a.deadline ? new Date(a.deadline) : null; if(dl) dl.setHours(0,0,0,0)
              const daysLeft = dl ? Math.round((dl - today2) / 86400000) : null
              const isUrgent = daysLeft !== null && daysLeft <= 3
              return (
                <div key={a.id} style={s.focusRow} onClick={() => toggleAssignment(a.id)}>
                  <div style={s.focusNum}>{i + 1}</div>
                  <div style={{ ...s.check, ...(a.done ? s.checkDone : {}) }}>
                    {a.done && <span style={{ fontSize: '10px', color: '#fff', lineHeight: 1 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...s.taskText, ...(a.done ? s.taskDone : {}), fontSize: '13px' }}>{a.title}</div>
                    {a.deadline && (
                      <div style={{ fontSize: '11px', color: isUrgent ? '#F87171' : 'var(--text3)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg className="icon-sm" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        {daysLeft === 0 ? 'Hari ini!' : daysLeft < 0 ? 'Terlambat!' : `${daysLeft} hari lagi`}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '10px', color: DIFF_COLOR[a.difficulty], background: 'var(--surface)', padding: '2px 6px', borderRadius: '99px', flexShrink: 0, border: '1px solid var(--border)' }}>
                    {a.difficulty?.split(' ')[0]}
                  </span>
                </div>
              )
            })}
            {pendingAssignments.length > 3 && (
              <p style={s.focusMore}>+{pendingAssignments.length - 3} tugas lainnya</p>
            )}
          </div>

          {/* Weekly Overview */}
          <div className="card" style={s.card}>
            <div style={s.cardHead}>
              <div>
                <div style={s.cardTitle}>Ringkasan Minggu</div>
                <div style={s.cardSub}>Senin – Minggu ini</div>
              </div>
            </div>
            <div style={s.weekGrid}>
              <div style={s.weekStat}>
                <div style={{ ...s.weekNum, color: 'var(--primary)' }}>{weekTotal}</div>
                <div style={s.weekLbl}>Total Tugas</div>
              </div>
              <div style={s.weekStat}>
                <div style={{ ...s.weekNum, color: 'var(--success)' }}>{weekDone}</div>
                <div style={s.weekLbl}>Selesai</div>
              </div>
              <div style={s.weekStat}>
                <div style={{ ...s.weekNum, color: 'var(--accent)' }}>{weekEvents.length}</div>
                <div style={s.weekLbl}>Event</div>
              </div>
            </div>
            <div style={{ marginTop: '14px' }}>
              <div style={s.weekBarLabel}>
                <span style={s.weekBarText}>Penyelesaian tugas</span>
                <span style={{ ...s.weekBarText, fontWeight: '700', color: 'var(--text)' }}>{weekPct}%</span>
              </div>
              <div style={s.progressTrack}>
                <div style={{ ...s.progressFill, width: `${weekPct}%`, background: weekPct >= 80 ? 'var(--success)' : weekPct >= 40 ? 'var(--primary)' : 'var(--accent)' }} />
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="card" style={{ ...s.card, opacity: insights.length === 0 ? 0.6 : 1 }}>
            <div style={s.cardHead}>
              <div>
                <div style={s.cardTitle}>Insight</div>
                <div style={s.cardSub}>Berdasarkan aktivitasmu</div>
              </div>
            </div>
            {insights.length === 0 ? (
              <div style={s.empty}>
                <p style={s.emptyTitle}>Belum ada data</p>
                <p style={s.emptyHint}>Tambah tugas dan event untuk melihat insight</p>
              </div>
            ) : insights.map((ins, i) => (
              <div key={i} style={s.insightRow}>
                <div style={s.insightDot} />
                <span style={s.insightText}>{ins}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  )
}

const s = {
  header: { marginBottom: '32px' },
  title: { fontSize: '32px', color: 'var(--text)', marginBottom: '6px' },
  date: { fontSize: '13px', color: 'var(--text3)', marginBottom: '4px', fontWeight: '500', letterSpacing: '0.2px' },
  quote: { fontSize: '13px', color: 'var(--text2)', fontStyle: 'italic' },

  statCard: {
    padding: '20px 22px', borderRadius: '16px',
    border: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: '8px',
    background: 'var(--surface)',
    boxShadow: 'var(--shadow)',
  },
  statNum: { fontSize: '36px', fontFamily: "'DM Serif Display', serif", lineHeight: 1 },
  statLbl: { fontSize: '12px', color: 'var(--text3)', fontWeight: '500', letterSpacing: '0.2px' },

  card: { padding: '22px', display: 'flex', flexDirection: 'column' },
  cardHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '8px' },
  cardTitle: { fontSize: '15px', fontWeight: '600', color: 'var(--text)', lineHeight: 1.3 },
  cardSub: { fontSize: '12px', color: 'var(--text3)', marginTop: '2px' },

  badgeBlue:   { background: 'rgba(224,125,60,0.12)', color: 'var(--info)',    border: 'none', fontSize: '12px' },
  badgeGreen:  { background: 'rgba(93,184,112,0.15)', color: 'var(--success)', border: 'none', fontSize: '12px' },
  badgeYellow: { background: 'rgba(232,184,75,0.18)', color: '#b8860b',        border: 'none', fontSize: '12px' },

  empty: { textAlign: 'center', padding: '24px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  emptyIcon: { fontSize: '28px', marginBottom: '2px' },
  emptyTitle: { fontSize: '13px', fontWeight: '600', color: 'var(--text2)' },
  emptyHint: { fontSize: '12px', color: 'var(--text3)' },

  row: { display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px', padding: '10px 12px', borderRadius: '10px', background: 'var(--surface2)' },
  rowAccent: { width: '3px', minHeight: '32px', borderRadius: '2px', flexShrink: 0, alignSelf: 'stretch' },
  rowTitle: { fontSize: '13px', fontWeight: '600', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowSub: { fontSize: '11px', color: 'var(--text3)', marginTop: '2px' },

  taskRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', cursor: 'pointer', padding: '8px', borderRadius: '8px' },
  check: { width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' },
  checkDone: { background: 'var(--success)', border: '1.5px solid var(--success)' },
  taskText: { fontSize: '13px', color: 'var(--text)', flex: 1, lineHeight: 1.4 },
  taskDone: { textDecoration: 'line-through', color: 'var(--text3)' },

  progress: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' },
  progressTrack: { flex: 1, height: '4px', borderRadius: '99px', background: 'var(--border)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '99px', background: 'var(--success)', transition: 'width 0.6s ease' },
  progressLbl: { fontSize: '12px', fontWeight: '600', color: 'var(--text2)', flexShrink: 0, minWidth: '30px', textAlign: 'right' },

  panelSection: { marginTop: '36px' },
  panelLabel: { fontSize: '10px', fontWeight: '700', color: 'var(--text3)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '14px' },

  focusCard: { padding: '22px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' },
  focusTitle: { fontSize: '15px', fontWeight: '600', color: 'var(--text)' },
  focusRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', cursor: 'pointer', padding: '10px 12px', borderRadius: '10px', background: 'var(--surface2)' },
  focusNum: { width: '24px', height: '24px', borderRadius: '50%', background: 'var(--surface)', color: 'var(--text3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0 },
  focusMore: { fontSize: '12px', color: 'var(--text3)', marginTop: '6px', textAlign: 'center' },

  weekGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '4px' },
  weekStat: { textAlign: 'center', padding: '12px 6px', borderRadius: '10px', background: 'var(--surface2)' },
  weekNum: { fontSize: '26px', fontFamily: "'DM Serif Display', serif", lineHeight: 1 },
  weekLbl: { fontSize: '11px', color: 'var(--text3)', marginTop: '3px' },
  weekBarLabel: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  weekBarText: { fontSize: '12px', color: 'var(--text2)' },

  insightRow: { display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' },
  insightDot: { width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', marginTop: '6px', flexShrink: 0 },
  insightText: { fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 },
}
