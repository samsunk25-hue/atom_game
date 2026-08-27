import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { createClass, makeClassCode } from '../lib/db.js'
import { describePlan } from '../lib/grouping.js'
import { play } from '../lib/sound.js'

const TEAM_PRESETS = [3, 4, 5]

export default function CreateClass() {
  const navigate = useNavigate()
  const teacher = localStorage.getItem('moodum:teacher') || ''
  const thisYear = new Date().getFullYear()

  const [form, setForm] = useState({
    year: thisYear,
    grade: 1,
    classNo: 1,
    name: '',
    total: 24,
    teamSize: 4,
    custom: false,
  })
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const plan = useMemo(
    () => describePlan(Number(form.total) || 0, Number(form.teamSize) || 0),
    [form.total, form.teamSize],
  )

  const autoName = `${form.year}-${form.grade}학년 ${form.classNo}반`

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    const cls = {
      code: makeClassCode(),
      teacher,
      year: Number(form.year),
      grade: Number(form.grade),
      classNo: Number(form.classNo),
      name: form.name.trim() || autoName,
      total: Number(form.total),
      teamSize: Number(form.teamSize),
      activityUrl: '',
      groups: [],
      history: [],
      createdAt: Date.now(),
    }
    await createClass(cls)
    play('tada')
    navigate(`/class/${cls.code}`)
  }

  return (
    <Layout>
      <form className="card" onSubmit={submit}>
        <h2>새 학급 개설하기 ✏️</h2>
        <p className="sub">학급 정보와 모둠 인원 기준을 정하면 학생 접속용 QR이 바로 만들어져요.</p>

        <div className="row">
          <label className="field">
            <span>학년도</span>
            <input className="input" type="number" value={form.year} onChange={set('year')} />
          </label>
          <label className="field">
            <span>학년</span>
            <input className="input" type="number" min="1" value={form.grade} onChange={set('grade')} />
          </label>
          <label className="field">
            <span>반</span>
            <input className="input" type="number" min="1" value={form.classNo} onChange={set('classNo')} />
          </label>
        </div>

        <label className="field">
          <span>학급명</span>
          <input className="input" value={form.name} onChange={set('name')} placeholder={autoName} />
        </label>

        <label className="field">
          <span>총 학생 수</span>
          <input className="input" type="number" min="2" max="50" value={form.total} onChange={set('total')} />
        </label>

        <div className="field">
          <span>모둠 최대 인원</span>
          <div className="choices">
            {TEAM_PRESETS.map((n) => (
              <button
                type="button"
                key={n}
                className={`choice ${!form.custom && Number(form.teamSize) === n ? 'on' : ''}`}
                onClick={() => setForm((f) => ({ ...f, teamSize: n, custom: false }))}
              >
                {n}명
              </button>
            ))}
            <button
              type="button"
              className={`choice ${form.custom ? 'on' : ''}`}
              onClick={() => setForm((f) => ({ ...f, custom: true }))}
            >
              직접 입력
            </button>
          </div>
          {form.custom && (
            <input
              className="input"
              type="number"
              min="2"
              max="10"
              value={form.teamSize}
              onChange={set('teamSize')}
              style={{ marginTop: 10 }}
            />
          )}
        </div>

        <div className="card" style={{ background: '#fff', marginTop: 4 }}>
          <b style={{ fontSize: 14 }}>🧮 자동 계산 결과</b>
          <div style={{ marginTop: 8, fontSize: 15 }}>
            최대 <b>{plan.count}</b>개 모둠 · <b>{plan.text}</b>
          </div>
          <p className="sub" style={{ margin: '6px 0 0' }}>
            어떤 모둠도 <b>{form.teamSize}명</b>을 넘지 않아요. 남는 인원은 앞 모둠부터 한 명씩 더 배치되고,
            결석 학생은 제외하고 다시 계산됩니다.
          </p>
        </div>

        <div className="row" style={{ marginTop: 18 }}>
          <button type="button" className="btn ghost" onClick={() => navigate('/')}>
            취소
          </button>
          <button className="btn" disabled={saving || plan.count === 0}>
            {saving ? '만드는 중…' : '개설하고 QR 만들기'}
          </button>
        </div>
      </form>
    </Layout>
  )
}
