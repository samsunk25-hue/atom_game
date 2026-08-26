export interface SecretCodeMission {
  id: string;
  type: 'word' | 'math';
  question: string; // The hint or the atomic numbers shown
  answer: string; // The expected answer (Word or Number)
  rewardText: string;
}

export const secretCodes: SecretCodeMission[] = [
  {
    id: 'banana',
    type: 'word',
    question: '56 + 11 + 11',
    answer: 'BANANA',
    rewardText: '바나나 획득! 🍌'
  },
  {
    id: 'cup',
    type: 'word',
    question: '6 + 92 + 15', // C(6) + U(92) + P(15) -> wait, U is 92. Let's just use it.
    answer: 'CUP',
    rewardText: '컵 획득! ☕'
  },
  {
    id: 'bear',
    type: 'word',
    question: '4 + 18', // Be(4) + Ar(18) = BeAr
    answer: 'BEAR',
    rewardText: '곰돌이 획득! 🐻'
  },
  {
    id: 'math1',
    type: 'math',
    question: '산소(O)의 원자 번호 + 탄소(C)의 원자 번호 = ?',
    answer: '14',
    rewardText: '자물쇠 1단계 해제! 🔓'
  },
  {
    id: 'math2',
    type: 'math',
    question: '나트륨(Na)의 원자 번호 - 수소(H)의 원자 번호 = ?',
    answer: '10',
    rewardText: '자물쇠 2단계 해제! 🔓'
  }
];
