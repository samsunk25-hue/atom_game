# 🧞 모둠지니 (Moodum Genie)

> AI 없이 동작하는 과학 모둠 자동 구성 웹앱  
> Firebase Hosting + Firestore 기반 · PWA 지원

🔗 **라이브**: https://moodum-maker-2026.web.app  
📦 **저장소**: https://github.com/samsunk25-hue/moodum-genie

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🎲 **모둠 자동 구성** | 성적·I/E 유형·희망·기피·역할을 종합해 최적 배치 |
| 📊 **우선순위 알고리즘** | 1순위 성적 골고루, 2순위 I/E 혼합, 이후 기존 순서 |
| 📱 **QR 접속** | 학생은 QR 스캔 하나로 설문 참여 |
| 🪑 **자리표 공개 동기화** | 교사 화면과 학생 화면이 카운트다운 후 동시 공개 |
| 🏆 **명예의 전당** | 자리표에서 포인트 부여 → 생기부 초안 자동 생성 |
| 🔒 **학급 잠금** | 모둠 확정 후 학생 재제출 차단 |
| 📄 **한글 문서 내보내기** | 생기부 초안을 .hwp 형식으로 저장 |

---

## 🏗️ 기술 스택

- **프론트엔드**: React 19 + Vite 8 (SPA, Hash Router)
- **데이터**: Firebase Firestore (실시간 구독) / localStorage (Firebase 없이도 동작)
- **배포**: Firebase Hosting + PWA (서비스 워커)
- **스타일**: Vanilla CSS (외부 UI 라이브러리 없음)

---

## 🚀 로컬 실행

```bash
cd app
cp .env.example .env    # Firebase 키 입력 (없으면 localStorage 모드)
npm install
npm run dev
```

`.env`에 Firebase 키가 없어도 localStorage 백엔드로 바로 실행됩니다.

---

## 📐 모둠 구성 알고리즘 우선순위

1. 교사 지정 분리/고정 (절대 조건)
2. 기피 학생 절대 배제 (Hard Constraint)
3. **성적(level) 골고루 배분** ★ 1순위
4. **I/E 혼합 (E·I 모두 포함)** ★ 2순위
5. 최근 3회 같은 모둠 감점
6. 희망 학생 반영
7. 친구 편중 방지
8. 남녀 균형
9. 과학 흥미 균형
10. 탐구 스타일(캐릭터) 균형
11. 역할 균형

---

## 📁 프로젝트 구조

```
a260722gr/
├── app/                    # Vite React 앱
│   ├── src/
│   │   ├── pages/          # ClassRoom · Student · StudentRoom · SeatChart …
│   │   ├── components/     # GroupBoard · CharacterArt · Layout …
│   │   └── lib/            # db.js · grouping.js · characters.js …
│   └── dist/               # 빌드 결과 (Firebase Hosting 배포 대상)
├── firebase.json
├── firestore.rules
└── 모둠구성 계획서.md
```

---

## 🔧 배포

```bash
cd app && npm run build
firebase deploy --only hosting
```
