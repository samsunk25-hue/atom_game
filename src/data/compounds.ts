export interface CompoundRecipe {
  id: string;
  name: string;
  formula: string;
  ingredients: Record<string, number>; // symbol -> count
  emoji: string;
  title: string;
}

export const compounds: CompoundRecipe[] = [
  {
    id: 'h2o',
    name: '물',
    formula: 'H₂O',
    ingredients: { 'H': 2, 'O': 1 },
    emoji: '💧',
    title: '물방울 연금술사'
  },
  {
    id: 'nacl',
    name: '소금',
    formula: 'NaCl',
    ingredients: { 'Na': 1, 'Cl': 1 },
    emoji: '🧂',
    title: '소금 장인'
  },
  {
    id: 'co2',
    name: '이산화탄소',
    formula: 'CO₂',
    ingredients: { 'C': 1, 'O': 2 },
    emoji: '🫧',
    title: '탄산수 제조기'
  },
  {
    id: 'ch4',
    name: '메테인',
    formula: 'CH₄',
    ingredients: { 'C': 1, 'H': 4 },
    emoji: '🔥',
    title: '천연가스 탐험가'
  },
  {
    id: 'nh3',
    name: '암모니아',
    formula: 'NH₃',
    ingredients: { 'N': 1, 'H': 3 },
    emoji: '👃',
    title: '코를 찌르는 마술사'
  },
  {
    id: 'o2',
    name: '산소 기체',
    formula: 'O₂',
    ingredients: { 'O': 2 },
    emoji: '🌬️',
    title: '생명의 숨결'
  }
];
