import { useState } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint.js'

const DAYS   = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
const COLORS = ['#8b5cf6','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899']

function ScheduleModal({ item, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(item ?? { subject: '', day: 'Senin', startTime: '', endTime: '', location: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const isEdit = !!item?.id

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 style={s.modalTitle}>{isEdit ? 'Edit Jadwal' : 'Tambah Jadwal'}</h3>

        <div style={s.field}>
          <label style={s.label}>Mata Pelajaran</label>
          <input className="sf-input" value={form.subject} placeholder="Contoh: Matematika"
            onChange={e => set('subject', e.target.value)} />
        </div>

        <div style={s.field}>
          <label style={s.label}>Hari</label>
          <select className="sf-input" value={form.day} onChange={e => set('day', e.target.value)}>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ ...s.field, flex: 1 }}>
            <label style={s.label}>Jam Mulai</label>
            <input className="sf-input" type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
          </div>
          <div style={{ ...s.field, flex: 1 }}>
            <label style={s.label}>Jam Selesai</label>
            <input className="sf-input" type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
          </div>
        </div>

        <div style={s.field}>
          <label style={s.label}>Lokasi / Ruangan</label>
          <input className="sf-input" value={form.location} placeholder="Contoh: Ruang 101"
            onChange={e => set('location', e.target.value)} />
        </div>

        <div style={s.modalActions}>
          {isEdit && <button className="btn-hover" style={s.btnDel} onClick={() => onDelete(item.id)}>Hapus</button>}
          <button className="btn-hover" style={s.btnCancel} onClick={onClose}>Batal</button>
          <button className="btn-hover" style={s.btnSave} onClick={() => { if (form.subject) onSave(form) }}>Simpan</button>
        </div>
      </div>
    </div>
  )
}

export default function Schedule({ schedule, setSchedule, onModalChange }) {
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'
  const [modal, setModal] = useState(undefined) // undefined=closed, null=new, object=edit

  const openModal  = (v) => { setModal(v);         onModalChange?.(true)  }
  const closeModal = ()  => { setModal(undefined);  onModalChange?.(false) }

  const save = (form) => {
    setSchedule(prev => form.id ? prev.map(s => s.id === form.id ? form : s) : [...prev, { ...form, id: Date.now().toString() }])
    closeModal()
  }
  const del = (id) => { setSchedule(prev => prev.filter(s => s.id !== id)); closeModal() }

  const cols = isMobile ? 2 : isTablet ? 3 : 6

  return (
    <div style={{ maxWidth: '1280px', width: '100%' }}>
      <div style={s.header}>
        <h1 style={s.title}>📋 Jadwal Mingguan</h1>
        <button className="btn-hover" style={s.addBtn} onClick={() => openModal(null)}>+ Tambah Jadwal</button>      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '10px' }}>
        {DAYS.map((day, di) => {
          const items = schedule.filter(s => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime))
          const color = COLORS[di % COLORS.length]
          return (
            <div key={day} style={s.col}>
              <div style={{ ...s.dayHdr, borderBottom: `2px solid ${color}40`, color }}>
                {day}
              </div>
              {items.length === 0
                ? <div style={s.empty}>Kosong</div>
                : items.map(item => (
                  <div key={item.id} className="card-hover"
                    style={{ ...s.card, borderLeft: `3px solid ${color}` }}
                    onClick={() => openModal(item)}>                    <div style={s.subject}>{item.subject}</div>
                    <div style={s.time}>{item.startTime} – {item.endTime}</div>
                    <div style={s.loc}>📍 {item.location}</div>
                  </div>
                ))
              }
            </div>
          )
        })}
      </div>

      {modal !== undefined && (
        <ScheduleModal item={modal} onClose={closeModal} onSave={save} onDelete={del} />
      )}
    </div>
  )
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
  title: { fontSize: '20px', fontWeight: '700', color: 'var(--text)' },
  addBtn: { padding: '7px 14px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  col: { display: 'flex', flexDirection: 'column', gap: '6px' },
  dayHdr: { textAlign: 'center', padding: '8px 6px', background: 'var(--surface)', borderRadius: '8px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.3px', border: '1px solid var(--border)' },
  empty: { textAlign: 'center', padding: '16px 6px', color: 'var(--text3)', fontSize: '11px' },
  card: { background: 'var(--surface)', borderRadius: '8px', padding: '9px 10px', cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.15s' },
  subject: { fontSize: '12px', fontWeight: '600', color: 'var(--text)', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  time: { fontSize: '10px', color: 'var(--text2)', marginBottom: '2px' },
  loc: { fontSize: '10px', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  // Modal
  modalTitle: { fontSize: '16px', fontWeight: '700', color: 'var(--text)', marginBottom: '16px' },
  field: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px', fontWeight: '500' },
  modalActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px', flexWrap: 'wrap' },
  btnSave: { padding: '9px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  btnCancel: { padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: '13px', cursor: 'pointer' },
  btnDel: { padding: '9px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '13px', cursor: 'pointer', marginRight: 'auto' },
}
