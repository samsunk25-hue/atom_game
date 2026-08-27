import { assignSeats, chemiTitle } from './grouping.js'
import { getCharacter, getRole } from './characters.js'

/**
 * 자리표를 한글(HWP)에서 열 수 있는 문서로 저장한다.
 *
 * 브라우저에서 진짜 .hwp 바이너리를 만드는 것은 불가능하다(비공개 포맷).
 * 대신 한글이 기본 지원하는 서식 있는 웹 문서(.doc, HTML 기반)를 만든다.
 * 한글에서 "열기 → 파일 형식: 모든 파일"로 열면 표와 서식이 그대로 들어오고,
 * 그 자리에서 편집한 뒤 .hwp 로 다시 저장할 수 있다. MS Word 로도 열린다.
 */
export function seatChartDoc(cls, groups) {
  const esc = (s) =>
    String(s ?? '').replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m])

  const today = new Date()
  const stamp = `${today.getFullYear()}. ${today.getMonth() + 1}. ${today.getDate()}.`

  // 한글·워드는 CSS float / grid 를 무시하고 세로로 쌓아 버린다.
  // 그래서 화면과 같은 격자를 만들려면 "표 안에 표"를 써야 한다.
  // 바깥 표가 모둠을 가로로 배열하고, 안쪽 표가 2×2 마주 보는 책상을 만든다.
  const cols = groups.length <= 4 ? 2 : groups.length <= 9 ? 3 : 4

  const groupTables = groups
    .map((group, i) => {
      const seated = assignSeats(group)
      const { emoji, title } = chemiTitle(group)
      const cells = seated.map((s) => {
        const ch = getCharacter(s.character)
        return `<td class="seat"><p class="sid">${esc(s.sid)}번</p>
          <p class="nm">${esc(ch.name)}</p>
          <p class="rl">${esc(getRole(s.role).label)}</p></td>`
      })
      // 2×2 마주 보는 책상이므로 두 칸씩 한 줄로 묶는다. 홀수면 마지막 칸을 가로로 병합.
      const rows = []
      for (let k = 0; k < cells.length; k += 2) {
        const pair = cells.slice(k, k + 2)
        if (pair.length === 1) rows.push(`<tr>${pair[0].replace('<td ', '<td colspan="2" ')}</tr>`)
        else rows.push(`<tr>${pair.join('')}</tr>`)
      }
      return `<table class="grp" cellspacing="0">
        <tr><th colspan="2">${esc(i + 1)}모둠 · ${esc(title)}</th></tr>
        ${rows.join('')}
      </table>`
    })

  // 바깥 표: cols 개씩 한 줄에 배치
  const layoutRows = []
  for (let k = 0; k < groupTables.length; k += cols) {
    const slice = groupTables.slice(k, k + cols)
    while (slice.length < cols) slice.push('') // 빈칸으로 채워 열 너비 유지
    layoutRows.push(`<tr>${slice.map((t) => `<td class="cell">${t}</td>`).join('')}</tr>`)
  }
  const boards = `<table class="layout" cellspacing="0"><tr><td class="board" colspan="${cols}">${esc(
    cls.name,
  )}</td></tr>${layoutRows.join('')}</table>`

  // 명단 표 (이름을 적어 넣을 수 있게 빈칸 포함). 모둠 열은 rowspan 으로 병합해 어긋나지 않게 한다.
  const rosterRows = groups
    .map((group, i) =>
      group
        .map((s, j) => {
          const ch = getCharacter(s.character)
          const head = j === 0 ? `<td rowspan="${group.length}" class="gcol">${esc(i + 1)}모둠</td>` : ''
          return `<tr>${head}
            <td>${esc(s.sid)}</td>
            <td class="blank"></td>
            <td>${esc(ch.name)}</td>
            <td>${esc(getRole(s.role).label)}</td>
          </tr>`
        })
        .join(''),
    )
    .join('')

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8" />
<title>${esc(cls.name)} 자리표</title>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: '맑은 고딕', 'Malgun Gothic', sans-serif; font-size: 10pt; }
  h1 { font-size: 16pt; text-align: center; margin: 0 0 4pt; }
  .meta { text-align: center; font-size: 9pt; color: #666; margin: 0 0 12pt; }
  /* 바깥 배치 표 — 화면과 같은 격자를 만든다 */
  table.layout { border-collapse: collapse; width: 100%; }
  td.board { text-align: center; background: #4a6353; color: #fff;
             padding: 7pt; font-weight: bold; letter-spacing: 5pt; font-size: 11pt; }
  td.cell { vertical-align: top; padding: 5pt 3pt; }

  /* 모둠 하나 = 2×2 마주 보는 책상 */
  table.grp { border-collapse: collapse; width: 100%; border: 1pt solid #999; }
  table.grp th { background: #f2ece6; border: 1pt solid #999; padding: 4pt; font-size: 9.5pt; }
  td.seat { border: 1pt solid #bbb; width: 50%; text-align: center; padding: 5pt 2pt; }
  td.seat p { margin: 0; }
  .sid { font-weight: bold; font-size: 11pt; }
  .nm { font-size: 8.5pt; color: #555; }
  .rl { font-size: 8.5pt; color: #777; }

  table.roster { border-collapse: collapse; width: 100%; margin-top: 6pt; }
  table.roster th, table.roster td { border: 1pt solid #999; padding: 4pt; font-size: 9.5pt; text-align: center; }
  table.roster th { background: #f2ece6; }
  table.roster td.gcol { background: #faf7f3; font-weight: bold; vertical-align: middle; }
  table.roster td.blank { width: 18%; }
</style></head>
<body>
  <h1>${esc(cls.name)} 모둠 자리표</h1>
  <p class="meta">${esc(stamp)} &nbsp;|&nbsp; ${esc(groups.length)}모둠 &nbsp;|&nbsp;
     ${esc(groups.reduce((a, g) => a + g.length, 0))}명</p>

  ${boards}

  <h1 style="font-size:12pt;text-align:left;margin-top:14pt;">모둠 명단</h1>
  <table class="roster">
    <tr><th>모둠</th><th>학번</th><th>이름</th><th>탐구 스타일</th><th>역할</th></tr>
    ${rosterRows}
  </table>
</body></html>`
}

/** 문서를 내려받는다. 한글에서 바로 열 수 있도록 .doc 확장자를 쓴다. */
export function downloadSeatChartDoc(cls, groups) {
  const html = seatChartDoc(cls, groups)
  // 한글·워드가 인코딩을 정확히 인식하도록 BOM을 붙인다.
  const blob = new Blob(['﻿', html], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${cls.name.replace(/[\\/:*?"<>|]/g, '_')}_자리표.doc`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
