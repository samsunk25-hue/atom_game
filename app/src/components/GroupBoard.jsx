import { useMemo, useState } from 'react'
import { assignSeats, chemiTitle } from '../lib/grouping.js'
import { getCharacter, getRole } from '../lib/characters.js'
import CharacterArt from './CharacterArt.jsx'

function Seat({ student, extra, highlight, editable, pointMode, onPoint, onDragStart, onDrop }) {
  const [over, setOver] = useState(false)
  const ch = getCharacter(student.character)
  const role = getRole(student.role)
  return (
    <div
      className={`seat ${over ? 'drop' : ''} ${extra ? 'extra' : ''} ${highlight ? 'me' : ''} ${
        pointMode ? 'point' : ''
      }`}
      style={{ background: `${ch.color}33`, cursor: pointMode ? 'pointer' : editable ? 'grab' : 'default' }}
      onClick={pointMode ? () => onPoint(student.sid) : undefined}
      draggable={editable}
      onDragStart={editable ? onDragStart : undefined}
      onDragOver={
        editable
          ? (e) => {
              e.preventDefault()
              setOver(true)
            }
          : undefined
      }
      onDragLeave={editable ? () => setOver(false) : undefined}
      onDrop={
        editable
          ? (e) => {
              e.preventDefault()
              setOver(false)
              onDrop()
            }
          : undefined
      }
      title={`${ch.name} · ${ch.desc}`}
    >
      <div className="face">
        <CharacterArt code={student.character} size={56} />
      </div>
      <div className="sid">
        {student.name || `${student.sid}번`}
        {highlight && ' 🙋'}
      </div>
      <div className="cname">{student.name ? `${student.sid}번 · ` : ''}{ch.name}</div>
      {(student.points || 0) > 0 && <div className="pts">🏆 {student.points}P</div>}
      <div className="role">
        {role.emoji} {role.label}
      </div>
    </div>
  )
}

function GroupCard({ index, group, qr, flipped, editable, pointMode, onPoint, highlightSid, onSwap, dragRef }) {
  // flipped: 교사 시점. 자리의 앞뒤·좌우를 뒤집되(=교실을 180° 돌려 본 것) 글자는 바로 세워 둔다.
  const seated = useMemo(() => {
    const s = assignSeats(group)
    return flipped ? [...s].reverse() : s
  }, [group, flipped])
  const { title, emoji } = useMemo(() => chemiTitle(group), [group])
  const isMine = highlightSid != null && group.some((s) => String(s.sid) === String(highlightSid))

  return (
    <div className="group-card" style={isMine ? { outline: '3px solid var(--primary)' } : undefined}>
      <header>
        <h3>
          {index + 1}모둠{isMine && ' · 우리 모둠!'}
        </h3>
        <span className="chemi">
          {emoji} {title}
        </span>
      </header>

      <div className="desks">
        {seated.map((s, i) => (
          <Seat
            key={s.sid}
            student={s}
            extra={seated.length % 2 === 1 && i === seated.length - 1}
            highlight={String(s.sid) === String(highlightSid)}
            editable={editable}
            pointMode={pointMode}
            onPoint={onPoint}
            onDragStart={() => (dragRef.current = { group: index, sid: s.sid })}
            onDrop={() => onSwap(dragRef.current, { group: index, sid: s.sid })}
          />
        ))}
      </div>

      {qr && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <img src={qr} alt="활동지 QR" style={{ width: 84, height: 84 }} />
          <div style={{ fontSize: 11, opacity: 0.6 }}>활동지 QR</div>
        </div>
      )}
    </div>
  )
}

/**
 * 자리표 배치.
 * 학생 시점: 위가 칠판 — 학생이 앞을 보는 방향 그대로.
 * 교사 시점: 아래가 칠판(교탁) — 교사가 교실 앞에서 뒤를 바라보는 방향.
 *   모둠 순서와 모둠 안 자리를 모두 뒤집어 교실을 180° 돌려 본 배치로 만들되,
 *   글자는 회전시키지 않아 그대로 바르게 읽힌다.
 */
export default function GroupBoard({
  groups,
  qr,
  teacherView = false,
  editable = false,
  pointMode = false,
  onPoint,
  highlightSid = null,
  title = '',
  onSwap,
  dragRef,
}) {
  const ordered = groups.map((g, i) => [g, i])
  if (teacherView) ordered.reverse()

  // 칠판 자리에 학급명을 적는다(인쇄물에서 어느 반 자리표인지 바로 보이도록).
  const board = title ? `${title} 자리표` : '칠 판'

  return (
    <div>
      {teacherView ? <div className="podium">교실 뒷면</div> : <div className="blackboard">{board}</div>}

      <div className="grid cols3" style={{ marginTop: 14 }}>
        {ordered.map(([g, i]) => (
          <GroupCard
            key={i}
            index={i}
            group={g}
            qr={qr}
            flipped={teacherView}
            editable={editable}
            pointMode={pointMode}
            onPoint={onPoint}
            highlightSid={highlightSid}
            onSwap={onSwap}
            dragRef={dragRef}
          />
        ))}
      </div>

      {teacherView && (
        <div className="blackboard" style={{ marginTop: 14 }}>
          {board} · 칠판(교탁) 쪽
        </div>
      )}
    </div>
  )
}
