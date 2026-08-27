import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import Layout from '../components/Layout.jsx'
import GroupBoard from '../components/GroupBoard.jsx'
import { toPng } from 'html-to-image'
import { getClass, subscribeClass, subscribeStudents, updateClass, upsertStudent } from '../lib/db.js'
import { buildGroups, findViolations } from '../lib/grouping.js'
import { downloadSeatChartDoc } from '../lib/hwpExport.js'
import { play } from '../lib/sound.js'

export default function SeatChart() {
  const { code } = useParams()
  const navigate = useNavigate()
  // 교사 별명이 없으면 교사용 화면(시점 전환·수정·인쇄)을 보여 주지 않고 학생용 자리표로 보낸다.
  const isTeacher = !!localStorage.getItem('moodum:teacher')
  const [cls, setCls] = useState(null)
  const [students, setStudents] = useState([])
  const [qr, setQr] = useState('')
  const [urlDraft, setUrlDraft] = useState('')
  const [teacherView, setTeacherView] = useState(false)
  const [rebuilding, setRebuilding] = useState(false)
  const [toast, setToast] = useState('')
  const dragRef = useRef(null)
  const boardRef = useRef(null)

  useEffect(() => {
    if (!isTeacher) {
      navigate(`/s/${code}/room`, { replace: true })
      return
    }
    getClass(code).then((c) => c && setUrlDraft(c.activityUrl || ''))
    const a = subscribeClass(code, (c) => c && setCls(c))
    const b = subscribeStudents(code, setStudents)
    return () => {
      a()
      b()
    }
  }, [code, isTeacher, navigate])

  useEffect(() => {
    if (!cls?.activityUrl) return setQr('')
    QRCode.toDataURL(cls.activityUrl, { width: 220, margin: 1 }).then(setQr).catch(() => setQr(''))
  }, [cls?.activityUrl])

  const byId = useMemo(() => new Map(students.map((s) => [String(s.sid), s])), [students])
  const groups = useMemo(
    () => (cls?.groups || []).map((g) => g.map((sid) => byId.get(String(sid))).filter(Boolean)),
    [cls, byId],
  )
  const violations = useMemo(() => findViolations(groups), [groups])

  if (!cls) {
    return (
      <Layout>
        <div className="card"><p className="sub" style={{ margin: 0 }}>불러오는 중…</p></div>
      </Layout>
    )
  }

  if (!cls.groups?.length) {
    return (
      <Layout>
        <div className="card">
          <h2>아직 구성된 모둠이 없어요</h2>
          <p className="sub">학생 제출을 받은 뒤 모둠을 구성해 주세요.</p>
          <button className="btn" onClick={() => navigate(`/class/${code}`)}>학급 화면으로</button>
        </div>
      </Layout>
    )
  }

  /** 드래그 앤 드롭 수동 조정: 두 학생의 자리를 맞바꾼다. */
  async function swap(from, to) {
    if (!from || !to || String(from.sid) === String(to.sid)) return
    const next = cls.groups.map((g) => [...g])
    const fi = next[from.group].indexOf(from.sid)
    const ti = next[to.group].indexOf(to.sid)
    if (fi < 0 || ti < 0) return
    next[from.group][fi] = to.sid
    next[to.group][ti] = from.sid
    await updateClass(code, { groups: next })
    play('click')
  }

  /** ⑤ 잠긴 자리표에서 학번을 누르면 포인트가 쌓인다. 5점마다 알림. */
  async function givePoint(sid) {
    const s = students.find((x) => String(x.sid) === String(sid))
    if (!s) return
    const points = (s.points || 0) + 1
    await upsertStudent(code, { ...s, points })
    if (points % 5 === 0) {
      setToast(`🏆 ${sid}번${s.name ? ` ${s.name}` : ''} ${points}포인트 달성! 명예의 전당에 올랐어요`)
      play('clap')
      setTimeout(() => setToast(''), 3500)
    } else {
      play('pop')
    }
  }

  /** ② 이전 배치로 되돌리기 */
  async function undo() {
    const hist = cls.history || []
    if (hist.length < 2) return alert('되돌릴 이전 배치가 없어요.')
    const [, prev, ...rest] = hist // [0]은 지금 배치
    if (!confirm('직전 배치로 되돌릴까요?')) return
    await updateClass(code, { groups: prev, history: [prev, ...rest] })
    play('click')
  }

  /** ⑥ 자리표를 이미지로 저장 */
  async function saveImage() {
    if (!boardRef.current) return
    try {
      const url = await toPng(boardRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: { padding: '16px' },
      })
      const a = document.createElement('a')
      a.href = url
      a.download = `${cls.name.replace(/[\\/:*?"<>|]/g, '_')}_자리표.png`
      a.click()
      play('shutter')
    } catch (e) {
      alert(`이미지로 저장하지 못했어요.\n${e?.message || e}`)
    }
  }

  async function saveUrl() {
    await updateClass(code, { activityUrl: urlDraft.trim() })
    play('pop')
  }

  async function rebuild() {
    if (!confirm('모둠을 다시 구성할까요? 지금 배치는 이전 기록으로 저장돼요.')) return
    setRebuilding(true)
    try {
      await new Promise((r) => setTimeout(r, 900))
      const present = students.filter((s) => !s.absent)
      const { groups: g } = buildGroups(present, cls.teamSize, cls.history || [])
      const asSids = g.map((x) => x.map((s) => s.sid))
      const history = [asSids, ...(cls.history || [])].slice(0, 5)
      await updateClass(code, { groups: asSids, history, groupedAt: Date.now() })
      play('clap')
    } catch (e) {
      alert(`다시 구성하지 못했어요.\n${e?.message || e}`)
    } finally {
      setRebuilding(false)
    }
  }

  function print(mode) {
    setTeacherView(mode === 'teacher')
    // 모둠 수에 맞춰 인쇄 열 수를 정해 A4 한 장에 담는다.
    const n = groups.length
    const cols = n <= 4 ? 2 : n <= 9 ? 3 : n <= 16 ? 4 : 5
    document.documentElement.style.setProperty('--print-cols', String(cols))
    play('shutter')
    setTimeout(() => window.print(), 120)
  }

  return (
    <Layout>
      <div className="card no-print">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: 2 }}>{cls.name} 자리표 🪑</h2>
            <p className="sub" style={{ margin: 0 }}>
              {groups.length}모둠 · 카드를 끌어다 놓으면 자리를 바꿀 수 있어요. 지금은{' '}
              <b>{teacherView ? '교사 시점(아래가 칠판)' : '학생 시점(위가 칠판)'}</b>
            </p>
          </div>
          <button className="btn ghost sm" onClick={() => navigate('/')}>📋 학급 목록</button>
          <button className="btn ghost sm" onClick={() => navigate(`/class/${code}`)}>학급 화면</button>
          <button className="btn ghost sm" onClick={() => setTeacherView((v) => !v)}>
            🔄 {teacherView ? '학생 시점으로' : '교사 시점으로'}
          </button>
          <button className="btn ghost sm" onClick={rebuild} disabled={rebuilding}>
            {rebuilding ? '재구성 중…' : '🎲 다시 구성'}
          </button>
          <button className="btn ghost sm" onClick={undo} disabled={(cls.history || []).length < 2}>
            ↩️ 이전 배치로
          </button>
          <button className="btn ghost sm" onClick={saveImage}>🖼 이미지 저장</button>
          <button className="btn sm" onClick={() => print('student')}>🖨 학생용 인쇄</button>
          <button className="btn accent sm" onClick={() => print('teacher')}>🖨 교사용 인쇄</button>
          <button
            className="btn ghost sm"
            onClick={() => {
              downloadSeatChartDoc(cls, groups)
              play('shutter')
            }}
          >
            📄 한글 문서로 저장
          </button>
        </div>

        {violations.length > 0 && (
          <div className="warn" style={{ marginTop: 14 }}>
            ⚠️ 인원 구조상 기피 조합을 완전히 피하지 못했어요:{' '}
            {violations.map((v) => `${v.group}모둠 ${v.a}↔${v.b}`).join(', ')} — 수동으로 조정해 주세요.
          </div>
        )}

        <div className="row" style={{ marginTop: 14 }}>
          <input
            className="input"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="활동지 URL (실험 보고서, 패들렛 등) — 인쇄물 QR로 들어가요"
          />
          <button className="btn ghost" style={{ flex: '0 0 auto' }} onClick={saveUrl}>
            QR 저장
          </button>
        </div>
      </div>

      {cls.locked && (
        <div className="card no-print" style={{ marginBottom: 16 }}>
          <b>🔒 잠긴 자리표 · 칭찬 포인트 모드</b>
          <p className="sub" style={{ margin: '4px 0 0' }}>
            학생 카드를 누르면 <b>1포인트</b>씩 쌓여요. 5포인트마다 명예의 전당에 올라갑니다.
            자리 이동은 잠금을 풀어야 해요.
          </p>
        </div>
      )}

      <div ref={boardRef}>
        <GroupBoard
          groups={groups}
          qr={qr}
          teacherView={teacherView}
          title={cls.name}
          editable={!cls.locked}
          pointMode={!!cls.locked}
          onPoint={givePoint}
          onSwap={swap}
          dragRef={dragRef}
        />
      </div>

      {toast && <div className="toast">{toast}</div>}
    </Layout>
  )
}
