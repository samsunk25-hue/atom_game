import { LEVEL_SCORE, ROLES, getCharacter } from './characters.js'

/**
 * 모둠 구성 알고리즘 (로컬 서치 기반).
 * 우선순위 (아래로 갈수록 가중치가 작다):
 *   0. 교사 지정 분리/고정 (절대 조건)
 *   0. 기피 학생 절대 배제 (Hard Constraint)
 *   1. 성적(level) 골고루 배분 ★ 1순위
 *   2. I/E 혼합 — 한 모둠에 E와 I가 모두 있어야 함 ★ 2순위
 *   3. 최근 3회 같은 모둠 감점
 *   4. 희망 학생 반영
 *   5. 친구 편중 방지
 *   6. 남녀 균형
 *   7. 과학 흥미 균형
 *   8. 탐구 스타일(캐릭터) 균형
 *   9. 역할 균형
 */
const W = {
  pinApart: 200000,   // 교사가 지정한 분리 — 학생 기피보다 우선
  pinTogether: 150000, // 교사가 지정한 고정 짝
  avoid: 100000,       // Hard Constraint: 기피
  score: 120,          // ★ 1순위: 성적 골고루 배분
  ieBalance: 90,       // ★ 2순위: I/E 혼합 (E·I 모두 있어야 감점 0)
  recent: 60,          // 최근 3회 재회
  wish: 45,            // 희망 반영(보너스)
  clique: 30,          // 친구 편중
  gender: 18,          // 남녀 균형
  interest: 12,        // 과학 흥미 균형
  style: 10,           // 탐구 스타일 중복 감점
  role: 8,             // 역할 균형
}

/**
 * 총원과 모둠 최대 인원으로 모둠 크기 배열을 만든다.
 * teamSize는 상한이므로 어떤 모둠도 이 인원을 넘지 않는다. 나머지는 앞 모둠부터 1명씩 더 배치.
 */
export function planGroupSizes(total, teamSize) {
  if (total <= 0 || teamSize <= 0) return []
  const count = Math.max(1, Math.ceil(total / teamSize))
  const base = Math.floor(total / count)
  let rest = total - base * count
  const sizes = []
  for (let i = 0; i < count; i++) {
    sizes.push(base + (rest > 0 ? 1 : 0))
    if (rest > 0) rest--
  }
  return sizes
}

export function describePlan(total, teamSize) {
  const sizes = planGroupSizes(total, teamSize)
  if (!sizes.length) return { count: 0, sizes: [], text: '인원을 입력해 주세요' }
  const map = new Map()
  sizes.forEach((s) => map.set(s, (map.get(s) || 0) + 1))
  const text = [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([size, n]) => `${size}명 × ${n}모둠`)
    .join(' + ')
  return { count: sizes.length, sizes, text }
}

/* ─────────────────────────── 비용 함수 ─────────────────────────── */

function variance(nums) {
  if (!nums.length) return 0
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length
  return nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length
}

function pairCost(a, b, ctx) {
  let cost = 0
  const { recentPairs, wishCount, together, apart } = ctx
  const pk = pairKey(a.sid, b.sid)

  // 교사 지정이 학생 응답보다 앞선다
  if (apart.has(pk)) cost += W.pinApart
  if (together.has(pk)) cost -= W.pinTogether

  if ((a.avoid || []).includes(b.sid) || (b.avoid || []).includes(a.sid)) cost += W.avoid

  cost += (recentPairs.get(pk) || 0) * W.recent

  const aWantsB = (a.wish || []).includes(b.sid)
  const bWantsA = (b.wish || []).includes(a.sid)
  if (aWantsB && bWantsA) cost -= W.wish * 1.5 // 상호 희망
  else if (aWantsB || bWantsA) cost -= W.wish

  // 친구 편중 방지: 인기 많은 학생이 한 모둠에 몰리는 것을 억제
  cost += ((wishCount.get(a.sid) || 0) * (wishCount.get(b.sid) || 0) * W.clique) / 10

  return cost
}

function groupBalanceCost(group) {
  if (group.length < 2) return 0
  let cost = 0

  // ★ 1순위: 성적(level) 다양성 — high·mid·low 가 섞일수록 감점 0에 가까워진다
  const levels = new Set(group.map((s) => s.level))
  cost += (3 - levels.size) * W.score

  // ★ 2순위: I/E 혼합 — E(활발형)와 I(집중형)가 모두 있어야 한다
  //   캐릭터 코드의 첫 글자가 'E' 이면 외향(활발형), 'I' 이면 내향(집중형)
  const hasE = group.some((s) => (s.character || '')[0] === 'E')
  const hasI = group.some((s) => (s.character || '')[0] === 'I')
  if (!hasE || !hasI) cost += W.ieBalance

  // 남녀 균형: 한쪽 성별로 쏠릴수록 감점
  const male = group.filter((s) => s.gender === 'M').length
  const female = group.filter((s) => s.gender === 'F').length
  if (male + female > 0) cost += Math.abs(male - female) * W.gender

  // 과학 흥미 균형: 흥미 '상'이 한 명도 없는 모둠은 감점
  if (!group.some((s) => s.interest === 'high')) cost += W.interest * 2

  // 탐구 스타일 균형: 같은 캐릭터 중복 감점
  const styles = new Map()
  group.forEach((s) => styles.set(s.character, (styles.get(s.character) || 0) + 1))
  styles.forEach((n) => {
    if (n > 1) cost += (n - 1) * W.style
  })

  // 역할 균형: 희망 역할이 겹칠수록 감점
  const roles = new Map()
  group.forEach((s) => roles.set(s.role, (roles.get(s.role) || 0) + 1))
  roles.forEach((n) => {
    if (n > 1) cost += (n - 1) * W.role
  })

  return cost
}

function totalCost(groups, ctx) {
  let cost = 0
  for (const group of groups) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        cost += pairCost(group[i], group[j], ctx)
      }
    }
    cost += groupBalanceCost(group)
  }

  // ★ 1순위: 모둠 간 평균 성적 편차를 강하게 감점 (가중치 크게)
  const mean = (key) => (g) =>
    g.reduce((a, s) => a + (LEVEL_SCORE[s[key]] || 2), 0) / Math.max(1, g.length)
  cost += variance(groups.map(mean('level'))) * W.score * 12

  // ★ 1순위: 성적 등급별 학생 수를 모둠 간에 고르게 (상·중·하 각각 편차 합산)
  for (const lv of ['high', 'mid', 'low']) {
    cost += variance(groups.map((g) => g.filter((s) => s.level === lv).length)) * W.score * 8
  }

  // ★ 2순위: E 학생 수를 모둠 간에 고르게 (한 모둠에 E만 몰리거나 I만 몰리면 감점)
  cost += variance(groups.map((g) => g.filter((s) => (s.character || '')[0] === 'E').length)) * W.ieBalance * 6

  // 모둠 간 평균 흥미 편차
  cost += variance(groups.map(mean('interest'))) * W.interest * 4

  // 흥미 '상' 학생 수 자체를 모둠 간에 고르게
  cost += variance(groups.map((g) => g.filter((s) => s.interest === 'high').length)) * W.interest * 10
  return cost
}

function pairKey(a, b) {
  return [a, b].sort().join('|')
}

/* ─────────────────────────── 탐색 ─────────────────────────── */

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function split(students, sizes) {
  const groups = []
  let idx = 0
  for (const size of sizes) {
    groups.push(students.slice(idx, idx + size))
    idx += size
  }
  return groups
}

/**
 * @param students 제출 학생 배열 (결석 제외된 상태)
 * @param teamSize 팀 구성 인원
 * @param history  과거 모둠 기록 (최근 것이 앞) — [[[sid,...], ...], ...]
 */
export function buildGroups(students, teamSize, history = [], pins = []) {
  const sizes = planGroupSizes(students.length, teamSize)
  if (!sizes.length) return { groups: [], cost: 0, violations: [] }

  // 최근 3회 같은 모둠이었던 쌍의 횟수
  const recentPairs = new Map()
  history.slice(0, 3).forEach((round, roundIdx) => {
    const weight = 3 - roundIdx // 최근일수록 무겁게
    round.forEach((g) => {
      for (let i = 0; i < g.length; i++) {
        for (let j = i + 1; j < g.length; j++) {
          const k = pairKey(g[i], g[j])
          recentPairs.set(k, (recentPairs.get(k) || 0) + weight)
        }
      }
    })
  })

  // 희망을 많이 받은 학생(인기도) — 편중 방지에 사용
  const wishCount = new Map()
  students.forEach((s) => (s.wish || []).forEach((t) => wishCount.set(t, (wishCount.get(t) || 0) + 1)))

  // 교사가 지정한 고정 짝 / 분리 짝
  const together = new Set(
    pins.filter((p) => p.mode === 'together').map((p) => pairKey(Number(p.a), Number(p.b))),
  )
  const apart = new Set(
    pins.filter((p) => p.mode === 'apart').map((p) => pairKey(Number(p.a), Number(p.b))),
  )

  const ctx = { recentPairs, wishCount, together, apart }

  let best = null
  let bestCost = Infinity

  for (let restart = 0; restart < 8; restart++) {
    let groups = split(shuffle(students), sizes)
    let cost = totalCost(groups, ctx)

    // 두 학생을 맞바꾸며 비용이 줄면 채택 (담금질 없이 다중 재시작 힐클라이밍)
    for (let step = 0; step < 4000; step++) {
      const gi = Math.floor(Math.random() * groups.length)
      let gj = Math.floor(Math.random() * groups.length)
      if (gi === gj) gj = (gj + 1) % groups.length
      if (gi === gj) break
      const si = Math.floor(Math.random() * groups[gi].length)
      const sj = Math.floor(Math.random() * groups[gj].length)

      const a = groups[gi][si]
      const b = groups[gj][sj]
      groups[gi][si] = b
      groups[gj][sj] = a
      const next = totalCost(groups, ctx)
      if (next <= cost) {
        cost = next
      } else {
        groups[gi][si] = a
        groups[gj][sj] = b
      }
    }

    if (cost < bestCost) {
      bestCost = cost
      best = groups.map((g) => [...g])
    }
  }

  return { groups: best, cost: bestCost, violations: findViolations(best, pins) }
}

/** 지켜지지 않은 조건 (인원 구조상 불가능하거나 탐색이 못 찾은 경우) */
export function findViolations(groups, pins = []) {
  const out = []
  const groupOf = new Map()
  groups.forEach((g, gi) => g.forEach((s) => groupOf.set(String(s.sid), gi)))

  groups.forEach((g, gi) => {
    for (let i = 0; i < g.length; i++) {
      for (let j = i + 1; j < g.length; j++) {
        const a = g[i]
        const b = g[j]
        if ((a.avoid || []).includes(b.sid) || (b.avoid || []).includes(a.sid)) {
          out.push({ group: gi + 1, a: a.sid, b: b.sid, kind: 'avoid' })
        }
      }
    }
  })

  pins.forEach((p) => {
    const ga = groupOf.get(String(p.a))
    const gb = groupOf.get(String(p.b))
    if (ga == null || gb == null) return
    if (p.mode === 'together' && ga !== gb) {
      out.push({ group: ga + 1, a: p.a, b: p.b, kind: 'together' })
    }
    if (p.mode === 'apart' && ga === gb) {
      out.push({ group: ga + 1, a: p.a, b: p.b, kind: 'apart' })
    }
  })
  return out
}

/* ─────────────────────────── 자리 배치 · 팀 분석 ─────────────────────────── */

// 2×2 마주 보는 책상: 0·1은 앞줄(칠판 쪽), 2·3은 뒷줄. 5명이면 4번은 옆자리.
const ROLE_SEAT_PRIORITY = ['present', 'record', 'experiment', 'observe', 'arrange']

export function assignSeats(group) {
  const remaining = [...group]
  const seated = []
  // 발표·기록은 앞줄, 실험·관찰은 뒷줄(실험 도구 쪽)에 우선 배치
  for (const role of ROLE_SEAT_PRIORITY) {
    const idx = remaining.findIndex((s) => s.role === role)
    if (idx >= 0) seated.push(remaining.splice(idx, 1)[0])
  }
  seated.push(...remaining)
  return seated.map((student, seat) => ({ ...student, seat }))
}

const CHEMI_TITLES = {
  creative: { title: '아이디어 폭발 모둠', emoji: '💡' },
  logic: { title: '냉철한 분석 모둠', emoji: '🔬' },
  teamwork: { title: '찰떡 케미 모둠', emoji: '🤝' },
  drive: { title: '불도저 추진 모둠', emoji: '🔥' },
  speak: { title: '발표 맛집 모둠', emoji: '🎤' },
}
const BALANCED = { title: '균형 잡힌 만능 모둠', emoji: '⚖️' }

/** 캐릭터 코드와 역할에서 팀 능력치(0~100)를 뽑는다. */
export function teamStats(group) {
  const acc = { drive: 0, creative: 0, teamwork: 0, logic: 0, speak: 0 }
  group.forEach((s) => {
    const c = s.character || ''
    if (c[0] === 'E') { acc.drive += 2; acc.speak += 2 } else { acc.logic += 1; acc.teamwork += 1 }
    if (c[1] === 'P') { acc.drive += 2; acc.logic += 1 } else { acc.creative += 3 }
    if (c[2] === 'D') { acc.drive += 2; acc.speak += 1 } else { acc.teamwork += 3 }
    if (c[3] === 'F') { acc.creative += 2; acc.teamwork += 1 } else { acc.logic += 3 }
    if (s.role === 'present') acc.speak += 3
    if (s.role === 'record') acc.logic += 2
    if (s.role === 'experiment') acc.drive += 2
    if (s.role === 'observe') acc.logic += 2
    if (s.role === 'arrange') acc.teamwork += 2
  })
  const n = Math.max(1, group.length)
  const scale = (v) => Math.min(100, Math.round((v / (n * 7)) * 100))
  const stats = {
    drive: scale(acc.drive),
    creative: scale(acc.creative),
    teamwork: scale(acc.teamwork),
    logic: scale(acc.logic),
    speak: scale(acc.speak),
  }
  return stats
}

/** 가장 두드러진 능력치로 케미 타이틀을 붙인다. 1위가 공동이면 '균형' 타이틀. */
export function chemiTitle(group) {
  const stats = teamStats(group)
  const ranked = Object.entries(stats).sort((a, b) => b[1] - a[1])
  const [topKey, topVal] = ranked[0]
  const secondVal = ranked[1]?.[1] ?? 0
  const found = topVal > secondVal ? CHEMI_TITLES[topKey] : BALANCED
  return { ...found, stats }
}

export const STAT_LABELS = {
  drive: '추진력',
  creative: '창의력',
  teamwork: '협동력',
  logic: '논리력',
  speak: '발표력',
}

export function roleSummary(group) {
  return ROLES.map((r) => ({ ...r, count: group.filter((s) => s.role === r.key).length })).filter(
    (r) => r.count > 0,
  )
}

export function characterOf(student) {
  return getCharacter(student.character)
}
