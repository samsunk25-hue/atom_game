import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { THEMES, applyTheme, currentTheme } from '../lib/theme.js'
import { play, setSoundEnabled, soundEnabled } from '../lib/sound.js'
import InstallButton from './InstallButton.jsx'

function Particles({ emoji }) {
  const items = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: `${(i * 7.3 + Math.random() * 6) % 100}%`,
        duration: `${9 + Math.random() * 9}s`,
        delay: `${-Math.random() * 12}s`,
        size: `${13 + Math.random() * 14}px`,
      })),
    [emoji],
  )
  return (
    <div className="particles" aria-hidden>
      {items.map((p, i) => (
        <span
          key={i}
          style={{
            left: p.left,
            fontSize: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  )
}

export default function Layout({ children, minimal = false }) {
  const navigate = useNavigate()
  const [theme, setTheme] = useState(currentTheme)
  const [sound, setSound] = useState(soundEnabled)

  useEffect(() => applyTheme(theme), [theme])

  function cycleTheme() {
    const keys = Object.keys(THEMES)
    const next = THEMES[keys[(keys.indexOf(theme.key) + 1) % keys.length]]
    localStorage.setItem('moodum:theme', next.key)
    setTheme(next)
    play('click')
  }

  function toggleSound() {
    const next = !sound
    setSoundEnabled(next)
    setSound(next)
    if (next) play('pop')
  }

  return (
    <>
      <Particles emoji={theme.particle} />
      <div className="app">
        <div className="topbar no-print">
          {/* minimal(학생 화면)에서는 로고를 눌러도 교사 별명 화면으로 가지 않는다. */}
          {minimal ? (
            <div className="brand" style={{ cursor: 'default' }}>
              🧞 모둠지니
            </div>
          ) : (
            <div className="brand" onClick={() => navigate('/')}>
              🧞 모둠지니
            </div>
          )}
          <div className="spacer" />
          <InstallButton />
          <button className="chip" onClick={cycleTheme} title="계절 테마 바꾸기">
            {theme.emoji} {theme.label}
          </button>
          <button className="chip" onClick={toggleSound} title="효과음">
            {sound ? '🔊' : '🔇'}
          </button>
        </div>
        {children}
      </div>
    </>
  )
}
