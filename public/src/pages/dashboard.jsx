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
  if (h < 12) return 'Selamat pagi'
  if (h < 18) return 'Selamat siang'
  return 'Selamat malam'
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

export default function Dashboard({ events, tasks, setTasks, schedule }) {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isDesktop = bp === 'desktop'

  const [greet, setGreet] = useState(getGreeting)
  useEffect(() => {
    const t = setInterval(() => setGreet(getGreeting()), 60_000)
    return () => clearInterval(t)
  }, [])

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const todayName = DAYS_ID[today.getDay()]

  const todayEvents   = events.filter(e => e.date === todayStr)
  const todaySchedule = schedule.filter(s => s.day === todayName)
  const pendingTasks  = tasks.filter(t => !t.done)
  const doneTasks     = tasks.filter(t => t.done)
  const taskPct       = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0
  const toggle = (id) => setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t))
  const quote = QUOTES[today.getDay() % QUOTES.length]

  // ── Weekly stats ──────────────────────────────────────────────────────────
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
  if (weekDone > 0) insights.push(`Kamu menyelesaikan ${weekDone} tugas minggu ini 🎉`)
  if (busiestDay.count > 0) insights.push(`Hari paling sibuk: ${busiestDay.day} (${busiestDay.count} kelas)`)
  if (weekEvents.length > 0) insights.push(`${weekEvents.length} event minggu ini`)

  const cardCols = isMobile ? '1fr' : isDesktop ? '1fr 1fr 1fr' : '1fr 1fr'
  const panelCols = isMobile ? '1fr' : isDesktop ? '2fr 1fr 1fr' : '1fr 1fr'

  return (
    <div style={{ maxWidth: '1280px', width: '100%' }} className="fade-up">

      {/* ── Greeting header ── */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>{greet} 🍵</h1>
          <p style={s.date}>
            {today.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p style={s.quote}>💡 {quote}</p>
        </div>
      </div>

      {/* ── Stat strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Event Hari Ini',  value: todayEvents.length,   color: 'var(--primary)',  bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)' },
          { label: 'Jadwal Hari Ini', value: todaySchedule.length, color: 'var(--success)',  bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)' },
          { label: 'Tugas Pending',   value: pendingTasks.length,  color: pendingTasks.length > 0 ? 'var(--accent)' : 'var(--success)', bg: pendingTasks.length > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)', border: pendingTasks.length > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(34,197,94,0.2)' },
        ].map(st => (
          <div key={st.label} style={{ ...s.statCard, background: st.bg }}>
            <div style={{ ...s.statNum, color: st.color }}>{st.value}</div>
            <div style={s.statLbl}>{st.label}</div>
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
              <div style={s.emptyIcon}>🌿</div>
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
              <div style={s.emptyIcon}>📚</div>
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

        {/* Tasks */}
        <div className="card" style={s.card}>
          <div style={s.cardHead}>
            <div>
              <div style={s.cardTitle}>Tugas</div>
              <div style={s.cardSub}>{pendingTasks.length} belum selesai</div>
            </div>
            <span className="badge" style={pendingTasks.length > 0 ? s.badgeYellow : s.badgeGreen}>
              {doneTasks.length}/{tasks.length}
            </span>
          </div>
          {tasks.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>🌱</div>
              <p style={s.emptyTitle}>Belum ada tugas</p>
              <p style={s.emptyHint}>Ketik "tambah tugas" di FlowBot</p>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {tasks.map(t => (
                  <div key={t.id} style={s.taskRow} onClick={() => toggle(t.id)}>
                    <div style={{ ...s.check, ...(t.done ? s.checkDone : {}) }}>
                      {t.done && <span style={{ fontSize: '10px', color: '#fff', lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ ...s.taskText, ...(t.done ? s.taskDone : {}) }}>{t.title}</span>
                  </div>
                ))}
              </div>
              <div style={s.progress}>
                <div style={s.progressTrack}>
                  <div style={{ ...s.progressFill, width: `${taskPct}%` }} />
                </div>
                <span style={s.progressLbl}>{taskPct}%</span>
              </div>
            </>
          )}
        </div>

      </div>

      {/* ── Productivity Panel ── */}
      <div style={s.panelSection}>
        <div style={s.panelLabel}>Produktivitas</div>
        <div style={{ display: 'grid', gridTemplateColumns: panelCols, gap: '20px', alignItems: 'start' }}>

          {/* Today Focus — most prominent */}
          <div className="card" style={s.focusCard}>
            <div style={s.cardHead}>
              <div>
                <div style={s.focusTitle}>🎯 Fokus Hari Ini</div>
                <div style={s.cardSub}>3 tugas prioritas</div>
              </div>
              {focusTasks.length > 0 && (
                <span className="badge" style={s.badgeYellow}>{focusTasks.length}</span>
              )}
            </div>
            {focusTasks.length === 0 ? (
              <div style={s.empty}>
                <div style={s.emptyIcon}>☕</div>
                <p style={s.emptyTitle}>Belum ada tugas hari ini</p>
                <p style={s.emptyHint}>Tambah tugas lewat FlowBot untuk mulai fokus</p>
              </div>
            ) : focusTasks.map((t, i) => (
              <div key={t.id} style={s.focusRow} onClick={() => toggle(t.id)}>
                <div style={s.focusNum}>{i + 1}</div>
                <div style={{ ...s.check, ...(t.done ? s.checkDone : {}) }}>
                  {t.done && <span style={{ fontSize: '10px', color: '#fff', lineHeight: 1 }}>✓</span>}
                </div>
                <span style={{ ...s.taskText, ...(t.done ? s.taskDone : {}) }}>{t.title}</span>
              </div>
            ))}
            {pendingTasks.length > 3 && (
              <p style={s.focusMore}>+{pendingTasks.length - 3} tugas lainnya</p>
            )}
          </div>

          {/* Weekly Overview */}
          <div className="card" style={s.card}>
            <div style={s.cardHead}>
              <div>
                <div style={s.cardTitle}>📊 Ringkasan Minggu</div>
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
                <div style={s.cardTitle}>💡 Insight</div>
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
  header: { marginBottom: '28px' },
  title: { fontSize: '26px', fontWeight: '800', color: 'var(--text)', marginBottom: '4px', letterSpacing: '-0.3px' },
  date: { fontSize: '14px', color: 'var(--text2)', marginBottom: '6px' },
  quote: { fontSize: '13px', color: 'var(--text3)', fontStyle: 'italic' },

  statCard: {
    padding: '24px', borderRadius: '24px',
    border: 'none', display: 'flex', flexDirection: 'column', gap: '8px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
  },
  statNum: { fontSize: '32px', fontWeight: '800', lineHeight: 1 },
  statLbl: { fontSize: '13px', color: 'var(--text2)', fontWeight: '500' },

  card: { padding: '20px', display: 'flex', flexDirection: 'column' },
  cardHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '8px' },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: 'var(--text)', lineHeight: 1.3 },
  cardSub: { fontSize: '12px', color: 'var(--text3)', marginTop: '2px' },

  badgeBlue:   { background: 'rgba(59,130,246,0.12)',  color: '#60A5FA', border: '1px solid rgba(59,130,246,0.2)' },
  badgeGreen:  { background: 'rgba(34,197,94,0.12)',   color: '#4ADE80', border: '1px solid rgba(34,197,94,0.2)' },
  badgeYellow: { background: 'rgba(245,158,11,0.12)',  color: '#FBBF24', border: '1px solid rgba(245,158,11,0.25)' },

  empty: { textAlign: 'center', padding: '20px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  emptyIcon: { fontSize: '30px', marginBottom: '2px' },
  emptyTitle: { fontSize: '14px', fontWeight: '500', color: 'var(--text2)' },
  emptyHint: { fontSize: '12px', color: 'var(--text3)' },

  row: { display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px', padding: '10px 12px', borderRadius: '8px', background: 'var(--surface2)' },
  rowAccent: { width: '3px', height: '100%', minHeight: '32px', borderRadius: '2px', flexShrink: 0, alignSelf: 'stretch' },
  rowTitle: { fontSize: '14px', fontWeight: '600', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowSub: { fontSize: '12px', color: 'var(--text2)', marginTop: '2px' },

  taskRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', cursor: 'pointer', padding: '8px 8px', borderRadius: '12px', transition: 'background 0.2s cubic-bezier(0.2,0.8,0.2,1)' },
  check: { width: '22px', height: '22px', borderRadius: '50%', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.25s cubic-bezier(0.2,0.8,0.2,1)' },
  checkDone: { background: 'var(--success)', border: '2px solid var(--success)' },
  taskText: { fontSize: '14px', color: 'var(--text)', flex: 1, lineHeight: 1.4 },
  taskDone: { textDecoration: 'line-through', color: 'var(--text3)' },

  progress: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' },
  progressTrack: { flex: 1, height: '5px', borderRadius: '99px', background: 'var(--border)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '99px', background: 'var(--success)', transition: 'width 0.6s ease' },
  progressLbl: { fontSize: '13px', fontWeight: '600', color: 'var(--text2)', flexShrink: 0, minWidth: '32px', textAlign: 'right' },

  // ── Productivity Panel ──────────────────────────────────────────────────
  panelSection: { marginTop: '32px' },
  panelLabel: {
    fontSize: '11px', fontWeight: '700', color: 'var(--text3)',
    letterSpacing: '0.8px', textTransform: 'uppercase',
    marginBottom: '14px',
  },

  // Today Focus
  focusCard: {
    padding: '22px',
    display: 'flex', flexDirection: 'column',
    border: '1px solid rgba(59,130,246,0.25)',
    boxShadow: '0 0 0 1px rgba(59,130,246,0.08), var(--shadow)',
  },
  focusTitle: { fontSize: '16px', fontWeight: '700', color: 'var(--text)' },
  focusRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '10px', cursor: 'pointer',
    padding: '10px 12px', borderRadius: '8px',
    background: 'var(--surface2)',
    transition: 'background 0.12s',
  },
  focusNum: {
    width: '28px', height: '28px', borderRadius: '50%',
    background: 'rgba(113,131,85,0.15)', color: 'var(--primary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: '800', flexShrink: 0,
  },
  focusMore: { fontSize: '12px', color: 'var(--text3)', marginTop: '6px', textAlign: 'center' },

  // Weekly Overview
  weekGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '4px' },
  weekStat: { textAlign: 'center', padding: '10px 6px', borderRadius: '8px', background: 'var(--surface2)' },
  weekNum: { fontSize: '24px', fontWeight: '800', lineHeight: 1 },
  weekLbl: { fontSize: '11px', color: 'var(--text3)', marginTop: '3px' },
  weekBarLabel: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  weekBarText: { fontSize: '12px', color: 'var(--text2)' },

  // Insights
  insightRow: { display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' },
  insightDot: { width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)', marginTop: '6px', flexShrink: 0 },
  insightText: { fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 },
}
