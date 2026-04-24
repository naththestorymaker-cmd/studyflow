import { useState } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint.js'
import Modal from '../components/Modal.jsx'

const DIFFICULTY = ['Mudah', 'Sedang', 'Sulit', 'Sangat Sulit']
const DIFFICULTY_COLOR = {
  'Mudah':       { bg: 'rgba(93,184,112,0.12)',  color: '#3a9e50',  border: 'rgba(93,184,112,0.25)' },
  'Sedang':      { bg: 'rgba(224,125,60,0.12)',  color: '#c05e20',  border: 'rgba(224,125,60,0.25)' },
  'Sulit':       { bg: 'rgba(232,184,75,0.15)',  color: '#9a7010',  border: 'rgba(232,184,75,0.30)' },
  'Sangat Sulit':{ bg: 'rgba(208,92,92,0.12)',   color: '#b03030',  border: 'rgba(208,92,92,0.25)' },
}
const DIFF_RANK = { 'Mudah': 0, 'Sedang': 1, 'Sulit': 2, 'Sangat Sulit': 3 }

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

function formatDeadline(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${parseInt(d)} ${MONTHS[parseInt(m)-1]} ${y}`
}

function deadlineStatus(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0,0,0,0)
  const dl = new Date(dateStr); dl.setHours(0,0,0,0)
  const diff = Math.round((dl - today) / 86400000)
  if (diff < 0)  return { label: 'Terlambat',      color: '#F87171', bg: 'rgba(239,68,68,0.1)' }
  if (diff === 0) return { label: 'Hari ini!',      color: '#FBBF24', bg: 'rgba(245,158,11,0.1)' }
  if (diff <= 3)  return { label: `${diff} hari lagi`, color: '#FBBF24', bg: 'rgba(245,158,11,0.1)' }
  return { label: `${diff} hari lagi`, color: 'var(--text3)', bg: 'transparent' }
}

function AssignmentModal({ item, onClose, onSave, onDelete }) {
  const isEdit = !!item?.id
  const [form, setForm] = useState(item || {
    title: '', subject: '', deadline: '', difficulty: 'Sedang', description: '', done: false
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal onClose={onClose}>
        <h3 style={s.modalTitle}>{isEdit ? 'Edit Tugas' : 'Tambah Tugas'}</h3>

        <div style={s.field}>
          <label style={s.label}>Nama Tugas</label>
          <input className="sf-input" value={form.title} placeholder="Contoh: Laporan Fisika Bab 3"
            onChange={e => set('title', e.target.value)} />
        </div>

        <div style={s.field}>
          <label style={s.label}>Mata Pelajaran / Kelas</label>
          <input className="sf-input" value={form.subject} placeholder="Contoh: Fisika"
            onChange={e => set('subject', e.target.value)} />
        </div>

        <div style={s.field}>
          <label style={s.label}>Deadline</label>
          <input className="sf-input" type="date" value={form.deadline}
            onChange={e => set('deadline', e.target.value)} />
        </div>

        <div style={s.field}>
          <label style={s.label}>Tingkat Kesulitan</label>
          <select className="sf-input" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
            {DIFFICULTY.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div style={s.field}>
          <label style={s.label}>Deskripsi / Catatan</label>
          <textarea className="sf-input" style={{ height: '80px', resize: 'none' }}
            value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Detail tugas, referensi, atau catatan penting..." />
        </div>

        <div style={s.modalActions}>
          {isEdit && <button className="btn-hover" style={s.btnDel} onClick={() => onDelete(item.id)}>Hapus</button>}
          <button className="btn-hover" style={s.btnCancel} onClick={onClose}>Batal</button>
          <button className="btn-hover" style={s.btnSave}
            onClick={() => { if (form.title) onSave(form) }}>Simpan</button>
        </div>
    </Modal>
  )
}

function AssignmentDetailModal({ item, onClose, onEdit, onDelete, onToggle }) {
  const dc = DIFFICULTY_COLOR[item.difficulty] || DIFFICULTY_COLOR['Sedang']
  const status = deadlineStatus(item.deadline)
  return (
    <Modal onClose={onClose}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
          <h3 style={{ ...s.modalTitle, marginBottom: 0, flex: 1 }}>{item.title}</h3>
          <span style={{ ...s.diffTag, background: dc.bg, color: dc.color, border: `1px solid ${dc.border}` }}>
            {item.difficulty}
          </span>
        </div>

        {item.subject && (
          <div style={s.detailRow}>
            <span style={s.detailIcon}><svg className="icon-sm" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg></span>
            <div><div style={s.detailLabel}>Mata Pelajaran</div><div style={s.detailValue}>{item.subject}</div></div>
          </div>
        )}

        <div style={s.detailRow}>
          <span style={s.detailIcon}><svg className="icon-sm" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></span>
          <div>
            <div style={s.detailLabel}>Deadline</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={s.detailValue}>{formatDeadline(item.deadline)}</div>
              {status && <span style={{ fontSize: '11px', fontWeight: 600, color: status.color, background: status.bg, padding: '2px 8px', borderRadius: '99px' }}>{status.label}</span>}
            </div>
          </div>
        </div>

        {item.description && (
          <div style={s.detailRow}>
            <span style={s.detailIcon}><svg className="icon-sm" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></span>
            <div><div style={s.detailLabel}>Deskripsi</div><div style={{ ...s.detailValue, whiteSpace: 'pre-wrap', fontWeight: 400 }}>{item.description}</div></div>
          </div>
        )}

        <div style={s.detailRow}>
          <span style={s.detailIcon}>
            {item.done 
              ? <svg className="icon-sm" style={{color: 'var(--success)'}} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg> 
              : <svg className="icon-sm" style={{color: 'var(--accent)'}} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>}
          </span>
          <div><div style={s.detailLabel}>Status</div><div style={s.detailValue}>{item.done ? 'Selesai' : 'Belum selesai'}</div></div>
        </div>

        <div style={s.modalActions}>
          <button className="btn-hover" style={s.btnDel} onClick={() => onDelete(item.id)}>Hapus</button>
          <button className="btn-hover" style={s.btnCancel} onClick={onClose}>Tutup</button>
          <button className="btn-hover" style={{ ...s.btnSave, background: item.done ? 'var(--surface2)' : 'var(--success)', color: item.done ? 'var(--text2)' : '#fff' }}
            onClick={() => { onToggle(item.id); onClose() }}>
            {item.done ? 'Tandai Belum' : 'Tandai Selesai'}
          </button>
          <button className="btn-hover" style={s.btnSave} onClick={() => onEdit(item)}>Edit</button>
        </div>
    </Modal>
  )
}

export default function Assignments({ assignments, setAssignments, onModalChange }) {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'

  const [modal, setModal]   = useState(null)   // null=closed, {}=new, item=edit
  const [detail, setDetail] = useState(null)
  const [sort, setSort]     = useState('deadline-asc')  // deadline-asc|deadline-desc|diff-asc|diff-desc
  const [filter, setFilter] = useState('all')  // all|pending|done

  const openModal   = (v) => { setModal(v);    onModalChange?.(true)  }
  const closeModal  = ()  => { setModal(null); onModalChange?.(false) }
  const openDetail  = (v) => { setDetail(v);   onModalChange?.(true)  }
  const closeDetail = ()  => { setDetail(null); onModalChange?.(false) }

  const save = (form) => {
    setAssignments(prev =>
      form.id ? prev.map(a => a.id === form.id ? form : a)
              : [...prev, { ...form, id: Date.now().toString(), done: false }]
    )
    closeModal()
  }
  const del    = (id) => { setAssignments(prev => prev.filter(a => a.id !== id)); closeModal(); closeDetail() }
  const toggle = (id) => setAssignments(prev => prev.map(a => a.id === id ? { ...a, done: !a.done } : a))

  // Filter
  const filtered = assignments.filter(a => {
    if (filter === 'pending') return !a.done
    if (filter === 'done')    return a.done
    return true
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'deadline-asc')  return (a.deadline || '9999') < (b.deadline || '9999') ? -1 : 1
    if (sort === 'deadline-desc') return (a.deadline || '9999') > (b.deadline || '9999') ? -1 : 1
    if (sort === 'diff-asc')      return DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty]
    if (sort === 'diff-desc')     return DIFF_RANK[b.difficulty] - DIFF_RANK[a.difficulty]
    return 0
  })

  const pending = assignments.filter(a => !a.done).length
  const done    = assignments.filter(a => a.done).length

  const SORT_OPTIONS = [
    { value: 'deadline-asc',  label: 'Deadline Terdekat' },
    { value: 'deadline-desc', label: 'Deadline Terjauh' },
    { value: 'diff-asc',      label: 'Mudah ke Sulit' },
    { value: 'diff-desc',     label: 'Sulit ke Mudah' },
  ]

  return (
    <div style={{ maxWidth: '1280px', width: '100%' }} className="page-enter">
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Tugas</h1>
          <p style={s.sub}>{pending} belum selesai · {done} selesai</p>
        </div>
        <button className="btn-hover" style={s.addBtn} onClick={() => openModal({})}>+ Tambah Tugas</button>
      </div>

      {/* Controls */}
      <div style={s.controls}>
        {/* Filter tabs */}
        <div style={s.tabs}>
          {[['all','Semua'], ['pending','Belum'], ['done','Selesai']].map(([v, l]) => (
            <button key={v} className="btn-hover"
              style={{ ...s.tab, ...(filter === v ? s.tabOn : {}) }}
              onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>

        {/* Sort dropdown */}
        <select
          style={s.sortSelect}
          value={sort}
          onChange={e => setSort(e.target.value)}>
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}><svg className="icon-lg" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
          <p style={s.emptyTitle}>{filter === 'done' ? 'Belum ada tugas selesai' : 'Tidak ada tugas'}</p>
          <p style={s.emptyHint}>Klik "+ Tambah Tugas" untuk mulai</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sorted.map(a => {
            const dc = DIFFICULTY_COLOR[a.difficulty] || DIFFICULTY_COLOR['Sedang']
            const status = deadlineStatus(a.deadline)
            return (
              <div key={a.id} className="card-hover"
                style={{ ...s.card, ...(a.done ? s.cardDone : {}) }}
                onClick={() => openDetail(a)}>
                <div style={s.cardLeft}>
                  <div style={{ ...s.check, ...(a.done ? s.checkDone : {}) }}
                    onClick={e => { e.stopPropagation(); toggle(a.id) }}>
                    {a.done && <span style={{ fontSize: '10px', color: '#fff', lineHeight: 1 }}>✓</span>}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ ...s.cardTitle, ...(a.done ? s.textDone : {}) }}>{a.title}</div>
                    <div style={s.cardMeta}>
                      {a.subject && <span style={s.metaTag}>{a.subject}</span>}
                      {a.deadline && (
                        <span style={{ ...s.metaTag, display: 'flex', alignItems: 'center', gap: '4px', ...(status ? { color: status.color, background: status.bg } : {}) }}>
                          <svg className="icon-sm" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          {formatDeadline(a.deadline)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span style={{ ...s.diffTag, background: dc.bg, color: dc.color, border: `1px solid ${dc.border}`, flexShrink: 0 }}>
                  {isMobile ? a.difficulty.split(' ')[0] : a.difficulty}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {detail && (
        <AssignmentDetailModal
          item={detail}
          onClose={closeDetail}
          onEdit={(item) => { closeDetail(); openModal(item) }}
          onDelete={del}
          onToggle={toggle}
        />
      )}
      {modal !== null && (
        <AssignmentModal item={modal} onClose={closeModal} onSave={save} onDelete={del} />
      )}
    </div>
  )
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  title: { fontSize: '20px', fontWeight: '700', color: 'var(--text)', marginBottom: '2px' },
  sub: { fontSize: '13px', color: 'var(--text3)' },
  addBtn: { padding: '9px 18px', borderRadius: '99px', border: 'none', background: '#374151', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 },

  controls: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', alignItems: 'center' },
  tabs: { display: 'flex', background: 'var(--surface2)', borderRadius: '99px', padding: '3px', gap: '2px' },
  tab: { padding: '6px 16px', borderRadius: '99px', border: 'none', background: 'transparent', color: 'var(--text2)', fontSize: '13px', cursor: 'pointer' },
  tabOn: { background: 'var(--primary)', color: '#fff', fontWeight: '600' },
  sortSelect: { padding: '7px 14px', borderRadius: '99px', fontSize: '13px', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: "'Quicksand', sans-serif", fontWeight: 500, outline: 'none' },

  empty: { textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  emptyIcon: { fontSize: '40px' },
  emptyTitle: { fontSize: '16px', fontWeight: '600', color: 'var(--text2)' },
  emptyHint: { fontSize: '13px', color: 'var(--text3)' },

  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.15s' },
  cardDone: { opacity: 0.55 },
  cardLeft: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 },
  cardTitle: { fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  textDone: { textDecoration: 'line-through', color: 'var(--text3)' },
  cardMeta: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  metaTag: { fontSize: '11px', color: 'var(--text3)', background: 'var(--surface2)', padding: '2px 7px', borderRadius: '99px' },
  diffTag: { fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '99px' },
  diffRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  diffBtn: { padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: '12px', cursor: 'pointer' },

  check: { width: '22px', height: '22px', borderRadius: '50%', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s', cursor: 'pointer' },
  checkDone: { background: 'var(--success)', border: '2px solid var(--success)' },

  // Modal
  modalTitle: { fontSize: '16px', fontWeight: '700', color: 'var(--text)', marginBottom: '16px' },
  field: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px', fontWeight: '500' },
  modalActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px', flexWrap: 'wrap' },
  btnSave: { padding: '10px 22px', borderRadius: '99px', border: 'none', background: '#374151', color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  btnCancel: { padding: '10px 16px', borderRadius: '99px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: '13px', cursor: 'pointer' },
  btnDel: { padding: '10px 16px', borderRadius: '99px', border: '1px solid rgba(208,92,92,0.3)', background: 'rgba(208,92,92,0.08)', color: 'var(--danger)', fontSize: '13px', cursor: 'pointer', marginRight: 'auto' },

  // Detail
  detailRow: { display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' },
  detailIcon: { fontSize: '16px', marginTop: '1px', flexShrink: 0 },
  detailLabel: { fontSize: '11px', color: 'var(--text3)', marginBottom: '2px', fontWeight: '500' },
  detailValue: { fontSize: '14px', color: 'var(--text)', fontWeight: '500' },
}
