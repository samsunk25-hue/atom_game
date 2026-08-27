// 4가지 A/B 질문 → 16종 동물 캐릭터
// 축: E/I(활동성) · P/T(계획형/즉흥형) · D/S(주도/지원) · F/L(감성/논리)

export const QUESTIONS = [
  {
    axis: 0,
    q: '모둠 활동이 시작됐어! 나는?',
    a: { key: 'E', label: '일단 친구들한테 말부터 걸어본다' },
    b: { key: 'I', label: '먼저 상황을 조용히 살펴본다' },
  },
  {
    axis: 1,
    q: '탐구 보고서를 써야 해. 나는?',
    a: { key: 'P', label: '계획표부터 만들고 차근차근' },
    b: { key: 'T', label: '떠오르는 대로 일단 시작!' },
  },
  {
    axis: 2,
    q: '의견이 갈렸어. 나는?',
    a: { key: 'D', label: '내 생각을 분명하게 말한다' },
    b: { key: 'S', label: '친구 의견을 듣고 도와준다' },
  },
  {
    axis: 3,
    q: '실험 결과가 예상과 달라! 나는?',
    a: { key: 'F', label: '"우와 신기하다!" 먼저 느낌부터' },
    b: { key: 'L', label: '"왜 그렇지?" 원인부터 따져본다' },
  },
]

// 코드 = 4축 조합 (예: EPDF)
export const CHARACTERS = {
  EPDF: { name: '불꽃 사자', emoji: '🦁', desc: '앞장서서 분위기를 이끄는 리더', color: '#FFD9A0' },
  EPDL: { name: '똑똑 여우', emoji: '🦊', desc: '전략을 짜서 팀을 이끄는 참모', color: '#FFC7A8' },
  EPSF: { name: '다정 강아지', emoji: '🐶', desc: '누구와도 잘 지내는 분위기 메이커', color: '#FFE3B3' },
  EPSL: { name: '성실 비버', emoji: '🦫', desc: '계획대로 착착 만들어내는 일꾼', color: '#E7D3BC' },
  ETDF: { name: '통통 토끼', emoji: '🐰', desc: '아이디어가 팡팡 터지는 발상왕', color: '#FFD3E2' },
  ETDL: { name: '호기심 까마귀', emoji: '🐦‍⬛', desc: '엉뚱한 질문으로 판을 뒤집는 탐험가', color: '#D6D8F0' },
  ETSF: { name: '방긋 수달', emoji: '🦦', desc: '놀이처럼 즐겁게 참여하는 친구', color: '#C9E7DE' },
  ETSL: { name: '느긋 라쿤', emoji: '🦝', desc: '눈치 빠르게 빈틈을 채워주는 조력자', color: '#D9DDE3' },
  IPDF: { name: '든든 곰', emoji: '🐻', desc: '조용하지만 책임감이 최고', color: '#E3CDB6' },
  IPDL: { name: '차분 올빼미', emoji: '🦉', desc: '깊게 생각하고 정확하게 말하는 분석가', color: '#CFC6E8' },
  IPSF: { name: '포근 양', emoji: '🐑', desc: '친구를 배려하며 묵묵히 돕는 마음', color: '#F2E6DA' },
  IPSL: { name: '꼼꼼 거북', emoji: '🐢', desc: '천천히 정확하게 끝까지 마무리', color: '#C6E3C1' },
  ITDF: { name: '반짝 고양이', emoji: '🐱', desc: '내 방식대로 자유롭게 탐구', color: '#FBD9C0' },
  ITDL: { name: '신비 문어', emoji: '🐙', desc: '남다른 시선으로 문제를 푸는 괴짜', color: '#F0C8D8' },
  ITSF: { name: '조용 판다', emoji: '🐼', desc: '옆에 있으면 마음이 편해지는 친구', color: '#E6E6E6' },
  ITSL: { name: '관찰 펭귄', emoji: '🐧', desc: '작은 변화도 놓치지 않는 관찰자', color: '#CFE0F0' },
}

export const CHARACTER_CODES = Object.keys(CHARACTERS)

export function codeFromAnswers(answers) {
  // answers: ['a'|'b'] * 4
  return QUESTIONS.map((q, i) => (answers[i] === 'a' ? q.a.key : q.b.key)).join('')
}

export function getCharacter(code) {
  return CHARACTERS[code] || { name: '탐구 친구', emoji: '🐾', desc: '', color: '#EEE' }
}

export const ROLES = [
  { key: 'experiment', label: '실험', emoji: '🧪' },
  { key: 'observe', label: '관찰', emoji: '🔍' },
  { key: 'record', label: '기록', emoji: '📝' },
  { key: 'present', label: '발표', emoji: '🎤' },
  { key: 'arrange', label: '정리', emoji: '🧹' },
]

export function getRole(key) {
  return ROLES.find((r) => r.key === key) || { key, label: '미정', emoji: '❔' }
}

export const LEVELS = [
  { key: 'high', label: '상' },
  { key: 'mid', label: '중' },
  { key: 'low', label: '하' },
]

export const LEVEL_SCORE = { high: 3, mid: 2, low: 1 }
