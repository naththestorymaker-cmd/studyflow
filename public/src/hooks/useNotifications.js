import { useState, useEffect, useCallback } from 'react'

const NOTIFIED_KEY = 'sf_notified'

// Request permission on first call
export function useNotificationPermission() {
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  )

  const request = useCallback(async () => {
    if (!('Notification' in window)) return 'denied'
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }, [])

  return { permission, request }
}

// Send a browser notification, falling back to an in-app toast
export function sendNotification(title, body, onToast) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' })
  } else {
    // Fallback: in-app toast via callback
    onToast?.({ title, body })
  }
}

// Main notification engine — runs on a 60s tick
export function useNotificationEngine({ events, tasks, assignments = [], onToast }) {
  useEffect(() => {
    const check = () => {
      const now = new Date()
      const todayStr = now.toISOString().split('T')[0]
      const notified = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]')
      const newNotified = [...notified]

      // ── Event reminders: 30 min and 10 min before ──────────────────────────
      events.forEach(ev => {
        if (ev.date !== todayStr) return
        const [h, m] = ev.startTime.split(':').map(Number)
        const evTime = new Date(now)
        evTime.setHours(h, m, 0, 0)
        const diff = (evTime - now) / 60000 // minutes until event

        const key30 = `${ev.id}_30min`
        const key10 = `${ev.id}_10min`

        if (diff > 28 && diff <= 32 && !newNotified.includes(key30)) {
          sendNotification(
            'Event dalam 30 menit',
            `"${ev.title}" dimulai pukul ${ev.startTime}`,
            onToast
          )
          newNotified.push(key30)
        }

        if (diff > 8 && diff <= 12 && !newNotified.includes(key10)) {
          sendNotification(
            'Event segera dimulai!',
            `"${ev.title}" dimulai pukul ${ev.startTime} — 10 menit lagi`,
            onToast
          )
          newNotified.push(key10)
        }
      })

      // ── Task reminder: once per day at 08:00 if there are pending tasks ────
      const pendingTasks = tasks.filter(t => !t.done)
      const taskKey = `tasks_morning_${todayStr}`
      const h = now.getHours(), min = now.getMinutes()

      if (h === 8 && min < 5 && pendingTasks.length > 0 && !newNotified.includes(taskKey)) {
        sendNotification(
          'Jangan lupa tugasmu!',
          `Kamu punya ${pendingTasks.length} tugas yang belum selesai hari ini.`,
          onToast
        )
        newNotified.push(taskKey)
      }

      // ── Task reminder: evening at 20:00 if still pending ───────────────────
      const taskEveKey = `tasks_evening_${todayStr}`
      if (h === 20 && min < 5 && pendingTasks.length > 0 && !newNotified.includes(taskEveKey)) {
        sendNotification(
          'Masih ada tugas pending',
          `${pendingTasks.length} tugas belum selesai. Yuk diselesaikan!`,
          onToast
        )
        newNotified.push(taskEveKey)
      }

      // ── Assignment deadline reminders ──────────────────────────────────────
      const pendingAssignments = assignments.filter(a => !a.done && a.deadline)
      const h2 = now.getHours(), min2 = now.getMinutes()

      pendingAssignments.forEach(a => {
        const dl = new Date(a.deadline); dl.setHours(0,0,0,0)
        const today = new Date(now); today.setHours(0,0,0,0)
        const daysLeft = Math.round((dl - today) / 86400000)

        // 3 days before — morning reminder
        const key3d = `assign_3d_${a.id}_${a.deadline}`
        if (daysLeft === 3 && h2 === 8 && min2 < 5 && !newNotified.includes(key3d)) {
          sendNotification(
            'Deadline 3 hari lagi',
            `"${a.title}" harus dikumpulkan ${a.deadline}`,
            onToast
          )
          newNotified.push(key3d)
        }

        // 1 day before — morning reminder
        const key1d = `assign_1d_${a.id}_${a.deadline}`
        if (daysLeft === 1 && h2 === 8 && min2 < 5 && !newNotified.includes(key1d)) {
          sendNotification(
            'Deadline besok!',
            `"${a.title}" harus dikumpulkan besok!`,
            onToast
          )
          newNotified.push(key1d)
        }

        // Due today — morning reminder
        const keyToday = `assign_today_${a.id}_${a.deadline}`
        if (daysLeft === 0 && h2 === 8 && min2 < 5 && !newNotified.includes(keyToday)) {
          sendNotification(
            'Deadline hari ini!',
            `"${a.title}" harus dikumpulkan hari ini!`,
            onToast
          )
          newNotified.push(keyToday)
        }
      })

      if (newNotified.length !== notified.length) {
        localStorage.setItem(NOTIFIED_KEY, JSON.stringify(newNotified))
      }
    }

    check() // run immediately on mount
    const interval = setInterval(check, 60_000) // then every 60s
    return () => clearInterval(interval)
  }, [events, tasks, assignments, onToast])
}
