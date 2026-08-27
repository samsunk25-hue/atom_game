// 계절 테마: 접속 시점의 월에 따라 자동 전환
export const THEMES = {
  spring: {
    key: 'spring',
    label: '봄 · 벚꽃',
    emoji: '🌸',
    particle: '🌸',
    bg: 'linear-gradient(160deg,#FFF3F7 0%,#FFE9F2 45%,#F6F0FF 100%)',
    primary: '#FF9DBE',
    accent: '#C6A8F0',
    ink: '#5A3E4C',
  },
  summer: {
    key: 'summer',
    label: '여름 · 바다',
    emoji: '🌊',
    particle: '🫧',
    bg: 'linear-gradient(160deg,#EEFAFF 0%,#DFF4FF 45%,#E9FFF6 100%)',
    primary: '#5FC8E8',
    accent: '#66D9B4',
    ink: '#2F5566',
  },
  autumn: {
    key: 'autumn',
    label: '가을 · 단풍',
    emoji: '🍁',
    particle: '🍂',
    bg: 'linear-gradient(160deg,#FFF6EC 0%,#FFEEDC 45%,#FFF3E0 100%)',
    primary: '#F2A35E',
    accent: '#E07A5F',
    ink: '#5E4433',
  },
  winter: {
    key: 'winter',
    label: '겨울 · 눈',
    emoji: '❄️',
    particle: '❄️',
    bg: 'linear-gradient(160deg,#F4F8FF 0%,#EAF1FB 45%,#F7F4FF 100%)',
    primary: '#8FB6F0',
    accent: '#A9A8E6',
    ink: '#3F4A63',
  },
}

export function seasonOf(date = new Date()) {
  const m = date.getMonth() + 1
  if (m >= 3 && m <= 5) return 'spring'
  if (m >= 6 && m <= 8) return 'summer'
  if (m >= 9 && m <= 11) return 'autumn'
  return 'winter'
}

export function currentTheme() {
  const saved = localStorage.getItem('moodum:theme')
  return THEMES[saved] || THEMES[seasonOf()]
}

export function applyTheme(theme) {
  const root = document.documentElement
  root.style.setProperty('--bg', theme.bg)
  root.style.setProperty('--primary', theme.primary)
  root.style.setProperty('--accent', theme.accent)
  root.style.setProperty('--ink', theme.ink)
  root.dataset.season = theme.key
}
