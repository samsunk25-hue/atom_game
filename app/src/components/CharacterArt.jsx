import { getCharacter } from '../lib/characters.js'

/**
 * 16종 캐릭터 손그림 (SVG).
 *
 * 그림이 성향을 "설명"하도록, 동물 얼굴은 종을 나타내고 나머지 요소는 4축이 결정한다.
 *   1축 E/I : 벌린 입 + 반짝임      / 다문 미소 + 볼터치
 *   2축 P/T : 체크리스트 클립보드   / 번쩍이는 아이디어 스파크
 *   3축 D/S : 깃발 든 팔            / 별을 받쳐 든 두 손
 *   4축 F/L : 하트 눈 + 하트        / 동그란 안경 + 톱니바퀴
 * 축의 의미를 바꾸더라도 아래 EXPR/PROP/ARM/EYES 만 손보면 16종에 한 번에 반영된다.
 *
 * 좌표계는 100×100. 머리 중심 (50,40) r=25, 몸통은 y 62~94.
 */

const INK = '#4A3B36' // 손그림 느낌의 따뜻한 갈색 외곽선
const SW = 2.6 // 기본 선 두께

/* ─────────────────── 동물별 머리 (종 구분) ─────────────────── */
// c: 주 색, d: 진한 색(귀 안쪽·무늬), 각 함수는 <g>로 감쌀 조각들을 돌려준다.

const ANIMALS = {
  // 🦁 불꽃 사자 — 갈기
  EPDF: (c, d) => (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <circle key={i} cx={50 + Math.cos(a) * 27} cy={40 + Math.sin(a) * 27} r="9" fill={d} stroke={INK} strokeWidth={SW} />
        )
      })}
      <circle cx="50" cy="40" r="25" fill={c} stroke={INK} strokeWidth={SW} />
      <ellipse cx="50" cy="48" rx="11" ry="8" fill="#fff8f0" stroke={INK} strokeWidth="1.8" />
    </>
  ),
  // 🦊 똑똑 여우 — 뾰족 귀 + 뾰족 코
  EPDL: (c, d) => (
    <>
      <path d="M28 26 L24 6 L42 18 Z" fill={c} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M72 26 L76 6 L58 18 Z" fill={c} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <circle cx="50" cy="40" r="25" fill={c} stroke={INK} strokeWidth={SW} />
      <path d="M38 50 Q50 44 62 50 Q50 62 38 50 Z" fill="#fff8f0" stroke={INK} strokeWidth="1.8" />
    </>
  ),
  // 🐶 다정 강아지 — 늘어진 귀
  EPSF: (c, d) => (
    <>
      <ellipse cx="25" cy="42" rx="9" ry="17" fill={d} stroke={INK} strokeWidth={SW} />
      <ellipse cx="75" cy="42" rx="9" ry="17" fill={d} stroke={INK} strokeWidth={SW} />
      <circle cx="50" cy="40" r="25" fill={c} stroke={INK} strokeWidth={SW} />
      <ellipse cx="50" cy="50" rx="12" ry="9" fill="#fff8f0" stroke={INK} strokeWidth="1.8" />
    </>
  ),
  // 🦫 성실 비버 — 작은 귀 + 앞니
  EPSL: (c, d) => (
    <>
      <circle cx="28" cy="22" r="7" fill={d} stroke={INK} strokeWidth={SW} />
      <circle cx="72" cy="22" r="7" fill={d} stroke={INK} strokeWidth={SW} />
      <circle cx="50" cy="40" r="25" fill={c} stroke={INK} strokeWidth={SW} />
      <rect x="44" y="50" width="12" height="13" rx="2" fill="#fffdf6" stroke={INK} strokeWidth="1.8" />
      <line x1="50" y1="50" x2="50" y2="63" stroke={INK} strokeWidth="1.4" />
    </>
  ),
  // 🐰 통통 토끼 — 긴 귀
  ETDF: (c, d) => (
    <>
      <ellipse cx="39" cy="12" rx="7" ry="18" fill={c} stroke={INK} strokeWidth={SW} />
      <ellipse cx="61" cy="12" rx="7" ry="18" fill={c} stroke={INK} strokeWidth={SW} />
      <ellipse cx="39" cy="13" rx="3" ry="11" fill={d} />
      <ellipse cx="61" cy="13" rx="3" ry="11" fill={d} />
      <circle cx="50" cy="40" r="25" fill={c} stroke={INK} strokeWidth={SW} />
      <path d="M46 52 h8 l-4 5 Z" fill={d} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
    </>
  ),
  // 🐦‍⬛ 호기심 까마귀 — 머리깃 + 부리
  ETDL: (c, d) => (
    <>
      <path d="M42 17 L46 2 L54 16" fill={d} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <circle cx="50" cy="40" r="25" fill={c} stroke={INK} strokeWidth={SW} />
      <path d="M50 46 L68 52 L50 58 Z" fill="#FFC46B" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
    </>
  ),
  // 🦦 방긋 수달 — 넓은 주둥이 + 수염
  ETSF: (c, d) => (
    <>
      <circle cx="30" cy="24" r="6.5" fill={d} stroke={INK} strokeWidth={SW} />
      <circle cx="70" cy="24" r="6.5" fill={d} stroke={INK} strokeWidth={SW} />
      <circle cx="50" cy="40" r="25" fill={c} stroke={INK} strokeWidth={SW} />
      <ellipse cx="50" cy="52" rx="14" ry="10" fill="#fff8f0" stroke={INK} strokeWidth="1.8" />
      <line x1="28" y1="50" x2="38" y2="52" stroke={INK} strokeWidth="1.4" />
      <line x1="72" y1="50" x2="62" y2="52" stroke={INK} strokeWidth="1.4" />
    </>
  ),
  // 🦝 느긋 라쿤 — 눈가 무늬
  ETSL: (c, d) => (
    <>
      <path d="M27 24 L26 8 L41 18 Z" fill={c} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M73 24 L74 8 L59 18 Z" fill={c} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <circle cx="50" cy="40" r="25" fill={c} stroke={INK} strokeWidth={SW} />
      <path d="M28 36 Q40 28 46 38 Q40 46 28 42 Z" fill={d} opacity="0.75" />
      <path d="M72 36 Q60 28 54 38 Q60 46 72 42 Z" fill={d} opacity="0.75" />
      <ellipse cx="50" cy="52" rx="9" ry="7" fill="#fff8f0" stroke={INK} strokeWidth="1.8" />
    </>
  ),
  // 🐻 든든 곰 — 큰 둥근 귀
  IPDF: (c, d) => (
    <>
      <circle cx="27" cy="19" r="11" fill={c} stroke={INK} strokeWidth={SW} />
      <circle cx="73" cy="19" r="11" fill={c} stroke={INK} strokeWidth={SW} />
      <circle cx="27" cy="19" r="5" fill={d} />
      <circle cx="73" cy="19" r="5" fill={d} />
      <circle cx="50" cy="40" r="25" fill={c} stroke={INK} strokeWidth={SW} />
      <ellipse cx="50" cy="51" rx="12" ry="9" fill="#fff8f0" stroke={INK} strokeWidth="1.8" />
    </>
  ),
  // 🦉 차분 올빼미 — 깃털 뿔 + 부리
  IPDL: (c, d) => (
    <>
      <path d="M30 20 L27 5 L41 15 Z" fill={d} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M70 20 L73 5 L59 15 Z" fill={d} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <circle cx="50" cy="40" r="25" fill={c} stroke={INK} strokeWidth={SW} />
      <circle cx="41" cy="38" r="10" fill="#fffdf6" stroke={INK} strokeWidth="1.6" />
      <circle cx="59" cy="38" r="10" fill="#fffdf6" stroke={INK} strokeWidth="1.6" />
      <path d="M50 46 L55 53 L45 53 Z" fill="#FFC46B" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
    </>
  ),
  // 🐑 포근 양 — 뭉게뭉게 털
  IPSF: (c, d) => (
    <>
      {[[32, 20], [50, 13], [68, 20], [26, 34], [74, 34]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="11" fill="#FFFDF8" stroke={INK} strokeWidth={SW} />
      ))}
      <ellipse cx="22" cy="44" rx="8" ry="5" fill={d} stroke={INK} strokeWidth={SW} />
      <ellipse cx="78" cy="44" rx="8" ry="5" fill={d} stroke={INK} strokeWidth={SW} />
      <circle cx="50" cy="43" r="22" fill={c} stroke={INK} strokeWidth={SW} />
    </>
  ),
  // 🐢 꼼꼼 거북 — 등딱지(몸통에서 처리) + 작은 머리
  IPSL: (c, d) => (
    <>
      <circle cx="50" cy="40" r="23" fill={c} stroke={INK} strokeWidth={SW} />
      <ellipse cx="50" cy="52" rx="10" ry="7" fill="#fff8f0" stroke={INK} strokeWidth="1.8" />
    </>
  ),
  // 🐱 반짝 고양이 — 삼각 귀 + 수염
  ITDF: (c, d) => (
    <>
      <path d="M30 24 L28 6 L44 17 Z" fill={c} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M70 24 L72 6 L56 17 Z" fill={c} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M32 20 L31 11 L40 17 Z" fill={d} />
      <path d="M68 20 L69 11 L60 17 Z" fill={d} />
      <circle cx="50" cy="40" r="25" fill={c} stroke={INK} strokeWidth={SW} />
      <path d="M46 51 h8 l-4 4 Z" fill={d} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="26" y1="48" x2="38" y2="51" stroke={INK} strokeWidth="1.4" />
      <line x1="74" y1="48" x2="62" y2="51" stroke={INK} strokeWidth="1.4" />
    </>
  ),
  // 🐙 신비 문어 — 돔 머리 (다리는 몸통에서)
  ITDL: (c, d) => (
    <>
      <path d="M25 46 Q25 14 50 14 Q75 14 75 46 Z" fill={c} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <circle cx="36" cy="24" r="4" fill={d} opacity="0.6" />
      <circle cx="62" cy="21" r="3" fill={d} opacity="0.6" />
    </>
  ),
  // 🐼 조용 판다 — 검은 귀 + 눈 무늬
  ITSF: (c, d) => (
    <>
      <circle cx="27" cy="20" r="10" fill={INK} />
      <circle cx="73" cy="20" r="10" fill={INK} />
      <circle cx="50" cy="40" r="25" fill={c} stroke={INK} strokeWidth={SW} />
      <ellipse cx="40" cy="38" rx="9" ry="11" fill={INK} transform="rotate(-15 40 38)" />
      <ellipse cx="60" cy="38" rx="9" ry="11" fill={INK} transform="rotate(15 60 38)" />
      <ellipse cx="50" cy="53" rx="8" ry="6" fill="#fff8f0" stroke={INK} strokeWidth="1.6" />
    </>
  ),
  // 🐧 관찰 펭귄 — 흰 얼굴 + 부리
  ITSL: (c, d) => (
    <>
      <circle cx="50" cy="40" r="25" fill={d} stroke={INK} strokeWidth={SW} />
      <ellipse cx="50" cy="44" rx="18" ry="19" fill="#FFFDF8" stroke={INK} strokeWidth="1.6" />
      <path d="M50 48 L58 54 L50 58 L42 54 Z" fill="#FFB65C" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
    </>
  ),
}

/* ─────────────────── 몸통 (일부 종은 특별) ─────────────────── */

function Body({ code, c, d }) {
  if (code === 'ITDL') {
    // 문어 다리
    return (
      <g>
        {[-24, -12, 0, 12, 24].map((dx, i) => (
          <path
            key={i}
            d={`M${50 + dx} 46 q${dx / 2} 22 ${dx * 0.8} 34`}
            fill="none"
            stroke={INK}
            strokeWidth="7"
            strokeLinecap="round"
          />
        ))}
        {[-24, -12, 0, 12, 24].map((dx, i) => (
          <path
            key={`i${i}`}
            d={`M${50 + dx} 46 q${dx / 2} 22 ${dx * 0.8} 34`}
            fill="none"
            stroke={c}
            strokeWidth="4"
            strokeLinecap="round"
          />
        ))}
      </g>
    )
  }
  if (code === 'IPSL') {
    // 거북 등딱지
    return (
      <g>
        <ellipse cx="50" cy="76" rx="27" ry="19" fill={d} stroke={INK} strokeWidth={SW} />
        <path d="M32 74 h36 M50 58 v34" stroke={INK} strokeWidth="1.6" opacity="0.6" />
      </g>
    )
  }
  return <path d="M28 94 Q28 62 50 62 Q72 62 72 94 Z" fill={c} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
}

/* ─────────────────── 4축이 만드는 표정·소품 ─────────────────── */

// 4축 F/L — 눈
function Eyes({ logical }) {
  if (logical) {
    return (
      <g>
        <circle cx="41" cy="38" r="8.5" fill="none" stroke={INK} strokeWidth="2.2" />
        <circle cx="59" cy="38" r="8.5" fill="none" stroke={INK} strokeWidth="2.2" />
        <line x1="49.5" y1="38" x2="50.5" y2="38" stroke={INK} strokeWidth="2.2" />
        <circle cx="41" cy="38" r="3" fill={INK} />
        <circle cx="59" cy="38" r="3" fill={INK} />
      </g>
    )
  }
  // 하트 눈
  const heart = (x) => `M${x} 42 L${x - 5} 37 a3.4 3.4 0 0 1 5-4.4 a3.4 3.4 0 0 1 5 4.4 Z`
  return (
    <g>
      <path d={heart(41)} fill="#FF7EA6" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
      <path d={heart(59)} fill="#FF7EA6" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
    </g>
  )
}

// 1축 E/I — 입과 주변
function Expression({ outgoing }) {
  if (outgoing) {
    return (
      <g>
        <path d="M43 57 q7 9 14 0 Z" fill="#E0577A" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 26 l3 6 6 3 -6 3 -3 6 -3-6 -6-3 6-3 Z" fill="#FFD76B" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M88 34 l2.2 4.4 4.4 2.2 -4.4 2.2 -2.2 4.4 -2.2-4.4 -4.4-2.2 4.4-2.2 Z" fill="#FFD76B" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      </g>
    )
  }
  return (
    <g>
      <path d="M44 58 q6 5 12 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="30" cy="50" rx="6" ry="4" fill="#FFA9C0" opacity="0.7" />
      <ellipse cx="70" cy="50" rx="6" ry="4" fill="#FFA9C0" opacity="0.7" />
    </g>
  )
}

// 2축 P/T — 왼손 소품
function Prop({ planned }) {
  if (planned) {
    // 체크리스트 클립보드
    return (
      <g>
        <rect x="6" y="58" width="22" height="28" rx="3" fill="#FFF6E4" stroke={INK} strokeWidth="2.2" />
        <rect x="13" y="54" width="8" height="6" rx="2" fill="#D8C3A5" stroke={INK} strokeWidth="1.8" />
        {[66, 74, 82].map((y, i) => (
          <g key={i}>
            <path d={`M10 ${y} l2.5 2.5 4-5`} fill="none" stroke="#5BAE7F" strokeWidth="2" strokeLinecap="round" />
            <line x1="19" y1={y} x2="25" y2={y} stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
          </g>
        ))}
      </g>
    )
  }
  // 즉흥: 번쩍이는 아이디어
  return (
    <g>
      <path d="M20 54 l-8 18 h8 l-6 16 16-20 h-8 Z" fill="#FFD76B" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="9" cy="80" r="2.6" fill="#FFB65C" stroke={INK} strokeWidth="1.2" />
      <circle cx="30" cy="60" r="2" fill="#FFB65C" stroke={INK} strokeWidth="1.1" />
    </g>
  )
}

// 3축 D/S — 오른팔
function Arm({ leading }) {
  if (leading) {
    // 깃발을 높이 든 팔
    return (
      <g>
        <path d="M72 76 q12 -6 15 -26" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        <line x1="88" y1="52" x2="88" y2="22" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M88 24 q10 4 0 9 Z" fill="#FF8FB1" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      </g>
    )
  }
  // 별을 받쳐 든 두 손
  return (
    <g>
      <path d="M72 76 q10 2 12 -6" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
      <path
        d="M84 52 l3.2 6.6 7.3 1 -5.3 5.1 1.3 7.2 -6.5-3.4 -6.5 3.4 1.3-7.2 -5.3-5.1 7.3-1 Z"
        fill="#FFD76B"
        stroke={INK}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </g>
  )
}

// 4축 F 보조 — 떠다니는 하트 / L 보조 — 톱니바퀴
function Aura({ logical }) {
  if (logical) {
    return (
      <g opacity="0.85">
        <circle cx="17" cy="16" r="6" fill="none" stroke={INK} strokeWidth="2" />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <line
              key={i}
              x1={17 + Math.cos(a) * 6}
              y1={16 + Math.sin(a) * 6}
              x2={17 + Math.cos(a) * 9}
              y2={16 + Math.sin(a) * 9}
              stroke={INK}
              strokeWidth="2"
              strokeLinecap="round"
            />
          )
        })}
      </g>
    )
  }
  return (
    <g>
      <path d="M18 18 L12 12 a4 4 0 0 1 6-5.2 a4 4 0 0 1 6 5.2 Z" fill="#FF9FBB" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M84 12 L80 8 a2.6 2.6 0 0 1 4-3.4 a2.6 2.6 0 0 1 4 3.4 Z" fill="#FFC2D4" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
    </g>
  )
}

/** 색을 조금 진하게 (귀 안쪽·무늬용) */
function darken(hex, amount = 0.16) {
  const n = parseInt(hex.replace('#', ''), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.max(0, Math.round(v * (1 - amount))),
  )
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/**
 * @param code    4축 코드 (예: 'EPDF')
 * @param size    픽셀 크기
 * @param plain   true면 소품·아우라 없이 얼굴만 (작은 자리에 쓸 때)
 */
export default function CharacterArt({ code, size = 96, plain = false, className = '' }) {
  const meta = getCharacter(code)
  const draw = ANIMALS[code]
  if (!draw) return <span style={{ fontSize: size * 0.8 }}>{meta.emoji}</span>

  const c = meta.color
  const d = darken(c, 0.18)
  const [outgoing, planned, leading, feeling] = [code[0] === 'E', code[1] === 'P', code[2] === 'D', code[3] === 'F']

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${meta.name} — ${meta.desc}`}
    >
      <title>{`${meta.name} · ${meta.desc}`}</title>
      {!plain && <Aura logical={!feeling} />}
      {!plain && <Prop planned={planned} />}
      {!plain && <Arm leading={leading} />}
      <Body code={code} c={c} d={d} />
      {draw(c, d)}
      <Eyes logical={!feeling} />
      <Expression outgoing={outgoing} />
    </svg>
  )
}
