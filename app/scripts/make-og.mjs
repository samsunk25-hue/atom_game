/**
 * 오픈그래프 이미지(1200×630 PNG)를 만든다.
 *   npm run og
 * 카카오톡·페이스북 등은 SVG를 og:image 로 받지 않아 PNG로 굽는다.
 *
 * ⚠ 이 파일은 UTF-8 한글이 들어 있다. PowerShell 로 문자열 치환하면 인코딩이 깨진다.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, '../public/og.png')

const W = 1200
const H = 630

// 귀여운 손글씨 느낌 — 윈도우에 기본 설치된 한양 얕은샘물체.
// 이미지를 굽는 시점에만 쓰이므로 학생 기기에 이 글꼴이 없어도 상관없다.
const FONT = 'HYShortSamul-Medium, HY얕은샘물M, Malgun Gothic, sans-serif'

// 캐릭터 얼굴 (앱의 CharacterArt 를 단순화한 버전)
function face(x, y, r, fill, ears) {
  return `
    ${ears(x, y, r)}
    <circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#4A3B36" stroke-width="3"/>
    <circle cx="${x - r * 0.34}" cy="${y - r * 0.1}" r="${r * 0.11}" fill="#4A3B36"/>
    <circle cx="${x + r * 0.34}" cy="${y - r * 0.1}" r="${r * 0.11}" fill="#4A3B36"/>
    <path d="M${x - r * 0.22} ${y + r * 0.3} q${r * 0.22} ${r * 0.24} ${r * 0.44} 0"
          fill="none" stroke="#4A3B36" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="${x - r * 0.6}" cy="${y + r * 0.22}" rx="${r * 0.17}" ry="${r * 0.11}" fill="#FFA9C0" opacity="0.75"/>
    <ellipse cx="${x + r * 0.6}" cy="${y + r * 0.22}" rx="${r * 0.17}" ry="${r * 0.11}" fill="#FFA9C0" opacity="0.75"/>
  `
}

const roundEars = (x, y, r) => `
  <circle cx="${x - r * 0.72}" cy="${y - r * 0.78}" r="${r * 0.34}" fill="#E3CDB6" stroke="#4A3B36" stroke-width="3"/>
  <circle cx="${x + r * 0.72}" cy="${y - r * 0.78}" r="${r * 0.34}" fill="#E3CDB6" stroke="#4A3B36" stroke-width="3"/>`
const pointyEars = (x, y, r) => `
  <path d="M${x - r * 0.85} ${y - r * 0.5} L${x - r} ${y - r * 1.5} L${x - r * 0.25} ${y - r * 0.9} Z"
        fill="#FBD9C0" stroke="#4A3B36" stroke-width="3" stroke-linejoin="round"/>
  <path d="M${x + r * 0.85} ${y - r * 0.5} L${x + r} ${y - r * 1.5} L${x + r * 0.25} ${y - r * 0.9} Z"
        fill="#FBD9C0" stroke="#4A3B36" stroke-width="3" stroke-linejoin="round"/>`
const longEars = (x, y, r) => `
  <ellipse cx="${x - r * 0.4}" cy="${y - r * 1.4}" rx="${r * 0.22}" ry="${r * 0.66}" fill="#FFD3E2" stroke="#4A3B36" stroke-width="3"/>
  <ellipse cx="${x + r * 0.4}" cy="${y - r * 1.4}" rx="${r * 0.22}" ry="${r * 0.66}" fill="#FFD3E2" stroke="#4A3B36" stroke-width="3"/>`
const flopEars = (x, y, r) => `
  <ellipse cx="${x - r * 0.95}" cy="${y - r * 0.1}" rx="${r * 0.3}" ry="${r * 0.6}" fill="#F0BE96" stroke="#4A3B36" stroke-width="3"/>
  <ellipse cx="${x + r * 0.95}" cy="${y - r * 0.1}" rx="${r * 0.3}" ry="${r * 0.6}" fill="#F0BE96" stroke="#4A3B36" stroke-width="3"/>`

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFF3F7"/>
      <stop offset="48%" stop-color="#FFE9F2"/>
      <stop offset="100%" stop-color="#EFF1FF"/>
    </linearGradient>
    <linearGradient id="pill" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FF9DBE"/>
      <stop offset="100%" stop-color="#C6A8F0"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- 배경 장식 -->
  <circle cx="1075" cy="90" r="120" fill="#FFFFFF" opacity="0.5"/>
  <circle cx="120" cy="560" r="90" fill="#FFFFFF" opacity="0.45"/>
  ${[
    [95, 120, 16],
    [1130, 470, 13],
    [980, 60, 10],
    [200, 90, 11],
  ]
    .map(
      ([x, y, s]) =>
        `<path d="M${x} ${y - s} l${s * 0.3} ${s * 0.6} ${s * 0.7} ${s * 0.3} -${s * 0.7} ${s * 0.3} -${s * 0.3} ${s * 0.6} -${s * 0.3}-${s * 0.6} -${s * 0.7}-${s * 0.3} ${s * 0.7}-${s * 0.3} Z"
              fill="#FFD76B" stroke="#4A3B36" stroke-width="2.4" stroke-linejoin="round"/>`,
    )
    .join('')}

  <!-- 왼쪽: 제목 -->
  <text x="86" y="232" font-family="${FONT}" font-size="118" fill="#5A3E4C">모둠지니</text>
  <!-- 이모지는 색이 없는 글꼴로 그려지므로 이미지 안에서는 쓰지 않는다 -->
  <text x="92" y="302" font-family="${FONT}" font-size="38" fill="#8A6E7C">소원을 들어주는 모둠 요정</text>

  <rect x="88" y="346" width="620" height="4" rx="2" fill="#FF9DBE" opacity="0.5"/>

  <text x="88" y="428" font-family="${FONT}" font-size="44" fill="#5A3E4C">선생님 손은 가볍게,</text>
  <text x="88" y="492" font-family="${FONT}" font-size="44" fill="#5A3E4C">아이들 마음은 딱 맞게.</text>

  <!-- 오른쪽: 캐릭터 모둠 -->
  <g transform="translate(56,-6)">
    ${face(880, 188, 60, '#E3CDB6', roundEars)}
    ${face(1035, 196, 56, '#FBD9C0', pointyEars)}
    ${face(872, 396, 55, '#FFD3E2', longEars)}
    ${face(1032, 390, 58, '#FFE3B3', flopEars)}
  </g>

  <!-- 아래 주소 -->
  <rect x="0" y="590" width="${W}" height="40" fill="url(#pill)" opacity="0.9"/>
  <text x="${W / 2}" y="619" text-anchor="middle" font-family="${FONT}"
        font-size="25" fill="#FFFFFF">moodum-maker-2026.web.app</text>
</svg>`

mkdirSync(dirname(out), { recursive: true })
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: W },
  font: {
    fontDirs: ['C:/Windows/Fonts'],
    defaultFontFamily: 'HYShortSamul-Medium',
    loadSystemFonts: true,
  },
})
  .render()
  .asPng()

writeFileSync(out, png)
console.log(`OG 이미지 생성: ${out} (${(png.length / 1024).toFixed(0)} KB)`)
