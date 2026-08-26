export interface ElementData {
  atomicNumber: number;
  symbol: string;
  name: string;
  emoji: string;
  usage: string;
  isCommon?: boolean;
}

export const elements: ElementData[] = [
  { atomicNumber: 1, symbol: 'H', name: '수소', emoji: '🚀', usage: '우주선 연료' },
  { atomicNumber: 2, symbol: 'He', name: '헬륨', emoji: '🎈', usage: '풍선' },
  { atomicNumber: 3, symbol: 'Li', name: '리튬', emoji: '🔋', usage: '스마트폰 배터리' },
  { atomicNumber: 4, symbol: 'Be', name: '베릴륨', emoji: '🛰️', usage: '인공위성 부품' },
  { atomicNumber: 5, symbol: 'B', name: '붕소', emoji: '🎾', usage: '테니스 라켓' },
  { atomicNumber: 6, symbol: 'C', name: '탄소', emoji: '✏️', usage: '연필심' },
  { atomicNumber: 7, symbol: 'N', name: '질소', emoji: '🥨', usage: '과자 포장 충전재' },
  { atomicNumber: 8, symbol: 'O', name: '산소', emoji: '🫁', usage: '호흡' },
  { atomicNumber: 9, symbol: 'F', name: '플루오린', emoji: '🪥', usage: '치약' },
  { atomicNumber: 10, symbol: 'Ne', name: '네온', emoji: '🚥', usage: '네온사인' },
  { atomicNumber: 11, symbol: 'Na', name: '나트륨', emoji: '🧂', usage: '소금' },
  { atomicNumber: 12, symbol: 'Mg', name: '마그네슘', emoji: '🎆', usage: '폭죽' },
  { atomicNumber: 13, symbol: 'Al', name: '알루미늄', emoji: '🥫', usage: '음료수 캔' },
  { atomicNumber: 14, symbol: 'Si', name: '규소', emoji: '💻', usage: '반도체' },
  { atomicNumber: 15, symbol: 'P', name: '인', emoji: '🧨', usage: '성냥' },
  { atomicNumber: 16, symbol: 'S', name: '황', emoji: '🌋', usage: '화산' },
  { atomicNumber: 17, symbol: 'Cl', name: '염소', emoji: '🏊', usage: '수영장 소독제' },
  { atomicNumber: 18, symbol: 'Ar', name: '아르곤', emoji: '💡', usage: '형광등' },
  { atomicNumber: 19, symbol: 'K', name: '칼륨', emoji: '🍌', usage: '바나나' },
  { atomicNumber: 20, symbol: 'Ca', name: '칼슘', emoji: '🦴', usage: '뼈' },
  
  // 일상에서 자주 사용되는 원소 (isCommon: true)
  { atomicNumber: 26, symbol: 'Fe', name: '철', emoji: '🧲', usage: '자석', isCommon: true },
  { atomicNumber: 29, symbol: 'Cu', name: '구리', emoji: '🔌', usage: '전선', isCommon: true },
  { atomicNumber: 30, symbol: 'Zn', name: '아연', emoji: '🔋', usage: '건전지', isCommon: true },
  { atomicNumber: 47, symbol: 'Ag', name: '은', emoji: '🥄', usage: '은수저', isCommon: true },
  { atomicNumber: 78, symbol: 'Pt', name: '백금', emoji: '💍', usage: '백금 반지', isCommon: true },
  { atomicNumber: 79, symbol: 'Au', name: '금', emoji: '👑', usage: '금관', isCommon: true },
  { atomicNumber: 80, symbol: 'Hg', name: '수은', emoji: '🌡️', usage: '온도계', isCommon: true },
  { atomicNumber: 82, symbol: 'Pb', name: '납', emoji: '🎣', usage: '낚시추', isCommon: true },
];
