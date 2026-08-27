// 효과음: 외부 음원 없이 WebAudio로 짧은 멜로디를 합성한다.
const KEY = 'moodum:sound'

/** 기본값은 꺼짐. 교사가 직접 켠 경우에만 재생한다. */
export function soundEnabled() {
  return localStorage.getItem(KEY) === 'on'
}

export function setSoundEnabled(on) {
  localStorage.setItem(KEY, on ? 'on' : 'off')
}

let ctx = null
function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, start, dur, { type = 'sine', gain = 0.18 } = {}) {
  const ac = audio()
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ac.currentTime + start)
  g.gain.setValueAtTime(0.0001, ac.currentTime + start)
  g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + start + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur)
  osc.connect(g).connect(ac.destination)
  osc.start(ac.currentTime + start)
  osc.stop(ac.currentTime + start + dur + 0.02)
}

const SOUNDS = {
  pop: () => tone(880, 0, 0.12, { type: 'triangle' }), // 제출 완료 "뿅!"
  tada: () => {
    // 캐릭터 등장 "짜잔!"
    ;[523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.2, { type: 'triangle' }))
  },
  clap: () => {
    // 모둠 완성 "짝짝짝!"
    ;[0, 0.12, 0.24].forEach((t) => tone(1200, t, 0.06, { type: 'square', gain: 0.1 }))
    tone(659, 0.36, 0.35, { type: 'triangle' })
  },
  shutter: () => {
    // PDF 저장 "찰칵!"
    tone(1800, 0, 0.04, { type: 'square', gain: 0.08 })
    tone(900, 0.06, 0.08, { type: 'square', gain: 0.08 })
  },
  click: () => tone(660, 0, 0.05, { type: 'sine', gain: 0.08 }),
}

export function play(name) {
  if (!soundEnabled()) return
  try {
    SOUNDS[name]?.()
  } catch {
    /* 자동재생 정책 등으로 실패해도 UI는 계속 진행 */
  }
}
