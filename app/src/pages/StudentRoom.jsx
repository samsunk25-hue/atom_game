import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import GroupBoard from '../components/GroupBoard.jsx'
import { getClass, subscribeClass, subscribeStudents } from '../lib/db.js'
import { CHARACTERS, getCharacter, getRole } from '../lib/characters.js'

const DANCERS = Object.values(CHARACTERS).map((c) => c.emoji)

/**
 * 학생용 학급 페이지.
 * 교사가 모둠 구성을 끝내기 전에는 대기 화면, 끝나면 자리 배치표(학생 시점)를 보여 준다.
 * 내 학번은 ?sid= 로 전달되고, 없으면 마지막 제출 기록에서 찾는다.
 */
export default function StudentRoom() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const mySid = params.get('sid') || localStorage.getItem(`moodum:sid:${code}`) || null

  const [cls, setCls] = useState(null)
  const [students, setStudents] = useState([])
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    getClass(code).then((c) => setNotFound(!c))
    const a = subscribeClass(code, (c) => c && setCls(c))
    const b = subscribeStudents(code, setStudents)
    return () => {
      a()
      b()
    }
  }, [code])

  const byId = useMemo(() => new Map(students.map((s) => [String(s.sid), s])), [students])
  const groups = useMemo(
    () => (cls?.groups || []).map((g) => g.map((sid) => byId.get(String(sid))).filter(Boolean)),
    [cls, byId],
  )
  const me = mySid ? byId.get(String(mySid)) : null
  // 포인트를 받은 친구들 (상위 8명만)
  const hallOfFame = useMemo(
    () =>
      students
        .filter((s) => (s.points || 0) > 0)
        .sort((a, b) => (b.points || 0) - (a.points || 0) || Number(a.sid) - Number(b.sid))
        .slice(0, 8),
    [students],
  )
  const myGroup = groups.findIndex((g) => g.some((s) => String(s.sid) === String(mySid)))

  if (notFound) {
    return (
      <Layout minimal>
        <div className="card" style={{ maxWidth: 460, margin: '6vh auto' }}>
          <h2>학급을 찾을 수 없어요 😢</h2>
          <p className="sub">코드 <b>{code}</b> 를 다시 확인해 주세요.</p>
        </div>
      </Layout>
    )
  }

  if (!cls) {
    return (
      <Layout minimal>
        <div className="card"><p className="sub" style={{ margin: 0 }}>불러오는 중…</p></div>
      </Layout>
    )
  }

  /* ── 아직 모둠 구성 전 또는 아직 공개 전: 대기 화면 ── */
  if (!groups.length || !cls.revealedAt) {
    // 자리 표시용(결석 처리) 문서는 빼고 실제 제출만 센다.
    const done = students.filter((s) => s.submittedAt).length
    const pct = Math.min(100, Math.round((done / Math.max(1, cls.total)) * 100))
    return (
      <Layout minimal>
        <div className="card pop-in" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
          <div className="dance" style={{ fontSize: 26 }}>
            {DANCERS.slice(0, 8).map((e, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.08}s` }}>{e}</span>
            ))}
          </div>
          <h2 style={{ marginTop: 16 }}>{cls.name}</h2>
          <p className="sub">
            선생님이 모둠을 구성하는 중이에요. 완성되면 이 화면에 자리표가 바로 나타나요!
          </p>
          <div className="stats" style={{ marginTop: 6 }}>
            <div className="stat">
              <b>{done}</b>
              <span>제출한 친구</span>
            </div>
            <div className="stat">
              <b>{Math.max(0, cls.total - done)}</b>
              <span>아직 안 낸 친구</span>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="bar" style={{ height: 12 }}>
              <i style={{ width: `${pct}%` }} />
            </div>
            <p className="sub" style={{ margin: '8px 0 0', fontSize: 13 }}>
              {done === cls.total ? (
                <>모두 제출 완료! 곧 모둠이 나와요 🎉</>
              ) : (
                <>
                  <b>{cls.total}명 중 {done}명</b> 제출했어요 ({pct}%)
                </>
              )}
            </p>
          </div>
          {me && (
            <p className="sub" style={{ marginTop: 14, marginBottom: 0 }}>
              나는 <b>{me.sid}번 · {getCharacter(me.character).name}</b> {getCharacter(me.character).emoji}
            </p>
          )}
          <button className="btn ghost block" style={{ marginTop: 16 }} onClick={() => navigate(`/s/${code}`)}>
            다시 제출하기
          </button>
        </div>
      </Layout>
    )
  }

  /* ── 모둠 구성 완료: 자리표 ── */
  return (
    <Layout minimal>
      <div className="card no-print">
        <h2 style={{ marginBottom: 2 }}>{cls.name} 자리표 🪑</h2>
        <p className="sub" style={{ margin: 0 }}>
          {myGroup >= 0 ? (
            <>
              나는 <b>{myGroup + 1}모둠</b>! 아래 그림은 <b>앞(칠판)을 보는 방향</b>이에요.
            </>
          ) : (
            <>앞(칠판)을 보는 방향으로 그려진 자리표예요.</>
          )}
        </p>
        {me && myGroup >= 0 && (
          <p className="sub" style={{ margin: '8px 0 0' }}>
            내 역할은 {getRole(me.role).emoji} <b>{getRole(me.role).label}</b> 이에요.
          </p>
        )}
        {hallOfFame.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
            <b style={{ fontSize: 13.5 }}>🏆 명예의 전당</b>
            <div className="hall" style={{ marginTop: 8 }}>
              {hallOfFame.map((s, i) => (
                <div key={s.sid} className="hall-item" style={{ cursor: 'default' }}>
                  <span className="rank">{['🥇', '🥈', '🥉'][i] || `${i + 1}위`}</span>
                  <b>{s.name || `${s.sid}번`}</b>
                  <span className="pts">{s.points}P</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {cls.activityUrl && (
          <a
            className="btn accent sm"
            href={cls.activityUrl}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-block', marginTop: 12, textDecoration: 'none' }}
          >
            📄 활동지 열기
          </a>
        )}
      </div>

      {/*
        학생 화면은 언제나 학생 시점(위가 칠판) 자리표 하나만 보여 준다.
        교사 시점 전환·드래그 수정·인쇄는 교사 화면 전용이므로 여기서는 제공하지 않는다.
        활동지는 위의 버튼으로 열 수 있어 모둠 카드마다 QR을 겹쳐 넣지 않는다.
        cls·students를 구독하고 있어 교사가 모둠을 수정하면 새로고침 없이 바로 반영된다.
      */}
      <GroupBoard
        groups={groups}
        teacherView={false}
        editable={false}
        highlightSid={mySid}
        title={cls.name}
      />
    </Layout>
  )
}
