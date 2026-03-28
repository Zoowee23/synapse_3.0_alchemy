import { createContext, useContext, useState, useEffect } from 'react'

export const THEMES = {
  dark: {
    name: 'Dark',
    icon: '🌑',
    bg: '#0F172A',
    card: '#1E293B',
    border: '#334155',
    text: '#F1F5F9',
    muted: '#94A3B8',
    accent: '#10B981',
    accentHover: '#34D399',
    nav: '#0F172A',
    navBorder: '#1E293B',
    class: 'theme-dark',
  },
  light: {
    name: 'Light',
    icon: '☀️',
    bg: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    muted: '#64748B',
    accent: '#059669',
    accentHover: '#047857',
    nav: '#FFFFFF',
    navBorder: '#E2E8F0',
    class: 'theme-light',
  },
  nature: {
    name: 'Nature',
    icon: '🌿',
    bg: '#0D1F0D',
    card: '#132613',
    border: '#1E4020',
    text: '#D1FAE5',
    muted: '#6EE7B7',
    accent: '#22C55E',
    accentHover: '#4ADE80',
    nav: '#0D1F0D',
    navBorder: '#1E4020',
    class: 'theme-nature',
  },
  ocean: {
    name: 'Ocean',
    icon: '🌊',
    bg: '#0C1A2E',
    card: '#0F2744',
    border: '#1E3A5F',
    text: '#E0F2FE',
    muted: '#7DD3FC',
    accent: '#0EA5E9',
    accentHover: '#38BDF8',
    nav: '#0C1A2E',
    navBorder: '#1E3A5F',
    class: 'theme-ocean',
  },
  fire: {
    name: 'Fire',
    icon: '🔥',
    bg: '#1A0A00',
    card: '#2D1200',
    border: '#7C2D12',
    text: '#FEF3C7',
    muted: '#FCD34D',
    accent: '#F97316',
    accentHover: '#FB923C',
    nav: '#1A0A00',
    navBorder: '#7C2D12',
    class: 'theme-fire',
  },
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('eco_theme') || 'dark')
  const theme = THEMES[themeKey] || THEMES.dark

  useEffect(() => {
    localStorage.setItem('eco_theme', themeKey)
    const root = document.documentElement
    root.style.setProperty('--bg',          theme.bg)
    root.style.setProperty('--card',        theme.card)
    root.style.setProperty('--border',      theme.border)
    root.style.setProperty('--text',        theme.text)
    root.style.setProperty('--muted',       theme.muted)
    root.style.setProperty('--accent',      theme.accent)
    root.style.setProperty('--accent-hover',theme.accentHover)
    root.style.setProperty('--nav',         theme.nav)
    root.style.setProperty('--nav-border',  theme.navBorder)
    document.body.style.backgroundColor = theme.bg
    document.body.style.color = theme.text
  }, [themeKey, theme])

  return (
    <ThemeContext.Provider value={{ theme, themeKey, setThemeKey, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
