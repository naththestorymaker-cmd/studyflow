import { useState, useRef, useEffect } from 'react'

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const VALID_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const DAY_ALIASES = {
  minggu: 'Minggu', senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu',
  kamis: 'Kamis', jumat: 'Jumat', sabtu: 'Sabtu',
  sunday: 'Minggu', monday: 'Senin', tuesday: 'Selasa', wednesday: 'Rabu',
  thursday: 'Kamis', friday: 'Jumat', saturday: 'Sabtu'
}
const MOTIVATIONAL = [
  `Kamu udah jauh lebih maju dari yang kamu kira. Terus! 💪`,
  `Nggak ada yang sia-sia. Setiap langkah kecil itu penting. 🌱`,
  `Istirahat boleh, menyerah jangan. Kamu bisa! ✨`,
  `Hari ini mungkin berat, tapi kamu lebih kuat dari itu. 🔥`,
  `Ingat kenapa kamu mulai. Semangat terus ya! 🚀`,
  `Progres itu nggak harus besar. Yang penting konsisten. 💡`,
  `Kamu nggak harus sempurna, cukup terus bergerak maju. 🌟`,
  `Setiap orang punya waktunya sendiri. Waktumu akan tiba! ⏳`,
  `Lelah itu tanda kamu sudah berusaha keras. Bangga sama dirimu! 🎯`,
  `Satu langkah hari ini lebih baik dari nol langkah kemarin. 👣`
]

// ── Conversational Form Definitions ──────────────────────────────────────────
// Each form is an array of steps: { key, question, validate?, hint? }
const FORMS = {
  add_schedule: [
    { key: 'subject',   question: 'Nama mata pelajarannya apa?' },
    { key: 'day',       question: 'Hari apa?', hint: 'Senin / Selasa / Rabu / Kamis / Jumat / Sabtu',
      validate: v => VALID_DAYS.find(d => d.toLowerCase() === v.toLowerCase()) || null,
      transform: v => VALID_DAYS.find(d => d.toLowerCase() === v.toLowerCase()) },
    { key: 'startTime', question: 'Jam mulai? (contoh: 07:00)',
      validate: v => /^\d{1,2}:\d{2}$/.test(v) ? v : null },
    { key: 'endTime',   question: 'Jam selesai? (contoh: 08:30)',
      validate: v => /^\d{1,2}:\d{2}$/.test(v) ? v : null },
    { key: 'location',  question: 'Lokasi / ruangan? (ketik "-" kalau belum tahu)' }
  ],
  add_event: [
    { key: 'title',     question: 'Judul eventnya apa?' },
    { key: 'date',      question: 'Tanggalnya? (format: YYYY-MM-DD, contoh: 2026-05-10)',
      validate: v => /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null },
    { key: 'startTime', question: 'Jam mulai? (contoh: 09:00)',
      validate: v => /^\d{1,2}:\d{2}$/.test(v) ? v : null },
    { key: 'endTime',   question: 'Jam selesai? (contoh: 11:00)',
      validate: v => /^\d{1,2}:\d{2}$/.test(v) ? v : null },
    { key: 'description', question: 'Deskripsi singkat? (ketik "-" kalau nggak ada)' }
  ],
  add_task: [
    { key: 'title', question: 'Nama tugasnya apa?' }
  ]
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const fmtSched = (items) => items.map(s => `📚 ${s.subject} — ${s.startTime}–${s.endTime} di ${s.location}`).join('\n')
const fmtEvents = (evs) => evs.map(e => `📌 ${e.title} — ${e.startTime}–${e.endTime}`).join('\n')
const cap = (str) => str.charAt(0).toUpperCase() + str.slice(1)

function parseDay(text) {
  const t = text.toLowerCase()
  for (const [alias, day] of Object.entries(DAY_ALIASES)) {
    if (t.includes(alias)) return day
  }
  return null
}

function parseRelativeDay(text) {
  const t = text.toLowerCase()
  const today = new Date()
  if (/hari ini|sekarang|today|saat ini/.test(t))
    return { label: 'hari ini', dayName: DAYS_ID[today.getDay()], dateStr: today.toISOString().split('T')[0] }
  if (/besok|tomorrow/.test(t)) {
    const d = new Date(today); d.setDate(today.getDate() + 1)
    return { label: 'besok', dayName: DAYS_ID[d.getDay()], dateStr: d.toISOString().split('T')[0] }
  }
  if (/lusa/.test(t)) {
    const d = new Date(today); d.setDate(today.getDate() + 2)
    return { label: 'lusa', dayName: DAYS_ID[d.getDay()], dateStr: d.toISOString().split('T')[0] }
  }
  return null
}

// ── Intent Detection ──────────────────────────────────────────────────────────
function detectIntent(text) {
  const t = text.toLowerCase()
  const hasDay = parseDay(t) !== null
  const hasRelDay = parseRelativeDay(t) !== null
  const isSchedQ = /jadwal|pelajaran|kelas|schedule|mata pelajaran/.test(t)
  const isEventQ = /event|kegiatan|acara|agenda/.test(t)
  const isAllQ   = /ada apa|apa aja|apa saja|apa yang ada/.test(t)
  const isTaskQ  = /tugas|pr\b|pekerjaan rumah|homework/.test(t)
  const isAdd    = /tambah|add|buat|catat|masukin|daftarkan/.test(t)
  const isEdit   = /edit|ubah|ganti|update|pindah/.test(t)
  const isDel    = /hapus|delete|hilang|buang|remove/.test(t)

  if (/capek|lelah|menyerah|nyerah|males|malas|susah|sulit|nggak bisa|gabisa|hopeless|stress|stres|burnout/.test(t)) return 'motivate'

  if (isTaskQ && isAdd) return 'add_task'
  if (isTaskQ && /selesai|done|sudah|tandai|centang/.test(t)) return 'done_task'
  if (isTaskQ && isDel) return 'delete_task'
  if (isTaskQ) return 'list_tasks'

  if (isSchedQ && isAdd) return 'add_schedule'
  if (isSchedQ && isEdit) return 'edit_schedule'
  if (isSchedQ && isDel) return 'delete_schedule'

  if (isEventQ && isAdd) return 'add_event'
  if (isEventQ && isEdit) return 'edit_event'
  if (isEventQ && isDel) return 'delete_event'

  if ((hasRelDay || hasDay) && isSchedQ) return 'schedule_by_day'
  if ((hasRelDay || hasDay) && isEventQ) return 'events_by_day'
  if ((hasRelDay || hasDay) && isAllQ)   return 'all_by_day'
  if (hasRelDay || hasDay) return 'schedule_by_day'

  if (/jam berapa|kapan|waktunya|mulai jam/.test(t)) return 'followup_time'
  if (/di mana|dimana|ruang|lokasi|tempat/.test(t))  return 'followup_location'
  if (/batalkan|batal|cancel/.test(t)) return 'cancel'
  if (/bantuan|help|bisa apa|apa yang bisa|cara/.test(t)) return 'help'
  if (/halo|hai\b|hi\b|hello|hey\b|selamat pagi|selamat siang|selamat sore|selamat malam/.test(t)) return 'greet'

  return 'unknown'
}

// ── Form Completion Handlers ──────────────────────────────────────────────────
function completeForm(formType, data, { setSchedule, setEvents, setTasks }) {
  if (formType === 'add_schedule') {
    const item = { id: Date.now().toString(), subject: data.subject, day: data.day, startTime: data.startTime, endTime: data.endTime, location: data.location }
    setSchedule(prev => [...prev, item])
    return pick([
      `Jadwal ${data.subject} hari ${data.day} sudah ditambahkan! 📚`,
      `Siap! ${data.subject} (${data.day}, ${data.startTime}–${data.endTime}) sudah masuk jadwal.`
    ])
  }
  if (formType === 'add_event') {
    const desc = data.description === '-' ? '' : data.description
    const item = { id: Date.now().toString(), title: data.title, date: data.date, startTime: data.startTime, endTime: data.endTime, description: desc }
    setEvents(prev => [...prev, item])
    return pick([
      `Event "${data.title}" pada ${data.date} sudah masuk kalender! 📅`,
      `Oke, "${data.title}" sudah tercatat di kalender.`
    ])
  }
  if (formType === 'add_task') {
    setTasks(prev => [...prev, { id: Date.now().toString(), title: data.title, done: false }])
    return pick([`Tugas "${data.title}" sudah dicatat! ✅`, `Siap, "${data.title}" sudah masuk daftar tugas.`])
  }
  return 'Selesai!'
}

// ── Response Generator ────────────────────────────────────────────────────────
function generateResponse(intent, input, deps) {
  const { events, schedule, tasks, setTasks, setEvents, setSchedule, ctx, setCtx } = deps
  const today = new Date()
  const todayName = DAYS_ID[today.getDay()]
  const relDay = parseRelativeDay(input)
  const namedDay = parseDay(input)
  const targetDay = relDay?.dayName || namedDay || todayName
  const targetDate = relDay?.dateStr || null
  const dayLabel = relDay?.label || namedDay || 'hari ini'

  switch (intent) {
    case 'motivate': return pick(MOTIVATIONAL)

    case 'add_schedule':
    case 'add_event':
    case 'add_task':
      // Handled by form flow — signal to start form
      return { __startForm: intent }

    case 'schedule_by_day': {
      const items = schedule.filter(s => s.day === targetDay).sort((a, b) => a.startTime.localeCompare(b.startTime))
      if (!items.length) return pick([`Hari ${targetDay} belum ada jadwal. Mau tambah? Ketik "tambah jadwal"`, `${targetDay} kosong nih.`])
      setCtx({ type: 'schedule', day: targetDay, items })
      return `${pick([`Jadwal ${dayLabel}:`, `${cap(dayLabel)} kamu punya ${items.length} kelas:`])}\n${fmtSched(items)}`
    }

    case 'events_by_day': {
      const items = targetDate ? events.filter(e => e.date === targetDate)
        : events.filter(e => DAYS_ID[new Date(e.date).getDay()] === targetDay)
      if (!items.length) return `Tidak ada event ${dayLabel}. Mau tambah? Ketik "tambah event"`
      setCtx({ type: 'events', day: targetDay, items })
      return `Event ${dayLabel}:\n${fmtEvents(items)}`
    }

    case 'all_by_day': {
      const sched = schedule.filter(s => s.day === targetDay).sort((a, b) => a.startTime.localeCompare(b.startTime))
      const evs = targetDate ? events.filter(e => e.date === targetDate) : []
      if (!sched.length && !evs.length) return pick([`${cap(dayLabel)} kosong. Mau mulai isi? 😊`, `Nggak ada kegiatan ${dayLabel}.`])
      setCtx({ type: 'all', day: targetDay, schedItems: sched, eventItems: evs })
      let text = `Kegiatan ${dayLabel}:\n`
      if (sched.length) text += `\nJadwal:\n${fmtSched(sched)}`
      if (evs.length) text += `\n\nEvent:\n${fmtEvents(evs)}`
      return text
    }

    case 'edit_schedule': {
      const raw = input.replace(/edit|ubah|ganti|update|pindah|jadwal/gi, '').trim()
      const parts = raw.split('|').map(s => s.trim()).filter(Boolean)
      if (parts.length < 3) return `Format: "edit jadwal [mapel] | [field] | [nilai]"\nField: hari, jam mulai, jam selesai, lokasi\n\nContoh: edit jadwal Matematika | hari | Selasa`
      const [name, field, value] = parts
      const found = schedule.find(s => s.subject.toLowerCase().includes(name.toLowerCase()))
      if (!found) return `Jadwal "${name}" tidak ditemukan.`
      const fieldMap = { hari: 'day', 'jam mulai': 'startTime', 'jam selesai': 'endTime', lokasi: 'location', ruang: 'location', mapel: 'subject' }
      const key = fieldMap[field.toLowerCase()]
      if (!key) return `Field "${field}" tidak dikenal. Coba: hari, jam mulai, jam selesai, atau lokasi.`
      setSchedule(prev => prev.map(s => s.id === found.id ? { ...s, [key]: value } : s))
      return `${found.subject} diupdate — ${field} jadi "${value}" ✅`
    }

    case 'delete_schedule': {
      const raw = input.replace(/hapus|delete|hilang|buang|remove|jadwal/gi, '').trim()
      const found = schedule.find(s => s.subject.toLowerCase().includes(raw.toLowerCase()))
      if (!found) return `Jadwal "${raw}" tidak ditemukan.`
      setSchedule(prev => prev.filter(s => s.id !== found.id))
      return `Jadwal ${found.subject} (${found.day}) sudah dihapus.`
    }

    case 'edit_event': {
      const raw = input.replace(/edit|ubah|ganti|update|event|kegiatan|acara/gi, '').trim()
      const parts = raw.split('|').map(s => s.trim()).filter(Boolean)
      if (parts.length < 3) return `Format: "edit event [judul] | [field] | [nilai]"\nField: judul, tanggal, jam mulai, jam selesai\n\nContoh: edit event Ujian | tanggal | 2026-04-15`
      const [name, field, value] = parts
      const found = events.find(e => e.title.toLowerCase().includes(name.toLowerCase()))
      if (!found) return `Event "${name}" tidak ditemukan.`
      const fieldMap = { judul: 'title', tanggal: 'date', 'jam mulai': 'startTime', 'jam selesai': 'endTime', deskripsi: 'description' }
      const key = fieldMap[field.toLowerCase()]
      if (!key) return `Field "${field}" tidak dikenal.`
      setEvents(prev => prev.map(e => e.id === found.id ? { ...e, [key]: value } : e))
      return `Event "${found.title}" diupdate — ${field} jadi "${value}" ✅`
    }

    case 'delete_event': {
      const raw = input.replace(/hapus|delete|hilang|buang|remove|event|kegiatan|acara/gi, '').trim()
      const found = events.find(e => e.title.toLowerCase().includes(raw.toLowerCase()))
      if (!found) return `Event "${raw}" tidak ditemukan.`
      setEvents(prev => prev.filter(e => e.id !== found.id))
      return `Event "${found.title}" sudah dihapus.`
    }

    case 'list_tasks': {
      const pending = tasks.filter(t => !t.done)
      if (!pending.length) return pick([`Semua tugas sudah selesai! 🎉`, `Nggak ada tugas pending. Good job! ✨`])
      return `${pick(['Tugas yang belum selesai:', 'PR yang masih pending:'])}\n${pending.map((t, i) => `${i + 1}. ${t.title}`).join('\n')}`
    }

    case 'done_task': {
      const cleaned = input.replace(/selesai|done|sudah|tandai|centang|tugas|pr\b/gi, '').replace(/[:\-]/g, '').trim()
      const pending = tasks.filter(t => !t.done)
      const byNum = parseInt(cleaned) - 1
      const target = (!isNaN(byNum) && pending[byNum]) ? pending[byNum]
        : tasks.find(t => !t.done && t.title.toLowerCase().includes(cleaned.toLowerCase()))
      if (!target) return `Tugas "${cleaned}" nggak ketemu.`
      setTasks(prev => prev.map(t => t.id === target.id ? { ...t, done: true } : t))
      return pick([`"${target.title}" ditandai selesai! 🎉`, `Mantap, "${target.title}" sudah beres! ✅`])
    }

    case 'delete_task': {
      const cleaned = input.replace(/hapus|delete|hilang|buang|tugas|pr\b/gi, '').replace(/[:\-]/g, '').trim()
      const found = tasks.find(t => t.title.toLowerCase().includes(cleaned.toLowerCase()))
      if (!found) return `Tugas "${cleaned}" nggak ditemukan.`
      setTasks(prev => prev.filter(t => t.id !== found.id))
      return `Tugas "${found.title}" sudah dihapus.`
    }

    case 'followup_time': {
      if (ctx?.type === 'schedule' && ctx.items?.length) return ctx.items.map(s => `${s.subject}: ${s.startTime}–${s.endTime}`).join('\n')
      if (ctx?.type === 'events' && ctx.items?.length) return ctx.items.map(e => `${e.title}: ${e.startTime}–${e.endTime}`).join('\n')
      if (ctx?.type === 'all') {
        const lines = [...(ctx.schedItems||[]).map(s=>`${s.subject}: ${s.startTime}–${s.endTime}`), ...(ctx.eventItems||[]).map(e=>`${e.title}: ${e.startTime}–${e.endTime}`)]
        if (lines.length) return lines.join('\n')
      }
      return `Sekarang jam ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ⏰`
    }

    case 'followup_location': {
      if (ctx?.type === 'schedule' && ctx.items?.length) return ctx.items.map(s => `${s.subject}: ${s.location}`).join('\n')
      if (ctx?.type === 'all' && ctx.schedItems?.length) return ctx.schedItems.map(s => `${s.subject}: ${s.location}`).join('\n')
      return `Coba tanya jadwal dulu ya.`
    }

    case 'cancel': return null // handled in component

    case 'help':
      return `Kamu bisa:\n• "jadwal hari ini" / "jadwal senin"\n• "tambah jadwal" — aku akan tanya satu per satu\n• "tambah event" — sama, aku tanya step by step\n• "tambah tugas [nama]"\n• "hapus jadwal [mapel]"\n• "hapus event [judul]"\n• "edit jadwal [mapel] | [field] | [nilai]"\n• "tugas yang belum selesai"`

    case 'greet': {
      const h = new Date().getHours()
      const salam = h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'
      return pick([`${salam}! Ada yang bisa aku bantu? 😊`, `${salam}! Mau isi jadwal atau tanya sesuatu? 📚`])
    }

    default: {
      const mentionedDay = parseDay(input)
      if (mentionedDay) {
        const items = schedule.filter(s => s.day === mentionedDay)
        if (items.length) { setCtx({ type: 'schedule', day: mentionedDay, items }); return `Jadwal ${mentionedDay}:\n${fmtSched(items)}` }
        return `Hari ${mentionedDay} belum ada jadwal. Ketik "tambah jadwal" untuk mulai.`
      }
      return pick([
        `Hmm, kurang ngerti nih. Coba "jadwal hari ini" atau ketik "bantuan".`,
        `Bisa diperjelas? Misalnya: "jadwal senin" atau "tambah tugas".`
      ])
    }
  }
}

// ── Quick Suggestions ─────────────────────────────────────────────────────────
const SUGGESTIONS = ['Hari ini ada apa?', 'Tambah jadwal', 'Tambah event', 'Semangat dong!']

// ── Main Component ────────────────────────────────────────────────────────────
export default function Chatbot({ events, setEvents, schedule, setSchedule, tasks, setTasks, onClose }) {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Halo! Saya FlowBot 👋\nBelum ada data? Ketik "tambah jadwal", "tambah event", atau "tambah tugas" — aku akan tanya satu per satu!\n\nKetik "bantuan" untuk info lebih lanjut.' }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [ctx, setCtx] = useState(null)
  // form state: { type, steps, stepIndex, data }
  const [form, setForm] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const pushBot = (text) => setMessages(prev => [...prev, { from: 'bot', text }])
  const pushUser = (text) => setMessages(prev => [...prev, { from: 'user', text }])

  const handleSend = (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed) return
    pushUser(trimmed)
    setInput('')

    // ── If a form is active, process the current step ──
    if (form) {
      const t = trimmed.toLowerCase()
      // Allow cancel at any point
      if (/batalkan|batal|cancel|stop/.test(t)) {
        setForm(null)
        setTyping(false)
        setTimeout(() => pushBot(`Oke, dibatalkan. Ada yang lain?`), 400)
        return
      }

      const step = FORMS[form.type][form.stepIndex]
      let value = trimmed

      // Validate if step has validator
      if (step.validate) {
        const validated = step.validate(trimmed)
        if (!validated) {
          setTimeout(() => {
            pushBot(`Hmm, format kurang tepat. ${step.hint ? `(${step.hint})` : ''}\nCoba lagi: ${step.question}`)
          }, 400)
          return
        }
        value = step.transform ? step.transform(trimmed) : validated
      }

      const newData = { ...form.data, [step.key]: value }
      const nextIndex = form.stepIndex + 1
      const steps = FORMS[form.type]

      if (nextIndex >= steps.length) {
        // Form complete
        setForm(null)
        setTyping(true)
        setTimeout(() => {
          const reply = completeForm(form.type, newData, { setSchedule, setEvents, setTasks })
          setTyping(false)
          pushBot(reply)
        }, 500)
      } else {
        // Next step
        setForm({ ...form, stepIndex: nextIndex, data: newData })
        const nextStep = steps[nextIndex]
        setTimeout(() => {
          pushBot(nextStep.hint ? `${nextStep.question}\n(${nextStep.hint})` : nextStep.question)
        }, 400)
      }
      return
    }

    // ── Normal intent flow ──
    setTyping(true)
    setTimeout(() => {
      const intent = detectIntent(trimmed)
      const result = generateResponse(intent, trimmed, { events, schedule, tasks, setTasks, setEvents, setSchedule, ctx, setCtx })
      setTyping(false)

      // Check if response wants to start a form
      if (result && typeof result === 'object' && result.__startForm) {
        const formType = result.__startForm
        const steps = FORMS[formType]
        setForm({ type: formType, stepIndex: 0, data: {} })
        const firstStep = steps[0]
        pushBot(firstStep.hint ? `${firstStep.question}\n(${firstStep.hint})` : firstStep.question)
        return
      }

      if (intent === 'cancel') {
        pushBot(`Nggak ada yang perlu dibatalkan kok.`)
        return
      }

      pushBot(result || `Oke!`)
    }, 500 + Math.random() * 500)
  }

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }

  // Show cancel button when form is active
  const activeSuggestions = form
    ? [{ label: '❌ Batalkan', action: () => handleSend('batal') }]
    : SUGGESTIONS.map(s => ({ label: s, action: () => handleSend(s) }))

  return (
    <div style={s.panel}>
      <div style={s.header}>
        <div style={s.botInfo}>
          <div style={s.botAvatar}>FB</div>
          <div>
            <div style={s.botName}>FlowBot</div>
            <div style={s.botStatus}>{form ? 'Mengisi form...' : '● Online'}</div>
          </div>
        </div>
        <button style={s.closeBtn} onClick={onClose} aria-label="Tutup">✕</button>
      </div>

      <div style={s.messages}>
        {messages.map((msg, i) => (
          <div key={i} style={{ ...s.msgRow, justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.from === 'bot' && <div style={s.botAvatarSmall}>FB</div>}
            <div style={{ ...s.bubble, ...(msg.from === 'user' ? s.userBubble : s.botBubble) }}>
              {msg.text.split('\n').map((line, j) => <div key={j}>{line || <br />}</div>)}
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ ...s.msgRow, justifyContent: 'flex-start' }}>
            <div style={s.botAvatarSmall}>FB</div>
            <div style={{ ...s.bubble, ...s.botBubble, ...s.typingBubble }}>
              <span style={s.dot} /><span style={{ ...s.dot, animationDelay: '0.2s' }} /><span style={{ ...s.dot, animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={s.suggestions}>
        {activeSuggestions.map(({ label, action }) => (
          <button key={label} style={{ ...s.sugBtn, ...(form ? s.sugBtnCancel : {}) }} onClick={action}>{label}</button>
        ))}
      </div>

      <div style={s.inputRow}>
        <input style={s.input} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
          placeholder={form ? 'Jawab pertanyaan di atas...' : 'Tanya atau ketik perintah...'} />
        <button style={s.sendBtn} onClick={() => handleSend()}>➤</button>
      </div>
    </div>
  )
}

const s = {
  panel: { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface)', overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  botInfo: { display: 'flex', alignItems: 'center', gap: '8px' },
  botAvatar: { width: '28px', height: '28px', borderRadius: '7px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff', fontWeight: '800' },
  botName: { fontSize: '13px', fontWeight: '600', color: 'var(--text)' },
  botStatus: { fontSize: '10px', color: 'var(--success)' },
  closeBtn: { background: 'transparent', border: 'none', color: 'var(--text3)', fontSize: '15px', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px', lineHeight: 1 },
  messages: { flex: 1, overflow: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' },
  msgRow: { display: 'flex', alignItems: 'flex-end', gap: '6px' },
  botAvatarSmall: { width: '20px', height: '20px', borderRadius: '5px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#fff', fontWeight: '800', flexShrink: 0 },
  bubble: { maxWidth: '220px', padding: '8px 10px', borderRadius: '12px', fontSize: '12px', lineHeight: '1.55', wordBreak: 'break-word' },
  botBubble: { background: 'var(--surface2)', color: 'var(--text)', borderBottomLeftRadius: '3px', border: '1px solid var(--border)' },
  userBubble: { background: 'var(--primary)', color: '#fff', borderBottomRightRadius: '3px' },
  typingBubble: { display: 'flex', gap: '4px', alignItems: 'center', padding: '10px 12px' },
  dot: { width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text3)', display: 'inline-block', animation: 'blink 1.2s infinite ease-in-out' },
  suggestions: { display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '8px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 },
  sugBtn: { padding: '4px 9px', borderRadius: '99px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' },
  sugBtnCancel: { border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#f87171' },
  inputRow: { display: 'flex', gap: '6px', padding: '10px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 },
  input: { flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', outline: 'none' },
  sendBtn: { width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' },
}
