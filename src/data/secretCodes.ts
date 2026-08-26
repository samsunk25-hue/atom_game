export interface SecretCodeMission {
  id: string;
  type: 'word' | 'math';
  question: string;
  answer: string;
  rewardText: string;
  author?: string;
  isCustom?: boolean;
}

export const defaultSecretCodes: SecretCodeMission[] = [
  {
    id: 'banana',
    type: 'word',
    question: '56 (Ba) + 11 (Na) + 11 (Na)',
    answer: 'BANANA',
    rewardText: '달콤한 바나나 획득! 🍌',
    author: '시스템'
  },
  {
    id: 'cup',
    type: 'word',
    question: '6 (C) + 92 (U) + 15 (P)',
    answer: 'CUP',
    rewardText: '따뜻한 머그컵 획득! ☕',
    author: '시스템'
  },
  {
    id: 'bear',
    type: 'word',
    question: '4 (Be) + 18 (Ar)',
    answer: 'BEAR',
    rewardText: '귀여운 곰인형 획득! 🐻',
    author: '시스템'
  },
  {
    id: 'cook',
    type: 'word',
    question: '6 (C) + 8 (O) + 8 (O) + 19 (K)',
    answer: 'COOK',
    rewardText: '요리사 모자 획득! 👨‍🍳',
    author: '시스템'
  },
  {
    id: 'taco',
    type: 'word',
    question: '73 (Ta) + 6 (C) + 8 (O)',
    answer: 'TACO',
    rewardText: '맛있는 타코 획득! 🌮',
    author: '시스템'
  },
  {
    id: 'neon',
    type: 'word',
    question: '10 (Ne) + 8 (O) + 7 (N)',
    answer: 'NEON',
    rewardText: '빛나는 네온사인 획득! 🚥',
    author: '시스템'
  },
  {
    id: 'police',
    type: 'word',
    question: '15 (P) + 8 (O) + 3 (Li) + 58 (Ce)',
    answer: 'POLICE',
    rewardText: '경찰 배지 획득! 👮',
    author: '시스템'
  },
  {
    id: 'spam',
    type: 'word',
    question: '16 (S) + 15 (P) + 95 (Am)',
    answer: 'SPAM',
    rewardText: '맛있는 스팸 캔 획득! 🥫',
    author: '시스템'
  },
  {
    id: 'math1',
    type: 'math',
    question: '산소(O)의 원자 번호 + 탄소(C)의 원자 번호 = ?',
    answer: '14',
    rewardText: '1단계 자물쇠 해제! 🔓 (8 + 6 = 14)',
    author: '시스템'
  },
  {
    id: 'math2',
    type: 'math',
    question: '나트륨(Na)의 원자 번호 - 수소(H)의 원자 번호 = ?',
    answer: '10',
    rewardText: '2단계 자물쇠 해제! 🔓 (11 - 1 = 10)',
    author: '시스템'
  },
  {
    id: 'math3',
    type: 'math',
    question: '헬륨(He) × 베릴륨(Be) = ?',
    answer: '8',
    rewardText: '3단계 자물쇠 해제! 🔓 (2 × 4 = 8)',
    author: '시스템'
  },
  {
    id: 'math4',
    type: 'math',
    question: '마그네슘(Mg) + 알루미늄(Al) = ?',
    answer: '25',
    rewardText: '4단계 자물쇠 해제! 🔓 (12 + 13 = 25)',
    author: '시스템'
  },
  {
    id: 'math5',
    type: 'math',
    question: '칼슘(Ca) - 리튬(Li) = ?',
    answer: '17',
    rewardText: '5단계 자물쇠 해제! 🔓 (20 - 3 = 17)',
    author: '시스템'
  },
  {
    id: 'math6',
    type: 'math',
    question: '탄소(C) × 질소(N) = ?',
    answer: '42',
    rewardText: '6단계 자물쇠 해제! 🔓 (6 × 7 = 42)',
    author: '시스템'
  },
  {
    id: 'math7',
    type: 'math',
    question: '염소(Cl) + 칼륨(K) = ?',
    answer: '36',
    rewardText: '7단계 자물쇠 해제! 🔓 (17 + 19 = 36)',
    author: '시스템'
  },
  {
    id: 'math8',
    type: 'math',
    question: '네온(Ne) + 아르곤(Ar) = ?',
    answer: '28',
    rewardText: '8단계 자물쇠 해제! 🔓 (10 + 18 = 28)',
    author: '시스템'
  }
];

export const secretCodes = defaultSecretCodes;
