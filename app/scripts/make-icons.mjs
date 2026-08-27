/**
 * 홈 화면 바로가기용 앱 아이콘을 만든다.
 *   npm run icons
 * 192·512(마스커블)·180(iOS) 세 가지를 굽는다.
 *
 * ⚠ UTF-8 한글이 들어 있다. PowerShell 문자열 치환 금지.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const here = dirname(fileURLToPath(import.meta.url))
const pub = resolve(here, '../public')

/**
 * @param pad 가장자리 여백 비율. 안드로이드 마스커블 아이콘은 원형으로 잘리므로
 *            안전 영역(가운데 80%)에 그림이 들어가도록 여백을 크게 준다.
 */
function iconSvg(pad = 0.1) {
  const S = 512
  const cx = S / 2
  const cy = S / 2
  const r = S * (0.5 - pad) * 0.62 // 얼굴 반지름

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFB3CD"/>
      <stop offset="100%" stop-color="#C6A8F0"/>
    </linearGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#g)"/>

  <!-- 반짝임 -->
  ${[
    [110, 108, 26],
    [408, 138, 18],
    [96, 404, 16],
  ]
    .map(
      ([x, y, s]) =>
        `<path d="M${x} ${y - s} l${s * 0.3} ${s * 0.6} ${s * 0.7} ${s * 0.3} -${s * 0.7} ${s * 0.3} -${s * 0.3} ${s * 0.6} -${s * 0.3}-${s * 0.6} -${s * 0.7}-${s * 0.3} ${s * 0.7}-${s * 0.3} Z"
              fill="#FFF3C4" opacity="0.85"/>`,
    )
    .join('')}

  <!-- 곰 얼굴 -->
  <circle cx="${cx - r * 0.72}" cy="${cy - r * 0.82}" r="${r * 0.36}" fill="#E3CDB6" stroke="#4A3B36" stroke-width="10"/>
  <circle cx="${cx + r * 0.72}" cy="${cy - r * 0.82}" r="${r * 0.36}" fill="#E3CDB6" stroke="#4A3B36" stroke-width="10"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFF1E2" stroke="#4A3B36" stroke-width="10"/>
  <circle cx="${cx - r * 0.36}" cy="${cy - r * 0.12}" r="${r * 0.12}" fill="#4A3B36"/>
  <circle cx="${cx + r * 0.36}" cy="${cy - r * 0.12}" r="${r * 0.12}" fill="#4A3B36"/>
  <ellipse cx="${cx}" cy="${cy + r * 0.34}" rx="${r * 0.34}" ry="${r * 0.26}" fill="#FFE0CB" stroke="#4A3B36" stroke-width="7"/>
  <path d="M${cx - r * 0.16} ${cy + r * 0.3} q${r * 0.16} ${r * 0.2} ${r * 0.32} 0"
        fill="none" stroke="#4A3B36" stroke-width="8" stroke-linecap="round"/>
  <ellipse cx="${cx - r * 0.68}" cy="${cy + r * 0.2}" rx="${r * 0.2}" ry="${r * 0.13}" fill="#FFA9C0" opacity="0.8"/>
  <ellipse cx="${cx + r * 0.68}" cy="${cy + r * 0.2}" rx="${r * 0.2}" ry="${r * 0.13}" fill="#FFA9C0" opacity="0.8"/>
</svg>`
}

function bake(svg, size, file) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()
  writeFileSync(resolve(pub, file), png)
  return png.length
}

mkdirSync(pub, { recursive: true })
const tight = iconSvg(0.06) // 일반 아이콘 — 여백 적게
const safe = iconSvg(0.16) // 마스커블 — 원형으로 잘려도 얼굴이 살아남게

const made = [
  ['icon-192.png', 192, tight],
  ['icon-512.png', 512, tight],
  ['icon-maskable-512.png', 512, safe],
  ['apple-touch-icon.png', 180, tight],
].map(([file, size, svg]) => `${file} (${(bake(svg, size, file) / 1024).toFixed(0)} KB)`)

console.log('아이콘 생성:', made.join(', '))
