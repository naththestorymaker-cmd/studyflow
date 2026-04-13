import { useState, useEffect } from 'react'

export function useBreakpoint() {
  const get = () => {
    const w = window.innerWidth
    if (w < 768) return 'mobile'
    if (w <= 1024) return 'tablet'
    return 'desktop'
  }
  const [bp, setBp] = useState(get)
  useEffect(() => {
    const h = () => setBp(get())
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return bp
}
