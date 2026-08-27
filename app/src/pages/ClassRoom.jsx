import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import Layout from '../components/Layout.jsx'
import {
  createClass,
  getAuthError,
  getClass,
  listStudents,
  makeClassCode,
  removeStudent,
  subscribeClass,
  subscribeStudents,
  updateClass,
  upsertStudent,
} from '../lib/db.js'
import { buildGroups, describePlan } from '../lib/grouping.js'
import { CHARACTERS, CHARACTER_CODES, LEVELS, ROLES, getCharacter, getRole } from '../lib/characters.js'
import { buildReports, downloadReportDoc } from '../lib/report.js'
import { play } from '../lib/sound.js'

const DANCERS = Object.values(CHARACTERS).map((c) => c.emoji)

/** 모둠 구성 연출 시간(초) — 카운트다운이 끝나면 자리표를 공개한다. */
const COUNTDOWN_SEC = 3

function appUrl(hash) {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#${hash}`
}

/** 학생용 — QR이 가리키는 주소 */
const studentUrl = (code) => appUrl(`/s/${code}`)

/** 교사용 — 이 학급 관리 화면으로 바로 오는 주소 (북마크용) */
const teacherUrl = (code) => appUrl(`/class/${code}`)

/** 교사용 — 자리표 화면 주소 */
const seatsUrl = (code) => appUrl(`/class/${code}/seats`)

function Dist({ title, items }) {
  const total = items.reduce((a, b) => a + b.count, 0) || 1
  return (
    <div style={{ flex: 1, minWidth: 220 }}>
      <b style={{ fontSize: 13 }}>{title}</b>
      <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
        {items.map((it) => (
          <div key={it.label} style={{ display: 'grid', gridTemplateColumns: '68px 1fr 34px', gap: 8, alignItems: 'center', fontSize: 12.5 }}>
            <span>{it.label}</span>
            <div className="bar">
              <i style={{ width: `${(it.count / total) * 100}%` }} />
            </div>
            <span style={{ textAlign: 'right' }}>{it.count}명</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ClassRoom() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [cls, setCls] = useState(null)
  const [students, setStudents] = useState([])
  const [qr, setQr] = useState('')
  const [building, setBuilding] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_SEC)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState('')
  const [namesOpen, setNamesOpen] = useState(false)
  const [namesDraft, setNamesDraft] = useState('')
  const [pinForm, setPinForm] = useState({ a: '', b: '', mode: 'together' })
  const [noteSid, setNoteSid] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [reports, setReports] = useState(null)
  // 교사 별명이 없으면 교사용 관리 화면 대신 학생용 자리표로 보낸다.
  const isTeacher = !!localStorage.getItem('moodum:teacher')

  useEffect(() => {
    if (!isTeacher) {
      navigate(`/s/${code}/room`, { replace: true })
      return
    }
    getClass(code).then((c) => setNotFound(!c))
    const a = subscribeClass(code, (c) => c && setCls(c))
    const b = subscribeStudents(code, setStudents)
    return () => {
      a()
      b()
    }
  }, [code, isTeacher, navigate])

  // 모둠 구성 연출: 10초 카운트다운
  useEffect(() => {
    if (!building) return
    const id = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [building])

  useEffect(() => {
    QRCode.toDataURL(studentUrl(code), { width: 400, margin: 1, color: { dark: '#4a4258', light: '#ffffff' } }).then(setQr)
  }, [code])

  // 실제로 설문을 낸 학생만 배치 대상이다.
  // 제출하지 않은 학생을 결석 처리하면 submittedAt 없는 자리 표시용 문서가 생긴다.
  const submittedList = useMemo(() => students.filter((s) => s.submittedAt), [students])
  const present = useMemo(() => submittedList.filter((s) => !s.absent), [submittedList])
  const absent = students.filter((s) => s.absent)
  // 포인트를 받은 학생 순위 (명예의 전당)
  const hallOfFame = useMemo(
    () =>
      students
        .filter((s) => (s.points || 0) > 0)
        .sort((a, b) => (b.points || 0) - (a.points || 0) || Number(a.sid) - Number(b.sid)),
    [students],
  )
  const missingSids = useMemo(() => {
    const known = new Set(students.map((s) => Number(s.sid)))
    return Array.from({ length: cls?.total || 0 }, (_, i) => i + 1).filter((n) => !known.has(n))
  }, [students, cls])
  const plan = useMemo(() => describePlan(present.length, cls?.teamSize || 4), [present.length, cls])

  if (notFound) {
    return (
      <Layout>
        <div className="card">
          <h2>학급을 찾을 수 없어요 😢</h2>
          <p className="sub">코드가 맞는지 확인해 주세요: {code}</p>
          <button className="btn" onClick={() => navigate('/')}>처음으로</button>
        </div>
      </Layout>
    )
  }
  if (!cls) {
    return (
      <Layout>
        <div className="card"><p className="sub" style={{ margin: 0 }}>불러오는 중…</p></div>
      </Layout>
    )
  }

  function copy(url, label) {
    // 클립보드 API가 막힌 환경(비-HTTPS 등)에서는 주소를 그대로 보여 준다.
    const done = navigator.clipboard?.writeText(url)
    if (done) done.catch(() => prompt(`${label} 링크를 복사하세요`, url))
    else prompt(`${label} 링크를 복사하세요`, url)
    setCopied(label)
    setTimeout(() => setCopied(''), 2500)
    play('pop')
  }

  async function toggleAbsent(s) {
    await upsertStudent(code, { ...s, absent: !s.absent })
    play('click')
  }

  /* ── ① 이름 명단 붙여넣기 ── */
  // "1<탭>홍길동" 또는 한 줄에 이름만(1번부터 순서대로) 둘 다 받는다.
  async function applyNames() {
    const lines = namesDraft.split('\n').map((l) => l.trim()).filter(Boolean)
    if (!lines.length) return
    let auto = 0
    const pairs = []
    for (const line of lines) {
      const m = line.match(/^(\d+)[\s,.\t)]+(.+)$/)
      if (m) pairs.push([Number(m[1]), m[2].trim()])
      else pairs.push([++auto, line])
    }
    for (const [sid, name] of pairs) {
      if (sid < 1 || sid > cls.total) continue
      const cur = students.find((s) => Number(s.sid) === sid)
      await upsertStudent(code, { ...(cur || { sid }), sid, name })
    }
    setNamesOpen(false)
    setNamesDraft('')
    play('pop')
  }

  /* ── ④ 교사 강제 지정 (짝 고정 / 분리) ── */
  async function addPin() {
    const a = Number(pinForm.a)
    const b = Number(pinForm.b)
    if (!a || !b || a === b) return alert('서로 다른 두 학번을 입력해 주세요.')
    const pins = [...(cls.pins || [])]
    if (pins.some((p) => Number(p.a) === a && Number(p.b) === b && p.mode === pinForm.mode)) return
    pins.push({ a, b, mode: pinForm.mode })
    await updateClass(code, { pins })
    setPinForm({ a: '', b: '', mode: pinForm.mode })
    play('click')
  }

  async function removePin(idx) {
    const pins = (cls.pins || []).filter((_, i) => i !== idx)
    await updateClass(code, { pins })
    play('click')
  }

  /* ── ⑦ 학급 잠금 ── */
  async function toggleLock() {
    const next = !cls.locked
    if (next && !cls.groups?.length) return alert('모둠을 먼저 구성한 뒤 잠글 수 있어요.')
    await updateClass(code, { locked: next })
    play(next ? 'clap' : 'click')
  }

  /* ── ③ 학급 복제 ── */
  async function duplicate() {
    if (!confirm('같은 학생 정보로 새 학급을 만들까요? 모둠은 새로 구성해야 해요.')) return
    const fresh = {
      ...cls,
      code: makeClassCode(),
      name: `${cls.name} (복제)`,
      groups: [],
      history: [],
      violations: [],
      locked: false,
      createdAt: Date.now(),
    }
    await createClass(fresh)
    const list = await listStudents(code)
    for (const s of list) {
      // 포인트·관찰 기록은 새 학급으로 넘기지 않는다(새로 쌓는 게 자연스럽다).
      await upsertStudent(fresh.code, { ...s, points: 0, note: '' })
    }
    play('tada')
    navigate(`/class/${fresh.code}`)
  }

  /* ── ⑤ 명예의 전당: 학생 특성 기록 ── */
  function openNote(sid) {
    const s = students.find((x) => Number(x.sid) === Number(sid))
    setNoteSid(Number(sid))
    setNoteDraft(s?.note || '')
  }

  async function saveNote() {
    const s = students.find((x) => Number(x.sid) === noteSid)
    if (s) await upsertStudent(code, { ...s, note: noteDraft.trim() })
    setNoteSid(null)
    play('pop')
  }

  /* ── 생기부 초안 ── */
  function openReports() {
    const target = submittedList.filter((s) => (s.note || '').trim() || s.points)
    if (!target.length) {
      return alert('먼저 명예의 전당에서 학생 특성을 기록하거나, 자리표에서 포인트를 주세요.')
    }
    setReports(buildReports(target))
    play('click')
  }

  /** 미제출 학생을 결석 예정으로: 제출 기록 없이 자리 표시용 문서만 만든다. */
  async function markAbsent(sid) {
    await upsertStudent(code, { sid: Number(sid), absent: true })
    play('click')
  }

  /** 결석 해제: 설문을 낸 적 없는 학생이면 문서를 지워 다시 '미제출'로 돌린다. */
  async function unmarkAbsent(sid) {
    const s = students.find((x) => Number(x.sid) === Number(sid))
    if (s?.submittedAt) await upsertStudent(code, { ...s, absent: false })
    else await removeStudent(code, Number(sid))
    play('click')
  }

  async function drop(s) {
    if (!confirm(`${s.sid}번 학생의 제출 내용을 지울까요?`)) return
    await removeStudent(code, s.sid)
  }

  /** 시연·연습용: 미제출 학번을 임의 데이터로 채운다. */
  async function fillDemo() {
    if (!confirm('미제출 학번을 임의 데이터로 채울까요? (연습·시연용)')) return
    const done = new Set(students.map((s) => String(s.sid)))
    const levels = ['high', 'mid', 'low']
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
    for (let sid = 1; sid <= cls.total; sid++) {
      if (done.has(String(sid))) continue
      const others = Array.from({ length: cls.total }, (_, i) => i + 1).filter((n) => n !== sid)
      await upsertStudent(code, {
        sid,
        gender: Math.random() < 0.5 ? 'M' : 'F',
        level: pick(levels),
        interest: pick(levels),
        character: pick(CHARACTER_CODES),
        role: pick(ROLES).key,
        wish: Math.random() < 0.7 ? [pick(others)] : [],
        avoid: Math.random() < 0.3 ? [pick(others)] : [],
        absent: false,
        submittedAt: Date.now(),
      })
    }
    play('pop')
  }

  async function run() {
    if (present.length < 2) return
    setBuilding(true)
    setCountdown(COUNTDOWN_SEC)
    play('click')
    const startedAt = Date.now()
    try {
      // 첫 렌더로 애니메이션이 뜬 뒤에 연산한다(연산 중에는 화면이 잠깐 멈춘다).
      await new Promise((r) => setTimeout(r, 600))
      const { groups, violations } = buildGroups(
        present,
        cls.teamSize,
        cls.history || [],
        cls.pins || [],
      )
      const asSids = groups.map((g) => g.map((s) => s.sid))
      const history = [asSids, ...(cls.history || [])].slice(0, 5)
      await updateClass(code, { groups: asSids, violations, history, groupedAt: Date.now() })

      // 카운트다운이 끝날 때까지 기다렸다가 자리표를 공개한다.
      const rest = COUNTDOWN_SEC * 1000 - (Date.now() - startedAt)
      if (rest > 0) await new Promise((r) => setTimeout(r, rest))
      // 교사 화면과 학생 화면이 동시에 공개되도록 revealedAt을 저장한다.
      await updateClass(code, { revealedAt: Date.now() })
      play('clap')
      navigate(`/class/${code}/seats`)
    } catch (e) {
      // 실패하면 로딩 화면에 갇히지 않도록 반드시 빠져나온다.
      alert(`모둠 구성에 실패했어요.\n${getAuthError() || e?.message || e}`)
    } finally {
      setBuilding(false)
    }
  }

  if (building) {
    return (
      <Layout>
        <div className="card loading">
          <div className="dance">
            {DANCERS.map((e, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.06}s` }}>{e}</span>
            ))}
          </div>
          <h2 style={{ marginTop: 18 }}>
            {countdown > 0 ? '친구들을 이어 주는 중…' : '두구두구… 공개합니다!'}
          </h2>
          <p className="sub">기피 조합을 피하고, 지난 모둠과 겹치지 않게 맞추고 있어요!</p>

          <div className="countdown" key={countdown}>
            {countdown > 0 ? countdown : '🎉'}
          </div>
          <div className="bar" style={{ maxWidth: 320, margin: '14px auto 0' }}>
            <i style={{ width: `${((COUNTDOWN_SEC - countdown) / COUNTDOWN_SEC) * 100}%` }} />
          </div>
          <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>
            {countdown > 0 ? `${countdown}초 뒤에 자리표가 공개돼요!` : '자리표로 이동할게요'}
          </p>
        </div>
      </Layout>
    )
  }

  const submitted = submittedList.length
  const missing = missingSids.length

  return (
    <Layout>
      <div className="card">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: 2 }}>{cls.name}</h2>
            <p className="sub" style={{ margin: 0 }}>
              {cls.year}년 · 총 {cls.total}명 · 모둠 최대 {cls.teamSize}명 · {plan.text}
              {cls.locked && <span className="badge" style={{ marginLeft: 8 }}>🔒 잠김</span>}
            </p>
          </div>
          <button className="btn ghost sm" onClick={() => navigate('/')}>
            📋 학급 목록
          </button>
          <button className="btn ghost sm" onClick={duplicate}>
            📑 학급 복제
          </button>
          <button className="btn ghost sm" onClick={toggleLock}>
            {cls.locked ? '🔓 잠금 해제' : '🔒 학급 잠그기'}
          </button>
          {cls.groups?.length > 0 && (
            <button className="btn ghost" onClick={() => navigate(`/class/${code}/seats`)}>
              저장된 자리표 보기
            </button>
          )}
          <button className="btn" onClick={run} disabled={present.length < 2}>
            🎲 모둠 구성하기
          </button>
        </div>
      </div>

      <div className="grid cols2">
        <div className="card qr-box">
          <h2>학생 접속 QR</h2>
          <p className="sub">학생은 이 QR을 스캔해 바로 참여해요. 아래 코드는 확인용이에요.</p>
          {qr && <img src={qr} alt="학생 접속 QR" />}
          <div className="code-big">{code}</div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn ghost sm" onClick={() => copy(studentUrl(code), '학생용')}>
              🧑‍🎓 학생용 링크 복사
            </button>
            <button className="btn ghost sm" onClick={() => window.open(studentUrl(code), '_blank')}>
              학생 화면 열기
            </button>
          </div>

          <div
            style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)', textAlign: 'left' }}
          >
            <b style={{ fontSize: 13.5 }}>👩‍🏫 교사용 링크</b>
            <p className="sub" style={{ margin: '4px 0 10px', fontSize: 12.5 }}>
              이 학급 관리 화면으로 바로 오는 주소예요. 즐겨찾기 해 두면 다음 시간에 바로 열려요.
              <b> 학생에게는 공유하지 마세요.</b>
            </p>
            <div className="row">
              <button className="btn ghost sm" onClick={() => copy(teacherUrl(code), '교사용')}>
                🔗 교사용 링크 복사
              </button>
              <button className="btn ghost sm" onClick={() => copy(seatsUrl(code), '자리표')}>
                🪑 자리표 링크 복사
              </button>
            </div>
            {copied && (
              <p className="sub" style={{ margin: '8px 0 0', fontSize: 12 }}>
                ✅ {copied} 링크를 복사했어요.
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <h2>실시간 제출 현황</h2>
          <p className="sub">학생이 제출하면 바로 반영돼요.</p>
          <div className="stats">
            <div className="stat">
              <b>{submitted}</b>
              <span>제출</span>
            </div>
            <div className="stat">
              <b>{missing}</b>
              <span>미제출</span>
            </div>
            <div className="stat">
              <b>{absent.length}</b>
              <span>결석 예정</span>
            </div>
            <div className="stat">
              <b>{present.length}</b>
              <span>배치 대상</span>
            </div>
          </div>
          <div className="bar" style={{ marginTop: 14 }}>
            <i style={{ width: `${Math.min(100, (submitted / Math.max(1, cls.total)) * 100)}%` }} />
          </div>

          {/* 아직 안 낸 학번을 그대로 보여 준다 — 수업 중에 바로 호명할 수 있게. */}
          <div style={{ marginTop: 16 }}>
            {missingSids.length === 0 ? (
              <p className="sub" style={{ margin: 0 }}>
                🎉 <b>모두 제출했어요!</b> 이제 모둠을 구성해 보세요.
              </p>
            ) : (
              <>
                <b style={{ fontSize: 13.5 }}>아직 안 낸 학생 {missingSids.length}명</b>
                <p className="sub" style={{ margin: '4px 0 8px', fontSize: 12.5 }}>
                  번호를 누르면 결석 예정으로 표시돼 배치에서 빠져요.
                </p>
                <div className="sid-chips">
                  {missingSids.map((sid) => (
                    <button key={sid} className="sid-chip" onClick={() => markAbsent(sid)} title="결석 예정으로 표시">
                      {sid}
                    </button>
                  ))}
                </div>
              </>
            )}

            {absent.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <b style={{ fontSize: 13.5 }}>결석 예정 {absent.length}명</b>
                <div className="sid-chips" style={{ marginTop: 8 }}>
                  {absent
                    .map((s) => s.sid)
                    .sort((a, b) => a - b)
                    .map((sid) => (
                      <button
                        key={sid}
                        className="sid-chip absent"
                        onClick={() => unmarkAbsent(sid)}
                        title="다시 참여로 되돌리기"
                      >
                        {sid} ✕
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ⑤ 명예의 전당 — 자리표에서 학번을 눌러 쌓인 포인트 */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: 2 }}>🏆 명예의 전당</h2>
            <p className="sub" style={{ margin: 0 }}>
              잠근 자리표에서 학번을 누르면 포인트가 쌓여요. 여기 학번을 누르면 특성을 기록할 수 있어요.
            </p>
          </div>
          <button className="btn accent sm" onClick={openReports}>
            📝 생기부 초안 만들기
          </button>
        </div>

        {hallOfFame.length === 0 ? (
          <p className="sub" style={{ margin: '14px 0 0' }}>
            아직 포인트를 받은 학생이 없어요. 자리표를 잠그고 학번을 눌러 칭찬해 주세요!
          </p>
        ) : (
          <div className="hall">
            {hallOfFame.map((s, i) => (
              <button key={s.sid} className="hall-item" onClick={() => openNote(s.sid)}>
                <span className="rank">{['🥇', '🥈', '🥉'][i] || `${i + 1}위`}</span>
                <b>
                  {s.sid}번{s.name ? ` ${s.name}` : ''}
                </b>
                <span className="pts">{s.points}P</span>
                {(s.note || '').trim() && <span className="has-note">✍️</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ④ 교사 강제 지정 */}
      <div className="card">
        <h2>📌 교사 지정 (모둠 구성에 우선 반영)</h2>
        <p className="sub">
          학생이 쓴 희망·기피보다 <b>먼저</b> 지켜져요. 꼭 붙이거나 꼭 떼어 놓을 짝을 지정하세요.
        </p>
        <div className="row">
          <input
            className="input"
            type="number"
            placeholder="학번"
            value={pinForm.a}
            onChange={(e) => setPinForm((f) => ({ ...f, a: e.target.value }))}
            style={{ maxWidth: 110 }}
          />
          <input
            className="input"
            type="number"
            placeholder="학번"
            value={pinForm.b}
            onChange={(e) => setPinForm((f) => ({ ...f, b: e.target.value }))}
            style={{ maxWidth: 110 }}
          />
          <select
            className="input"
            value={pinForm.mode}
            onChange={(e) => setPinForm((f) => ({ ...f, mode: e.target.value }))}
            style={{ maxWidth: 160 }}
          >
            <option value="together">같은 모둠으로</option>
            <option value="apart">다른 모둠으로</option>
          </select>
          <button className="btn ghost" style={{ flex: '0 0 auto' }} onClick={addPin}>
            추가
          </button>
        </div>
        {(cls.pins || []).length > 0 && (
          <div className="sid-chips" style={{ marginTop: 12 }}>
            {(cls.pins || []).map((p, i) => (
              <button
                key={i}
                className={`sid-chip ${p.mode === 'apart' ? 'absent' : ''}`}
                onClick={() => removePin(i)}
                title="눌러서 삭제"
              >
                {p.a} {p.mode === 'together' ? '🤝' : '↔'} {p.b} ✕
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>분포 통계</h2>
        <div className="row">
          <Dist
            title="과학 성적"
            items={LEVELS.map((l) => ({ label: l.label, count: present.filter((s) => s.level === l.key).length }))}
          />
          <Dist
            title="과학 흥미"
            items={LEVELS.map((l) => ({ label: l.label, count: present.filter((s) => s.interest === l.key).length }))}
          />
          <Dist
            title="희망 역할"
            items={ROLES.map((r) => ({ label: `${r.emoji} ${r.label}`, count: present.filter((s) => s.role === r.key).length }))}
          />
          <Dist
            title="탐구 스타일(활동성)"
            items={[
              { label: '활발형', count: present.filter((s) => s.character?.[0] === 'E').length },
              { label: '집중형', count: present.filter((s) => s.character?.[0] === 'I').length },
            ]}
          />
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: 2 }}>제출한 학생 ({submittedList.length}명)</h2>
            <p className="sub" style={{ margin: 0 }}>상태 배지를 눌러 결석 예정으로 표시하면 배치에서 제외돼요.</p>
          </div>
          <button className="btn ghost sm" onClick={() => setNamesOpen(true)}>👥 이름 붙여넣기</button>
          <button className="btn ghost sm" onClick={fillDemo}>🧪 샘플로 채우기</button>
        </div>
        <div style={{ height: 14 }} />
        {submittedList.length === 0 ? (
          <p className="sub" style={{ margin: 0 }}>아직 제출한 학생이 없어요.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="roster">
              <thead>
                <tr>
                  <th>학번</th>
                  <th>이름</th>
                  <th>캐릭터</th>
                  <th>성별</th>
                  <th>성적</th>
                  <th>흥미</th>
                  <th>역할</th>
                  <th>희망</th>
                  <th>기피</th>
                  <th>상태</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {[...submittedList]
                  .sort((a, b) => Number(a.sid) - Number(b.sid))
                  .map((s) => {
                    const ch = getCharacter(s.character)
                    return (
                      <tr key={s.sid}>
                        <td><b>{s.sid}</b></td>
                        <td>{s.name || '-'}</td>
                        <td>{ch.emoji} {ch.name}</td>
                        <td>{s.gender === 'M' ? '남' : s.gender === 'F' ? '여' : '-'}</td>
                        <td>{LEVELS.find((l) => l.key === s.level)?.label || '-'}</td>
                        <td>{LEVELS.find((l) => l.key === s.interest)?.label || '-'}</td>
                        <td>{getRole(s.role).emoji} {getRole(s.role).label}</td>
                        <td>{(s.wish || []).join(', ') || '-'}</td>
                        <td>{(s.avoid || []).join(', ') || '-'}</td>
                        <td>
                          <button
                            className={`badge ${s.absent ? 'absent' : 'ok'}`}
                            style={{ border: 'none', cursor: 'pointer' }}
                            onClick={() => toggleAbsent(s)}
                          >
                            {s.absent ? '결석 예정' : '참여'}
                          </button>
                        </td>
                        <td>
                          <button className="btn ghost sm" onClick={() => drop(s)}>삭제</button>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ① 이름 명단 붙여넣기 */}
      {namesOpen && (
        <div className="modal-back" onClick={() => setNamesOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>👥 이름 붙여넣기</h2>
            <p className="sub">
              엑셀에서 이름 열을 복사해 붙여넣으세요. <b>1번부터 순서대로</b> 매칭돼요.
              <br />
              번호가 함께 있으면(<code>3 홍길동</code>) 그 번호에 맞춰 들어갑니다.
            </p>
            <textarea
              className="input"
              rows={10}
              value={namesDraft}
              onChange={(e) => setNamesDraft(e.target.value)}
              placeholder={'홍길동\n김서연\n이준호\n…'}
              style={{ resize: 'vertical', lineHeight: 1.6 }}
            />
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn ghost" onClick={() => setNamesOpen(false)}>취소</button>
              <button className="btn" onClick={applyNames} disabled={!namesDraft.trim()}>
                명단 적용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⑤ 학생 특성 기록 */}
      {noteSid != null && (
        <div className="modal-back" onClick={() => setNoteSid(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const s = students.find((x) => Number(x.sid) === noteSid)
              const ch = getCharacter(s?.character)
              return (
                <>
                  <h2>
                    ✍️ {noteSid}번 {s?.name || ''} 특성 기록
                  </h2>
                  <p className="sub">
                    {ch.emoji} {ch.name} · {getRole(s?.role).label} · <b>{s?.points || 0}P</b>
                    <br />
                    관찰한 모습을 적어 두면 나중에 <b>생기부 초안</b>에 그대로 들어가요.
                  </p>
                  <textarea
                    className="input"
                    rows={6}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="예: 모둠원이 어려워하는 부분을 먼저 알아채고 설명해 주는 모습이 여러 차례 관찰됨"
                    style={{ resize: 'vertical', lineHeight: 1.6 }}
                  />
                  <div className="row" style={{ marginTop: 14 }}>
                    <button className="btn ghost" onClick={() => setNoteSid(null)}>닫기</button>
                    <button className="btn" onClick={saveNote}>저장</button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* 생기부 초안 */}
      {reports && (
        <div className="modal-back" onClick={() => setReports(null)}>
          <div className="modal wide" onClick={(e) => e.stopPropagation()}>
            <h2>📝 생기부 초안 ({reports.length}명)</h2>
            <div className="warn" style={{ marginBottom: 12 }}>
              ⚠️ 자동 생성한 <b>초안</b>이에요. 기재 전에 사실 여부와 표현을 꼭 확인·수정해 주세요.
            </div>
            <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
              {reports.map((r) => (
                <div key={r.sid} className="report-item">
                  <div className="head">
                    <b>
                      {r.sid}번 {r.name}
                    </b>
                    <span className="sub" style={{ fontSize: 12 }}>
                      {r.character} · {r.points}P · {r.length}자
                    </span>
                    <button
                      className="btn ghost sm"
                      onClick={() => {
                        navigator.clipboard?.writeText(r.text)
                        play('pop')
                      }}
                    >
                      복사
                    </button>
                  </div>
                  <p>{r.text}</p>
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn ghost" onClick={() => setReports(null)}>닫기</button>
              <button
                className="btn"
                onClick={() => {
                  downloadReportDoc(cls, reports)
                  play('shutter')
                }}
              >
                📄 한글 문서로 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
