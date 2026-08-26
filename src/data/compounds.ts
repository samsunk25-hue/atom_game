export interface CompoundRecipe {
  id: string;
  name: string;
  formula: string;
  ingredients: Record<string, number>; // symbol -> count
  emoji: string;
  title: string;
  category?: 'homo' | 'compound'; // 홑원소 물질 or 화합물
}

export const compounds: CompoundRecipe[] = [
  // 홑원소 물질 (1원자 및 동핵 분자)
  {
    id: 'h2',
    name: '수소 기체',
    formula: 'H₂',
    ingredients: { 'H': 2 },
    emoji: '🚀',
    title: '우주 로켓의 심장',
    category: 'homo'
  },
  {
    id: 'o2',
    name: '산소 기체',
    formula: 'O₂',
    ingredients: { 'O': 2 },
    emoji: '🌬️',
    title: '생명의 숨결',
    category: 'homo'
  },
  {
    id: 'o3',
    name: '오존',
    formula: 'O₃',
    ingredients: { 'O': 3 },
    emoji: '🛡️',
    title: '오존층 수호자',
    category: 'homo'
  },
  {
    id: 'n2',
    name: '질소 기체',
    formula: 'N₂',
    ingredients: { 'N': 2 },
    emoji: '🥨',
    title: '바삭한 과자 수호대',
    category: 'homo'
  },
  {
    id: 'cl2',
    name: '염소 기체',
    formula: 'Cl₂',
    ingredients: { 'Cl': 2 },
    emoji: '🏊',
    title: '살균 소독 마스터',
    category: 'homo'
  },
  {
    id: 'he1',
    name: '헬륨 (1원자 분자)',
    formula: 'He',
    ingredients: { 'He': 1 },
    emoji: '🎈',
    title: '둥실둥실 풍선',
    category: 'homo'
  },
  {
    id: 'ne1',
    name: '네온 (1원자 분자)',
    formula: 'Ne',
    ingredients: { 'Ne': 1 },
    emoji: '🚥',
    title: '빛나는 네온사인',
    category: 'homo'
  },
  {
    id: 'ar1',
    name: '아르곤 (1원자 분자)',
    formula: 'Ar',
    ingredients: { 'Ar': 1 },
    emoji: '💡',
    title: '전구 가스 보호자',
    category: 'homo'
  },
  {
    id: 'fe1',
    name: '순철 (금속 홑원소)',
    formula: 'Fe',
    ingredients: { 'Fe': 1 },
    emoji: '🧲',
    title: '강철의 지배자',
    category: 'homo'
  },
  {
    id: 'cu1',
    name: '순구리 (금속 홑원소)',
    formula: 'Cu',
    ingredients: { 'Cu': 1 },
    emoji: '🔌',
    title: '전도율 마스터',
    category: 'homo'
  },
  {
    id: 'au1',
    name: '순금 (금속 홑원소)',
    formula: 'Au',
    ingredients: { 'Au': 1 },
    emoji: '👑',
    title: '찬란한 황금관',
    category: 'homo'
  },
  {
    id: 'ag1',
    name: '순은 (금속 홑원소)',
    formula: 'Ag',
    ingredients: { 'Ag': 1 },
    emoji: '🥄',
    title: '순백의 은수저',
    category: 'homo'
  },

  // 화합물 (서로 다른 2종 이상의 원소 결합)
  {
    id: 'h2o',
    name: '물',
    formula: 'H₂O',
    ingredients: { 'H': 2, 'O': 1 },
    emoji: '💧',
    title: '물방울 연금술사',
    category: 'compound'
  },
  {
    id: 'nacl',
    name: '소금 (염화 나트륨)',
    formula: 'NaCl',
    ingredients: { 'Na': 1, 'Cl': 1 },
    emoji: '🧂',
    title: '소금 장인',
    category: 'compound'
  },
  {
    id: 'co2',
    name: '이산화탄소',
    formula: 'CO₂',
    ingredients: { 'C': 1, 'O': 2 },
    emoji: '🫧',
    title: '탄산수 제조기',
    category: 'compound'
  },
  {
    id: 'ch4',
    name: '메테인',
    formula: 'CH₄',
    ingredients: { 'C': 1, 'H': 4 },
    emoji: '🔥',
    title: '천연가스 탐험가',
    category: 'compound'
  },
  {
    id: 'nh3',
    name: '암모니아',
    formula: 'NH₃',
    ingredients: { 'N': 1, 'H': 3 },
    emoji: '👃',
    title: '코를 찌르는 마술사',
    category: 'compound'
  },
  {
    id: 'hcl',
    name: '염화 수소 (위산)',
    formula: 'HCl',
    ingredients: { 'H': 1, 'Cl': 1 },
    emoji: '🧪',
    title: '강력한 산성 위액',
    category: 'compound'
  }
];
