import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import CharacterArt from '../components/CharacterArt.jsx'
import { getAuthError, getClass, listStudents, upsertStudent } from '../lib/db.js'
import { LEVELS, QUESTIONS, ROLES, codeFromAnswers, getCharacter } from '../lib/characters.js'
import { play } from '../lib/sound.js'

const TOTAL_STEPS = 4

export default function Student() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [cls, setCls] = useState(null)
  const [status, setStatus] = useState('loading') // loading | notfound | error | ready | done
  const [errMsg, setErrMsg] = useState('')
  const [step, setStep] = useState(1)
  const [taken, setTaken] = useState([])
  const [peace, setPeace] = useState(false)

  const [form, setForm] = useState({
    sid: '',
    gender: '',
    level: '',
    interest: '',
    answers: [null, null, null, null],
    role: '',
    wish: [],
    avoid: [],
  })

  useEffect(() => {
    getClass(code).then((c) => {
      if (!c) return setStatus('notfound')
      setCls(c)
      setStatus('ready')
      listStudents(code).then((list) => setTaken(list.map((s) => String(s.sid))))
    }).catch((e) => {
      setErrMsg(getAuthError() || `연결에 실패했어요: ${e?.code || e}`)
      setStatus('error')
    })
  }, [code])

  const character = useMemo(
    () => (form.answers.every(Boolean) ? codeFromAnswers(form.answers) : null),
    [form.answers],
  )

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // 4자리 학번 입력 처리
  // 형식: [학년 1자리][반 1자리][번호 2자리]  예) 1101 → 1학년 1반 1번 (sid=1)
  const [sidInput, setSidInput] = useState('')
  const [sidError, setSidError] = useState('')

  function parseSid(raw) {
    const val = raw.replace(/\D/g, '').slice(0, 4)
    setSidInput(val)
    setSidError('')
    if (val.length < 4) {
      set('sid', '')
      return
    }
    const grade = Number(val[0])
    const classNo = Number(val[1])
    const num = Number(val.slice(2)) // 번호 (01~99 → 1~99)
    if (grade !== cls.grade) {
      setSidError(`학년이 맞지 않아요. (이 학급: ${cls.grade}학년)`)
      set('sid', '')
      return
    }
    if (classNo !== cls.classNo) {
      setSidError(`반이 맞지 않아요. (이 학급: ${cls.classNo}반)`)
      set('sid', '')
      return
    }
    if (num < 1 || num > cls.total) {
      setSidError(`번호가 범위를 벗어났어요. (1 ~ ${cls.total}번)`)
      set('sid', '')
      return
    }
    set('sid', String(num))
  }

  function toggleList(key, sid) {
    const other = key === 'wish' ? 'avoid' : 'wish'
    setForm((f) => {
      const has = f[key].includes(sid)
      const next = has ? f[key].filter((x) => x !== sid) : [...f[key], sid].slice(0, 3)
      return { ...f, [key]: next, [other]: f[other].filter((x) => x !== sid) }
    })
    play('click')
  }

  function answer(i, choice) {
    setForm((f) => {
      const answers = [...f.answers]
      answers[i] = choice
      return { ...f, answers }
    })
    play('click')
  }

  async function submit() {
    // ⑦ 잠근 학급은 더 이상 제출을 받지 않는다(구성된 모둠이 바뀌지 않도록).
    const fresh = await getClass(code)
    if (fresh?.locked) {
      setErrMsg('선생님이 이 학급을 잠갔어요. 더 이상 제출할 수 없어요.')
      setStatus('error')
      return
    }
    const student = {
      sid: Number(form.sid),
      gender: form.gender,
      level: form.level,
      interest: form.interest,
      character,
      role: form.role,
      wish: form.wish.map(Number),
      avoid: form.avoid.map(Number),
      absent: false,
      submittedAt: Date.now(),
    }
    await upsertStudent(code, student)
    localStorage.setItem(`moodum:sid:${code}`, String(student.sid))
    setPeace(form.wish.length === 0 && form.avoid.length === 0)
    setStatus('done')
    play('pop')
  }

  if (status === 'loading') {
    return (
      <Layout minimal>
        <div className="card"><p className="sub" style={{ margin: 0 }}>불러오는 중…</p></div>
      </Layout>
    )
  }

  if (status === 'error') {
    return (
      <Layout minimal>
        <div className="card" style={{ maxWidth: 460, margin: '6vh auto' }}>
          <h2>잠시 연결이 안 돼요 🛠</h2>
          <div className="warn" style={{ marginTop: 10 }}>{errMsg}</div>
          <button className="btn block" style={{ marginTop: 14 }} onClick={() => location.reload()}>
            다시 시도
          </button>
        </div>
      </Layout>
    )
  }

  if (status === 'notfound') {
    return (
      <Layout minimal>
        <div className="card" style={{ maxWidth: 460, margin: '6vh auto' }}>
          <h2>학급을 찾을 수 없어요 😢</h2>
          <p className="sub">코드 <b>{code}</b> 를 다시 확인해 주세요.</p>
        </div>
      </Layout>
    )
  }

  if (status === 'done') {
    const ch = getCharacter(character)
    return (
      <Layout minimal>
        <div className="card pop-in" style={{ maxWidth: 460, margin: '6vh auto', textAlign: 'center' }}>
          <CharacterArt code={character} size={140} />
          <h2>제출 완료! 🎉</h2>
          <p className="sub">
            {form.sid}번 · 나는 <b>{ch.name}</b>
          </p>
          {peace && (
            <div className="card" style={{ background: '#fff', marginTop: 4 }}>
              <div style={{ fontSize: 34 }}>🕊</div>
              <b>진정한 평화주의자</b>
              <p className="sub" style={{ margin: '6px 0 0' }}>
                누구와도 잘 지낼 수 있다니, 멋진 친구네요!
              </p>
            </div>
          )}
          <p className="sub" style={{ marginTop: 16 }}>
            이제 선생님이 모둠을 구성해 주실 거예요. 모둠이 완성되면 학급 페이지에서 자리표를 볼 수 있어요!
          </p>
          <button
            className="btn block"
            onClick={() => navigate(`/s/${code}/room?sid=${form.sid}`)}
          >
            🏫 학급 페이지로 이동하기
          </button>
          <button
            className="btn ghost block"
            style={{ marginTop: 8 }}
            onClick={() => {
              setStatus('ready')
              setStep(1)
            }}
          >
            다시 작성하기
          </button>
        </div>
      </Layout>
    )
  }

  const numbers = Array.from({ length: cls.total }, (_, i) => String(i + 1)).filter(
    (n) => n !== String(form.sid),
  )

  const canNext =
    (step === 1 && form.sid && form.gender && form.level && form.interest) ||
    (step === 2 && form.answers.every(Boolean)) ||
    (step === 3 && form.role) ||
    step === 4

  return (
    <Layout minimal>
      <div className="card pop-in" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="steps">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <i key={i} className={i < step ? 'on' : ''} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h2>STEP 1. 나는 누구일까? ✋</h2>
            <p className="sub">{cls.name} · 학번과 나의 정보를 알려 주세요.</p>

            {localStorage.getItem(`moodum:sid:${code}`) && (
              <button
                className="btn ghost block"
                style={{ marginBottom: 16 }}
                onClick={() => navigate(`/s/${code}/room`)}
              >
                🏫 이미 제출했어요 · 학급 페이지 보기
              </button>
            )}

            <label className="field">
              <span>내 학번 (4자리 입력)</span>
              <input
                className="input"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={sidInput}
                onChange={(e) => parseSid(e.target.value)}
                placeholder={`${cls.grade}${String(cls.classNo).padStart(1,'0')}01 ~ ${cls.grade}${String(cls.classNo).padStart(1,'0')}${String(cls.total).padStart(2,'0')}`}
              />
              {sidError && (
                <span style={{ fontSize: 12, color: '#c47' }}>{sidError}</span>
              )}
              {!sidError && form.sid && taken.includes(String(form.sid)) && (
                <span style={{ fontSize: 12, color: '#c47' }}>이미 제출한 학번이에요. 다시 제출하면 덮어써요.</span>
              )}
              {!sidError && form.sid && (
                <span style={{ fontSize: 12, color: 'var(--accent)' }}>
                  ✅ {cls.grade}학년 {cls.classNo}반 {form.sid}번으로 확인됐어요.
                </span>
              )}
            </label>

            <div className="field">
              <span>성별</span>
              <div className="choices">
                {[
                  { k: 'M', label: '남' },
                  { k: 'F', label: '여' },
                ].map((g) => (
                  <button key={g.k} className={`choice ${form.gender === g.k ? 'on' : ''}`} onClick={() => set('gender', g.k)}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <span>과학 성적</span>
              <div className="choices">
                {LEVELS.map((l) => (
                  <button key={l.key} className={`choice ${form.level === l.key ? 'on' : ''}`} onClick={() => set('level', l.key)}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <span>과학에 대한 흥미</span>
              <div className="choices">
                {LEVELS.map((l) => (
                  <button key={l.key} className={`choice ${form.interest === l.key ? 'on' : ''}`} onClick={() => set('interest', l.key)}>
                    {l.label}
                  </button>
                ))}
              </div>
              <p className="sub" style={{ marginTop: 6, marginBottom: 0, fontSize: 12 }}>
                과학 시간이 얼마나 재미있는지 솔직하게 골라 주세요. 성적과 별개예요!
              </p>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2>STEP 2. 나의 탐구 스타일 찾기 🔎</h2>
            <p className="sub">네 가지 질문에 답하면 나만의 동물 친구가 나타나요!</p>
            {QUESTIONS.map((q, i) => (
              <div className="field" key={i}>
                <span>
                  Q{i + 1}. {q.q}
                </span>
                <div className="choices">
                  <button className={`choice ${form.answers[i] === 'a' ? 'on' : ''}`} onClick={() => answer(i, 'a')}>
                    {q.a.label}
                  </button>
                  <button className={`choice ${form.answers[i] === 'b' ? 'on' : ''}`} onClick={() => answer(i, 'b')}>
                    {q.b.label}
                  </button>
                </div>
              </div>
            ))}
            {character && (
              <div className="card pop-in" style={{ background: '#fff', textAlign: 'center' }}>
                <CharacterArt code={character} size={120} />
                <b style={{ fontSize: 17, display: 'block' }}>{getCharacter(character).name}</b>
                <p className="sub" style={{ margin: '4px 0 0' }}>{getCharacter(character).desc}</p>
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <h2>STEP 3. 희망 역할 고르기 🎯</h2>
            <p className="sub">탐구 활동에서 맡고 싶은 역할을 하나 골라 주세요.</p>
            <div className="choices">
              {ROLES.map((r) => (
                <button
                  key={r.key}
                  className={`choice ${form.role === r.key ? 'on' : ''}`}
                  onClick={() => {
                    set('role', r.key)
                    play('click')
                  }}
                  style={{ minWidth: 130 }}
                >
                  <div style={{ fontSize: 28 }}>{r.emoji}</div>
                  {r.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2>STEP 4. 함께하고 싶은 친구 🤝</h2>
            <p className="sub">
              선택하지 않아도 괜찮아요. 각각 최대 3명까지 고를 수 있어요.
            </p>

            <div className="field">
              <span>같은 모둠이 되면 좋겠어요 (희망) — {form.wish.length}/3</span>
              <div className="choices">
                {numbers.map((n) => (
                  <button
                    key={n}
                    className={`choice ${form.wish.includes(n) ? 'on' : ''}`}
                    style={{ minWidth: 52, flex: '0 0 auto', padding: '10px 12px' }}
                    onClick={() => toggleList('wish', n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <span>이번엔 다른 모둠이면 좋겠어요 (기피) — {form.avoid.length}/3</span>
              <div className="choices">
                {numbers.map((n) => (
                  <button
                    key={n}
                    className={`choice danger ${form.avoid.includes(n) ? 'on' : ''}`}
                    style={{ minWidth: 52, flex: '0 0 auto', padding: '10px 12px' }}
                    onClick={() => toggleList('avoid', n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="sub" style={{ marginTop: 6, marginBottom: 0, fontSize: 12 }}>
                기피 친구는 선생님만 볼 수 있어요. 최대한 반영하지만 반 인원이나 다른 조건에 따라
                반영되지 않을 수도 있어요.
              </p>
            </div>
          </>
        )}

        <div className="row" style={{ marginTop: 18 }}>
          {step > 1 && (
            <button className="btn ghost" onClick={() => setStep((s) => s - 1)}>
              이전
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              className="btn"
              disabled={!canNext}
              onClick={() => {
                setStep((s) => s + 1)
                play(step === 2 ? 'tada' : 'click')
              }}
            >
              다음
            </button>
          ) : (
            <button className="btn" onClick={submit}>
              제출하기 🚀
            </button>
          )}
        </div>
      </div>
    </Layout>
  )
}
