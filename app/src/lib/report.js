import { getCharacter, getRole } from './characters.js'

/**
 * 학교생활기록부 초안 생성.
 *
 * 교사가 남긴 '학생 특성 기록'을 중심 문장으로 삼고,
 * 탐구 스타일·맡은 역할·모둠 활동 포인트로 앞뒤 문장을 붙인다.
 * 어디까지나 **초안**이라 교사가 반드시 검토·수정해야 한다.
 */

// 4축 → 생기부에서 쓸 만한 표현
const AXIS_PHRASES = {
  E: '모둠 활동에서 먼저 말을 건네며 분위기를 이끎',
  I: '차분하게 상황을 살핀 뒤 자신의 생각을 정리하여 전달함',
  P: '활동 전 계획을 세우고 순서에 따라 차근차근 수행함',
  T: '떠오른 생각을 즉시 시도해 보며 다양한 방법을 탐색함',
  D: '자신의 의견을 분명하게 제시하며 모둠의 방향을 제안함',
  S: '친구의 의견을 귀 기울여 듣고 필요한 부분을 도움',
  F: '탐구 과정에서 느낀 점을 풍부하게 표현하며 흥미를 드러냄',
  L: '결과의 원인을 따져 보며 근거를 들어 설명하려 노력함',
}

const ROLE_PHRASES = {
  experiment: '실험을 맡아 기구를 안전하게 다루며 절차를 성실히 수행함',
  observe: '관찰을 맡아 변화의 작은 차이까지 놓치지 않고 살펴봄',
  record: '기록을 맡아 실험 과정과 결과를 빠짐없이 정리함',
  present: '발표를 맡아 모둠의 탐구 내용을 조리 있게 전달함',
  arrange: '정리를 맡아 실험 후 자리를 깨끗하게 마무리함',
}

const LEVEL_PHRASES = {
  high: '과학 수업에 높은 흥미를 보이며 자발적으로 참여함',
  mid: '과학 수업에 꾸준히 참여하며 맡은 활동을 성실히 수행함',
  low: '친구들의 도움을 받아 활동에 참여하며 점차 자신감을 보임',
}

function pointPhrase(points) {
  if (!points) return ''
  if (points >= 20) return `모둠 활동에서 ${points}회에 걸쳐 모범 사례로 언급될 만큼 꾸준히 기여함`
  if (points >= 10) return `모둠 활동에서 ${points}회 인정받을 만큼 적극적으로 참여함`
  if (points >= 5) return `모둠 활동에서 ${points}회 좋은 모습을 보여 칭찬받음`
  return `모둠 활동에서 ${points}회 칭찬받는 모습을 보임`
}

/** 학생 한 명의 생기부 초안 문장 */
export function buildReport(student) {
  const ch = getCharacter(student.character)
  const code = student.character || ''
  const parts = []

  if (student.interest) parts.push(LEVEL_PHRASES[student.interest])

  // 4축 중 성향이 잘 드러나는 두 가지만 골라 문장을 만든다(너무 길어지지 않게)
  const axes = [code[0], code[1], code[2], code[3]].filter(Boolean)
  const picked = [axes[2], axes[3]].filter(Boolean) // 주도성·사고 축이 서술에 적합
  picked.forEach((k) => AXIS_PHRASES[k] && parts.push(AXIS_PHRASES[k]))

  if (student.role && ROLE_PHRASES[student.role]) parts.push(ROLE_PHRASES[student.role])

  const pts = pointPhrase(student.points)
  if (pts) parts.push(pts)

  // 교사가 직접 남긴 관찰 기록이 가장 중요하므로 마지막에 그대로 덧붙인다
  const note = (student.note || '').trim()
  if (note) parts.push(note.replace(/\.$/, ''))

  const body = parts.join('. ') + '.'
  return {
    sid: student.sid,
    name: student.name || '',
    character: ch.name,
    points: student.points || 0,
    text: body,
    length: body.length,
  }
}

/** 여러 학생의 초안을 한 번에 */
export function buildReports(students) {
  return [...students]
    .sort((a, b) => Number(a.sid) - Number(b.sid))
    .map((s) => buildReport(s))
}

/** 생기부 초안을 한글에서 열 수 있는 문서로 저장 */
export function downloadReportDoc(cls, reports) {
  const esc = (s) =>
    String(s ?? '').replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m])
  const t = new Date()
  const rows = reports
    .map(
      (r) => `<tr>
        <td class="c">${esc(r.sid)}</td>
        <td class="c">${esc(r.name)}</td>
        <td class="t">${esc(r.text)}</td>
        <td class="c">${r.length}자</td>
      </tr>`,
    )
    .join('')

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8" /><title>${esc(cls.name)} 생기부 초안</title>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: '맑은 고딕','Malgun Gothic',sans-serif; font-size: 10pt; }
  h1 { font-size: 15pt; margin: 0 0 4pt; }
  .meta { font-size: 9pt; color: #666; margin: 0 0 10pt; }
  .warn { border: 1pt solid #d9a; background: #fdf3f3; padding: 6pt; font-size: 9pt; margin-bottom: 10pt; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1pt solid #999; padding: 5pt; font-size: 9.5pt; vertical-align: top; }
  th { background: #f2ece6; }
  td.c { text-align: center; width: 8%; }
  td.t { text-align: justify; }
</style></head>
<body>
  <h1>${esc(cls.name)} 학교생활기록부 초안 (과학 모둠 활동)</h1>
  <p class="meta">${t.getFullYear()}. ${t.getMonth() + 1}. ${t.getDate()}. · ${reports.length}명</p>
  <p class="warn">⚠ 이 문서는 모둠 활동 기록을 바탕으로 자동 생성한 <b>초안</b>입니다.
     실제 기재 전에 반드시 교사가 사실 여부와 표현을 확인하고 수정해 주세요.</p>
  <table>
    <tr><th>학번</th><th>이름</th><th>세부능력 및 특기사항 (초안)</th><th>글자수</th></tr>
    ${rows}
  </table>
</body></html>`

  const blob = new Blob(['﻿', html], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${cls.name.replace(/[\\/:*?"<>|]/g, '_')}_생기부초안.doc`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export { getRole }
