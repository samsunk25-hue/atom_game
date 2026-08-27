import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { deleteClass, getAuthError, listClasses, usingFirebase } from '../lib/db.js'
import { play } from '../lib/sound.js'

const NICK_KEY = 'moodum:teacher'

export default function TeacherHome() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState(() => localStorage.getItem(NICK_KEY) || '')
  const [input, setInput] = useState('')
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)
  const [connError, setConnError] = useState('')

  useEffect(() => {
    if (!nickname) return
    setLoading(true)
    listClasses(nickname)
      .then(setClasses)
      .catch(() => setConnError(getAuthError() || '학급을 불러오지 못했어요.'))
      .finally(() => setLoading(false))
  }, [nickname])

  function enter(e) {
    e.preventDefault()
    const name = input.trim()
    if (!name) return
    localStorage.setItem(NICK_KEY, name)
    setNickname(name)
    play('pop')
  }

  function logout() {
    localStorage.removeItem(NICK_KEY)
    setNickname('')
    setClasses([])
  }

  async function remove(e, code) {
    e.stopPropagation()
    if (!confirm('이 학급을 삭제할까요? 학생 제출 내용도 함께 지워집니다.')) return
    await deleteClass(code)
    setClasses(await listClasses(nickname))
  }

  /* ── 닉네임 입력 화면 ── */
  if (!nickname) {
    return (
      <Layout minimal>
        <div className="card pop-in" style={{ maxWidth: 460, margin: '6vh auto' }}>
          <h2>선생님, 반가워요! 👋</h2>
          <p className="sub">
            <b>선생님 손은 가볍게, 아이들 마음은 딱 맞게.</b>
            <br />
            로그인 없이 <b>별명</b>만 입력하면 내가 만든 학급들이 그대로 열려요.
          </p>
          <form onSubmit={enter}>
            <label className="field">
              <span>선생님 별명</span>
              <input
                className="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="예: 과학쌤민지"
                autoFocus
              />
            </label>
            <button className="btn block" disabled={!input.trim()}>
              내 학급 보러 가기
            </button>
          </form>

          {/* 학생은 QR 스캔으로만 입장한다 — 이 화면은 교사 전용이라 코드 입력란을 두지 않는다. */}
          <p className="sub" style={{ marginTop: 20, marginBottom: 0, fontSize: 12.5 }}>
            🧑‍🎓 학생은 선생님이 보여 주는 <b>QR 코드</b>를 스캔해 바로 입장해요.
          </p>

          <p className="sub" style={{ marginTop: 10, marginBottom: 0, fontSize: 12 }}>
            {usingFirebase
              ? '☁️ Firebase에 연결되어 있어요.'
              : '💾 지금은 이 브라우저에만 저장돼요 (Firebase 미설정).'}
          </p>
        </div>
      </Layout>
    )
  }

  /* ── 대시보드 ── */
  return (
    <Layout>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: 2 }}>{nickname} 선생님의 교실 🏫</h2>
            <p className="sub" style={{ margin: 0 }}>
              학급 카드를 누르면 저장된 모둠 자리표로 바로 이동해요.
            </p>
          </div>
          <button className="btn" onClick={() => navigate('/class/new')}>
            ➕ 새 학급 개설하기
          </button>
          <button className="btn ghost sm" onClick={logout}>
            별명 바꾸기
          </button>
        </div>
      </div>

      <div className="card">
        {connError && (
          <div className="warn" style={{ marginBottom: 14 }}>
            ⚠️ {connError}
          </div>
        )}
        {loading && <p className="sub">불러오는 중…</p>}
        {!loading && classes.length === 0 && (
          <p className="sub" style={{ margin: 0 }}>
            아직 개설한 학급이 없어요. 위의 <b>새 학급 개설하기</b>로 시작해 보세요!
          </p>
        )}
        <div className="grid cols3">
          {classes.map((c) => (
            <div
              key={c.code}
              className="class-card"
              onClick={() => navigate(c.groups?.length ? `/class/${c.code}/seats` : `/class/${c.code}`)}
            >
              <button className="del" onClick={(e) => remove(e, c.code)} title="삭제">
                ✕
              </button>
              <div className="code">{c.code}</div>
              <div className="title">{c.name}</div>
              <div className="meta">
                {c.year}년 · {c.grade}학년 {c.classNo}반 · 총 {c.total}명
              </div>
              <div className="meta" style={{ marginTop: 6 }}>
                {c.groups?.length ? (
                  <span className="badge ok">자리표 완성 · {c.groups.length}모둠</span>
                ) : (
                  <span className="badge wait">학생 정보 수집 중</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
