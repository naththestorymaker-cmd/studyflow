import { useState } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint.js'
import Modal from './Modal.jsx'

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const DAYS   = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]} ${y}`
}

// Modal detail event (read-only, dengan tombol edit & hapus)
function EventDetailModal({ event, onClose, onEdit, onDelete }) {
  return (
    <Modal onClose={onClose}>
        <h3 style={s.modalTitle}>Detail Event</h3>

        <div style={s.detailRow}>
          <span style={s.detailIcon}><svg className="icon-sm" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></span>
          <div>
            <div style={s.detailLabel}>Judul</div>
            <div style={s.detailValue}>{event.title}</div>
          </div>
        </div>

        <div style={s.detailRow}>
          <span style={s.detailIcon}><svg className="icon-sm" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></span>
          <div>
            <div style={s.detailLabel}>Tanggal</div>
            <div style={s.detailValue}>{formatDate(event.date)}</div>
          </div>
        </div>

        {(event.startTime || event.endTime) && (
          <div style={s.detailRow}>
            <span style={s.detailIcon}><svg className="icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></span>
            <div>
              <div style={s.detailLabel}>Waktu</div>
              <div style={s.detailValue}>
                {event.startTime || '—'}{event.endTime ? ` – ${event.endTime}` : ''}
              </div>
            </div>
          </div>
        )}

        {event.description && (
          <div style={s.detailRow}>
            <span style={s.detailIcon}><svg className="icon-sm" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></span>
            <div>
              <div style={s.detailLabel}>Deskripsi</div>
              <div style={{ ...s.detailValue, whiteSpace: 'pre-wrap' }}>{event.description}</div>
            </div>
          </div>
        )}

        <div style={s.modalActions}>
          <button className="btn-hover" style={s.btnDel} onClick={() => onDelete(event.id)}>Hapus</button>
          <button className="btn-hover" style={s.btnCancel} onClick={onClose}>Tutup</button>
          <button className="btn-hover" style={s.btnSave} onClick={() => onEdit(event)}>Edit</button>
        </div>
    </Modal>
  )
}

// Modal form tambah/edit event
function EventModal({ event, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(event || { title: '', date: '', startTime: '', endTime: '', description: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const isEdit = !!event?.id

  return (
    <Modal onClose={onClose}>
        <h3 style={s.modalTitle}>{isEdit ? 'Edit Event' : 'Tambah Event'}</h3>

        {/* Tanggal — tampil sebagai teks jika sudah ada konteks tanggal (bukan edit) */}
        <div style={s.field}>
          <label style={s.label}>Tanggal</label>
          {form.date && !isEdit
            ? <div style={s.dateDisplay}>{formatDate(form.date)}</div>
            : <input className="sf-input" type="date" value={form.date}
                onChange={e => set('date', e.target.value)} />
          }
        </div>

        {[
          { label: 'Judul', key: 'title', type: 'text', placeholder: 'Nama event' },
          { label: 'Jam Mulai', key: 'startTime', type: 'time' },
          { label: 'Jam Selesai', key: 'endTime', type: 'time' },
        ].map(f => (
          <div key={f.key} style={s.field}>
            <label style={s.label}>{f.label}</label>
            <input className="sf-input" type={f.type} value={form[f.key]}
              placeholder={f.placeholder || ''}
              onChange={e => set(f.key, e.target.value)} />
          </div>
        ))}

        <div style={s.field}>
          <label style={s.label}>Deskripsi</label>
          <textarea className="sf-input" style={{ height: '76px', resize: 'none' }}
            value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Opsional" />
        </div>

        <div style={s.modalActions}>
          {isEdit && <button className="btn-hover" style={s.btnDel} onClick={() => onDelete(event.id)}>Hapus</button>}
          <button className="btn-hover" style={s.btnCancel} onClick={onClose}>Batal</button>
          <button className="btn-hover" style={s.btnSave}
            onClick={() => { if (form.title && form.date) onSave(form) }}>Simpan</button>
        </div>
    </Modal>
  )
}

export default function Calendar({ events, setEvents, onModalChange }) {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const today = new Date()

  const [cur, setCur] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [weekOffset, setWeekOffset] = useState(0) // offset minggu dari minggu ini
  const [view, setView] = useState('monthly')
  const [modal, setModal] = useState(null)       // null | {} (tambah) | event (edit form)
  const [detail, setDetail] = useState(null)     // event untuk detail view

  // Beritahu App saat modal terbuka/tutup agar FAB chatbot disembunyikan
  const openModal   = (v) => { setModal(v);    onModalChange?.(true)  }
  const closeModal  = ()  => { setModal(null); onModalChange?.(false) }
  const openDetail  = (v) => { setDetail(v);   onModalChange?.(true)  }
  const closeDetail = ()  => { setDetail(null); onModalChange?.(false) }

  const firstDay    = new Date(cur.year, cur.month, 1).getDay()
  const daysInMonth = new Date(cur.year, cur.month + 1, 0).getDate()

  const eventsForDate = (d) => {
    const ds = `${cur.year}-${String(cur.month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    return events.filter(e => e.date === ds)
  }

  const save = (form) => {
    setEvents(prev => form.id ? prev.map(e => e.id === form.id ? form : e) : [...prev, { ...form, id: Date.now().toString() }])
    closeModal()
  }
  const del = (id) => { setEvents(prev => prev.filter(e => e.id !== id)); closeModal(); closeDetail() }

  const prevMonth = () => setCur(c => c.month === 0  ? { year: c.year-1, month: 11 } : { ...c, month: c.month-1 })
  const nextMonth = () => setCur(c => c.month === 11 ? { year: c.year+1, month: 0  } : { ...c, month: c.month+1 })

  // Hitung tanggal-tanggal dalam minggu berdasarkan weekOffset
  // Format tanggal lokal tanpa timezone shift
  const toLocalDateStr = (dt) => {
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    const d = String(dt.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const weekDates = () => {
    const d = new Date(today)
    const day = d.getDay()
    // Mulai dari Minggu minggu ini, lalu geser sesuai offset
    d.setDate(d.getDate() - day + weekOffset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(d)
      dt.setDate(d.getDate() + i)
      return dt
    })
  }

  const currentWeekDates = weekDates()
  const weekStart = currentWeekDates[0]
  const weekEnd   = currentWeekDates[6]

  const weekLabel = () => {
    const sameMonth = weekStart.getMonth() === weekEnd.getMonth() && weekStart.getFullYear() === weekEnd.getFullYear()
    if (sameMonth) {
      return `${weekStart.getDate()} – ${weekEnd.getDate()} ${MONTHS[weekStart.getMonth()]} ${weekStart.getFullYear()}`
    }
    const sameYear = weekStart.getFullYear() === weekEnd.getFullYear()
    if (sameYear) {
      return `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()]} ${weekStart.getFullYear()}`
    }
    return `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]} ${weekStart.getFullYear()} – ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`
  }

  return (
    <div style={{ maxWidth: '1280px', width: '100%' }} className="page-enter">
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}>Kalender</h1>
        <div style={s.controls}>
          <div style={s.viewToggle}>
            {['monthly','weekly'].map(v => (
              <button key={v} className="btn-hover"
                style={{ ...s.viewBtn, ...(view === v ? s.viewBtnOn : {}) }}
                onClick={() => setView(v)}>
                {v === 'monthly' ? 'Bulanan' : 'Mingguan'}
              </button>
            ))}
          </div>
          <button className="btn-hover" style={s.addBtn} onClick={() => setModal({})}>+ Tambah</button>
        </div>
      </div>

      {/* Nav row — bulan untuk monthly, minggu untuk weekly */}
      <div style={s.navRow}>
        <button className="btn-hover" style={s.navBtn}
          onClick={view === 'monthly' ? prevMonth : () => setWeekOffset(o => o - 1)}>‹</button>
        <span style={s.monthLabel}>
          {view === 'monthly' ? `${MONTHS[cur.month]} ${cur.year}` : weekLabel()}
        </span>
        <button className="btn-hover" style={s.navBtn}
          onClick={view === 'monthly' ? nextMonth : () => setWeekOffset(o => o + 1)}>›</button>
        {view === 'weekly' && weekOffset !== 0 && (
          <button className="btn-hover" style={{ ...s.navBtn, fontSize: '11px', width: 'auto', padding: '0 10px' }}
            onClick={() => setWeekOffset(0)}>Minggu ini</button>
        )}
      </div>

      {/* Monthly grid */}
      {view === 'monthly' && (
        <div style={s.calGrid}>
          {DAYS.map(d => <div key={d} style={s.dayHdr}>{d}</div>)}
          {Array.from({ length: firstDay }, (_, i) => <div key={`g${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1
            const isToday = d === today.getDate() && cur.month === today.getMonth() && cur.year === today.getFullYear()
            const evs = eventsForDate(d)
            const dateStr = `${cur.year}-${String(cur.month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
            const MAX = 2
            return (
              <div key={d} className="card-hover"
                style={{ ...s.dayCell, ...(isToday ? s.todayCell : {}), minHeight: isMobile ? '48px' : '86px' }}
                onClick={() => {
                  if (evs.length === 1) openDetail(evs[0])
                  else if (evs.length > 1) openDetail({ _list: evs, date: dateStr })
                  else openModal({ date: dateStr })
                }}>
                <span style={{ ...s.dayNum, ...(isToday ? s.todayNum : {}) }}>{d}</span>

                {/* Maks 2 chip + "+N lainnya" di semua ukuran */}
                {evs.slice(0, MAX).map(ev => (
                  <div key={ev.id} style={s.chip}
                    onClick={e => { e.stopPropagation(); openDetail(ev) }}>
                    {ev.title}
                  </div>
                ))}
                {evs.length > MAX && (
                  <div style={s.more}
                    onClick={e => { e.stopPropagation(); openDetail({ _list: evs, date: dateStr }) }}>
                    +{evs.length - MAX} lainnya
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Weekly grid */}
      {view === 'weekly' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: isMobile ? '4px' : '6px' }}>
            {currentWeekDates.map((dt, i) => {
              const ds = toLocalDateStr(dt)
              const evs = events.filter(e => e.date === ds)
              const isToday = dt.toDateString() === today.toDateString()
              return (
                <div key={i}
                  style={{ ...s.weekCol, ...(isToday ? s.weekColToday : {}), minHeight: isMobile ? '64px' : '180px' }}>
                  {/* Header hari */}
                  <div style={s.weekHdr}>
                    <span style={s.weekDay}>{DAYS[dt.getDay()]}</span>
                    <span style={{ ...s.weekNum, ...(isToday ? s.todayNum : {}) }}>{dt.getDate()}</span>
                    {/* Tombol + hanya di desktop */}
                    {!isMobile && (
                      <button className="btn-hover" style={s.weekAddBtn} title="Tambah event"
                        onClick={() => openModal({ date: ds })}>+</button>
                    )}
                  </div>
                  {/* Daftar event */}
                  {(() => {
                    const MAX_WEEK = 3
                    return (
                      <>
                        {/* Desktop: maks 3 chip + "+N lainnya" */}
                        {!isMobile && evs.slice(0, MAX_WEEK).map(ev => (
                          <div key={ev.id} style={s.weekChip}
                            onClick={() => openDetail(ev)}
                            title={ev.title}>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                            {ev.startTime && <div style={{ fontSize: '10px', color: 'var(--primary)', opacity: 0.7, marginTop: '2px' }}>{ev.startTime}</div>}
                          </div>
                        ))}
                        {!isMobile && evs.length > MAX_WEEK && (
                          <div style={s.weekMore}
                            onClick={() => openDetail({ _list: evs, date: ds })}>
                            +{evs.length - MAX_WEEK} lainnya
                          </div>
                        )}

                        {/* Mobile: maks 3 dot, tap buka list jika >1, detail jika 1 */}
                        {isMobile && evs.length > 0 && (
                          <div style={s.dotRow}
                            onClick={e => {
                              e.stopPropagation()
                              evs.length === 1 ? openDetail(evs[0]) : openDetail({ _list: evs, date: ds })
                            }}>
                            {evs.slice(0, MAX_WEEK).map((_, idx) => <div key={idx} style={s.weekDot} />)}
                          </div>
                        )}
                      </>
                    )
                  })()}
                  {/* Mobile: tap area kosong untuk tambah event */}
                  {isMobile && (
                    <div style={s.weekTapAdd} onClick={() => openModal({ date: ds })} />
                  )}
                </div>
              )
            })}
          </div>

        </>
      )}

      {detail?._list && (
        <Modal onClose={closeDetail}>
            <h3 style={s.modalTitle}>Event – {formatDate(detail.date)}</h3>
            {detail._list.map(ev => (
              <div key={ev.id} style={s.listItem} onClick={() => openDetail(ev)}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{ev.title}</span>
                {ev.startTime && <span style={{ fontSize: '12px', color: 'var(--text3)', marginLeft: '8px' }}>{ev.startTime}</span>}
              </div>
            ))}
            <div style={{ ...s.modalActions, marginTop: '16px' }}>
              <button className="btn-hover" style={s.btnSave}
                onClick={() => { closeDetail(); openModal({ date: detail.date }) }}>+ Tambah</button>
              <button className="btn-hover" style={s.btnCancel} onClick={closeDetail}>Tutup</button>
            </div>
        </Modal>
      )}

      {detail && !detail._list && (
        <EventDetailModal
          event={detail}
          onClose={closeDetail}
          onEdit={(ev) => { closeDetail(); openModal(ev) }}
          onDelete={del}
        />
      )}

      {modal !== null && (
        <EventModal event={modal} onClose={closeModal} onSave={save} onDelete={del} />
      )}
    </div>
  )
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
  title: { fontSize: '20px', fontWeight: '700', color: 'var(--text)' },
  controls: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
  viewToggle: { display: 'flex', background: 'var(--surface2)', borderRadius: '99px', padding: '3px', gap: '2px' },
  viewBtn: { padding: '6px 14px', borderRadius: '99px', border: 'none', background: 'transparent', color: 'var(--text2)', fontSize: '13px', cursor: 'pointer' },
  viewBtnOn: { background: 'var(--primary)', color: '#fff', fontWeight: '600' },
  addBtn: { padding: '8px 18px', borderRadius: '99px', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  navRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' },
  navBtn: { width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: '14px', fontWeight: '600', color: 'var(--text)', minWidth: '140px', textAlign: 'center' },
  calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' },
  dayHdr: { textAlign: 'center', padding: '8px 4px', fontSize: '11px', color: 'var(--text3)', fontWeight: '600' },
  dayCell: { background: 'var(--surface)', borderRadius: '8px', padding: '7px', cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.15s', overflow: 'hidden' },
  todayCell: { border: '1px solid var(--primary)', background: 'rgba(59,130,246,0.08)' },
  dayNum: { fontSize: '12px', color: 'var(--text2)', display: 'block', marginBottom: '3px', fontWeight: '500' },
  todayNum: { color: 'var(--primary)', fontWeight: '700' },
  chip: { fontSize: '9px', background: 'rgba(113,131,85,0.15)', color: 'var(--primary)', borderRadius: '4px', padding: '2px 4px', marginBottom: '2px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', cursor: 'pointer' },
  more: { fontSize: '9px', color: 'var(--primary)', paddingLeft: '2px', cursor: 'pointer', textDecoration: 'underline' },
  dot: { width: '5px', height: '5px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 },
  dotRow: { display: 'flex', gap: '3px', justifyContent: 'center', marginTop: '4px', cursor: 'pointer' },
  weekCol: { background: 'var(--surface)', borderRadius: '10px', padding: '8px 4px', border: '1px solid var(--border)', transition: 'all 0.15s', overflow: 'hidden', position: 'relative' },
  weekColToday: { border: '1px solid var(--primary)', background: 'rgba(59,130,246,0.06)' },
  weekHdr: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '6px', gap: '1px' },
  weekDay: { fontSize: '10px', color: 'var(--text3)', fontWeight: '600' },
  weekNum: { fontSize: '17px', fontWeight: '700', color: 'var(--text)' },
  weekChip: { background: 'rgba(113,131,85,0.15)', borderRadius: '6px', padding: '4px 6px', marginBottom: '4px', cursor: 'pointer', overflow: 'hidden', border: '1px solid rgba(113,131,85,0.25)' },
  weekDot: { width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 },
  weekMore: { fontSize: '9px', color: 'var(--primary)', textAlign: 'center', cursor: 'pointer', textDecoration: 'underline', marginTop: '2px' },
  weekTapAdd: { position: 'absolute', inset: 0, top: '52px' },
  weekAddBtn: { width: '18px', height: '18px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text2)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1, padding: 0, marginTop: '2px' },
  // Modal
  modalTitle: { fontSize: '16px', fontWeight: '700', color: 'var(--text)', marginBottom: '16px' },
  field: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px', fontWeight: '500' },
  modalActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px', flexWrap: 'wrap' },
  btnSave: { padding: '10px 22px', borderRadius: '99px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  btnCancel: { padding: '10px 16px', borderRadius: '99px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: '13px', cursor: 'pointer' },
  btnDel: { padding: '10px 16px', borderRadius: '99px', border: '1px solid rgba(208,92,92,0.3)', background: 'rgba(208,92,92,0.08)', color: 'var(--danger)', fontSize: '13px', cursor: 'pointer', marginRight: 'auto' },
  dateDisplay: { fontSize: '14px', fontWeight: '600', color: 'var(--primary)', padding: '8px 0 4px', borderBottom: '1px solid var(--border)' },
  // Detail
  detailRow: { display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' },
  detailIcon: { fontSize: '16px', marginTop: '1px', flexShrink: 0 },
  detailLabel: { fontSize: '11px', color: 'var(--text3)', marginBottom: '2px', fontWeight: '500' },
  detailValue: { fontSize: '14px', color: 'var(--text)', fontWeight: '500' },
  listItem: { padding: '10px 12px', borderRadius: '8px', background: 'var(--surface2)', marginBottom: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' },
}
