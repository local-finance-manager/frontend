import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

function resolveInitial(): Theme {
  try {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') return stored
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(resolveInitial)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
