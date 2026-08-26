import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { elements, type ElementData } from './data/elements';
import CustomKeypad from './components/CustomKeypad';
import MoleGrid from './components/MoleGrid';
import PeriodicTable from './components/PeriodicTable';
import CraftingTab from './components/CraftingTab';
import SecretCodeTab from './components/SecretCodeTab';
import StudyTab from './components/StudyTab';
import confetti from 'canvas-confetti';

type GameState = 'START' | 'PLAYING' | 'GAME_OVER';
type TabState = 'STUDY' | 'GAME1' | 'GAME2' | 'PT' | 'CRAFT' | 'SECRET';
type DifficultyLevel = 1 | 2 | 3;

const DIFFICULTY_CONFIG = {
  1: { label: '1단계 (여유롭게)', timeText: '5초', base: 5000, min: 3200, reduction: 80, icon: '🌱' },
  2: { label: '2단계 (표준)', timeText: '3초', base: 3000, min: 1600, reduction: 100, icon: '⚡' },
  3: { label: '3단계 (스피드)', timeText: '1.8초', base: 1800, min: 900, reduction: 70, icon: '🔥' },
};

function App() {
  const [activeTab, setActiveTab] = useState<TabState>('GAME1');
  const [gameState, setGameState] = useState<GameState>('START');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(() => {
    const saved = localStorage.getItem('gameDifficulty');
    return saved ? (parseInt(saved) as DifficultyLevel) : 2;
  });
  
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  
  const [activeMoleIndex, setActiveMoleIndex] = useState(-1);
  const [activeElement, setActiveElement] = useState<ElementData | null>(null);
  
  const [inputValue, setInputValue] = useState('');
  
  const [collectedElements, setCollectedElements] = useState<number[]>([]);
  const [floatingElement, setFloatingElement] = useState<{sym: string, id: number} | null>(null);

  const moleTimerRef = useRef<number | null>(null);
  const gameTimerRef = useRef<number | null>(null);

  const handleSelectDifficulty = (level: DifficultyLevel) => {
    setDifficulty(level);
    localStorage.setItem('gameDifficulty', String(level));
  };

  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('userNickname') || '';
  });
  const [showNicknameModal, setShowNicknameModal] = useState<boolean>(() => {
    return !localStorage.getItem('userNickname');
  });
  const [tempNickname, setTempNickname] = useState('');

  const [hasPlayedGame1, setHasPlayedGame1] = useState<boolean>(() => {
    return localStorage.getItem('hasPlayedGame1') === 'true';
  });
  const [hasPlayedGame2, setHasPlayedGame2] = useState<boolean>(() => {
    return localStorage.getItem('hasPlayedGame2') === 'true';
  });

  const isSecretUnlocked = hasPlayedGame1 && hasPlayedGame2;

  const handleSaveNickname = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = tempNickname.trim() || nickname.trim() || '학습자';
    setNickname(finalName);
    localStorage.setItem('userNickname', finalName);
    setShowNicknameModal(false);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
  };

  // Load collected elements from local storage
  useEffect(() => {
    const saved = localStorage.getItem('collectedElements');
    if (saved) {
      setCollectedElements(JSON.parse(saved));
    }
  }, []);

  const saveCollectedElement = (atomicNumber: number) => {
    if (!collectedElements.includes(atomicNumber)) {
      const newCollected = [...collectedElements, atomicNumber];
      setCollectedElements(newCollected);
      localStorage.setItem('collectedElements', JSON.stringify(newCollected));
    }
  };

  const spawnMole = useCallback(() => {
    // Determine which elements to use based on game mode
    let availableElements = elements;
    if (activeTab === 'GAME1') {
      availableElements = elements.filter(e => !e.isCommon); // Only 1-20 for Game 1 usually
    }
    
    // Prioritize uncollected elements
    const uncollected = availableElements.filter(e => !collectedElements.includes(e.atomicNumber));
    const pool = uncollected.length > 0 && Math.random() > 0.3 ? uncollected : availableElements;
    
    const randomElement = pool[Math.floor(Math.random() * pool.length)];
    const randomIndex = Math.floor(Math.random() * 6);
    
    setActiveElement(randomElement);
    setActiveMoleIndex(randomIndex);

    // 3-Level Difficulty Speed calculation
    const cfg = DIFFICULTY_CONFIG[difficulty];
    const moleTime = Math.max(cfg.min, cfg.base - (combo * cfg.reduction));

    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
    moleTimerRef.current = setTimeout(() => {
      // Missed the mole
      setCombo(0);
      setInputValue('');
      setActiveMoleIndex(-1);
      setTimeout(spawnMole, 450);
    }, moleTime) as unknown as number;
  }, [activeTab, collectedElements, combo, difficulty]);

  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setCombo(0);
    setTimeLeft(60);
    setInputValue('');
    
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;

    spawnMole();
  };

  const endGame = () => {
    setGameState('GAME_OVER');
    setActiveMoleIndex(-1);
    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);

    if (activeTab === 'GAME1') {
      setHasPlayedGame1(true);
      localStorage.setItem('hasPlayedGame1', 'true');
    } else if (activeTab === 'GAME2') {
      setHasPlayedGame2(true);
      localStorage.setItem('hasPlayedGame2', 'true');
    }
  };

  const handleInputSubmit = () => {
    if (!activeElement || gameState !== 'PLAYING') return;

    let isCorrect = false;
    if (activeTab === 'GAME1') {
      isCorrect = parseInt(inputValue) === activeElement.atomicNumber;
    } else {
      isCorrect = inputValue.toLowerCase() === activeElement.symbol.toLowerCase();
    }

    if (isCorrect) {
      // Success
      setScore(prev => prev + 10 + (combo * 2));
      setCombo(prev => prev + 1);
      saveCollectedElement(activeElement.atomicNumber);
      
      if (activeTab === 'GAME1' && !hasPlayedGame1) {
        setHasPlayedGame1(true);
        localStorage.setItem('hasPlayedGame1', 'true');
      } else if (activeTab === 'GAME2' && !hasPlayedGame2) {
        setHasPlayedGame2(true);
        localStorage.setItem('hasPlayedGame2', 'true');
      }

      // Floating animation
      setFloatingElement({ sym: activeElement.symbol, id: Date.now() });
      setTimeout(() => setFloatingElement(null), 1000);
      
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.8 }
      });

      // Show Big Heart
      const heart = document.createElement('div');
      heart.className = 'big-heart-container';
      heart.innerHTML = '<div class="big-heart">❤️</div>';
      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 1500);

      if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
      setActiveMoleIndex(-1);
      setInputValue('');
      setTimeout(spawnMole, 300);
    } else {
      // Wrong
      setCombo(0);
      setInputValue('');
      // Vibrate or shake effect could be added here
    }
  };

  // Change tab resets game
  useEffect(() => {
    if (gameState === 'PLAYING') {
      endGame();
    }
  }, [activeTab]);

  return (
    <div className="app-container">
      <header className="header">
        <button className={`tab-btn study-tab-btn ${activeTab === 'STUDY' ? 'active' : ''}`} onClick={() => setActiveTab('STUDY')}>
          📚 사전 학습
        </button>
        <button className={`tab-btn ${activeTab === 'GAME1' ? 'active' : ''}`} onClick={() => setActiveTab('GAME1')}>
          원자 번호 맞추기
        </button>
        <button className={`tab-btn ${activeTab === 'GAME2' ? 'active' : ''}`} onClick={() => setActiveTab('GAME2')}>
          원소 기호 맞추기
        </button>
        <button className={`tab-btn ${activeTab === 'CRAFT' ? 'active' : ''}`} onClick={() => setActiveTab('CRAFT')}>
          화합물 조합
        </button>
        <button className={`tab-btn ${activeTab === 'SECRET' ? 'active' : ''}`} onClick={() => setActiveTab('SECRET')}>
          {isSecretUnlocked ? '시크릿 코드 🔓' : '시크릿 코드 🔒'}
        </button>
        <button className={`tab-btn ${activeTab === 'PT' ? 'active' : ''}`} onClick={() => setActiveTab('PT')}>
          주기율표 / 도감
        </button>
        <button className="user-badge-btn" onClick={() => { setTempNickname(nickname); setShowNicknameModal(true); }}>
          👤 {nickname || '별명 설정'} ✏️
        </button>
      </header>

      {showNicknameModal && (
        <div className="nickname-modal-overlay">
          <div className="nickname-modal">
            <div className="nickname-icon">🧪</div>
            <h2>원소 두더지 게임</h2>
            <p>시작하기 전에 학습자 별명을 입력해 주세요!</p>
            <form onSubmit={handleSaveNickname} className="nickname-form">
              <input
                type="text"
                className="nickname-input"
                placeholder="예: 원소마스터, 김과학"
                value={tempNickname}
                onChange={(e) => setTempNickname(e.target.value)}
                maxLength={10}
                autoFocus
              />
              <button type="submit" className="start-btn" style={{ marginTop: '15px', padding: '14px 45px' }}>
                입력 완료 🚀
              </button>
            </form>
          </div>
        </div>
      )}

      {floatingElement && (
        <div className="floating-element" style={{ left: '50%', top: '50%' }} key={floatingElement.id}>
          {floatingElement.sym}
        </div>
      )}

      {(activeTab === 'GAME1' || activeTab === 'GAME2') && (
        <>
          <div className="game-info-bar">
            <div className="stat-box">Score: {score}</div>
            <div className="stat-box">
              Combo: <span className={combo > 2 ? 'combo-text' : ''}>{combo}</span>
            </div>
            <div className="stat-box diff-badge-box" title="현재 난이도 및 두더지 노출 시간">
              {DIFFICULTY_CONFIG[difficulty].icon} {DIFFICULTY_CONFIG[difficulty].timeText}
            </div>
            <div className="stat-box">Time: {timeLeft}s</div>
          </div>

          <div className="main-content">
            {gameState === 'START' && (
              <div className="overlay">
                <h1 className="game-title">
                  {activeTab === 'GAME1' ? '원자 번호를 맞춰라!' : '원소 기호를 맞춰라!'}
                </h1>
                {nickname && <p className="welcome-tag">👋 {nickname}님 환영합니다!</p>}
                <p style={{ fontSize: '1.25rem', marginBottom: '15px', color: '#e2e8f0' }}>
                  {activeTab === 'GAME1' 
                    ? '두더지가 나오면 원소 기호를 보고 원자 번호를 입력하세요!' 
                    : '두더지가 나오면 원자 번호를 보고 원소 기호를 입력하세요!'}
                </p>

                {/* 3-Level Difficulty Selector */}
                <div className="difficulty-picker-box">
                  <div className="difficulty-picker-label">⚙️ 난이도 (두더지 머무는 시간 조절)</div>
                  <div className="difficulty-btn-row">
                    {([1, 2, 3] as DifficultyLevel[]).map(lvl => (
                      <button
                        key={lvl}
                        className={`difficulty-select-btn ${difficulty === lvl ? 'active' : ''} lvl-${lvl}`}
                        onClick={() => handleSelectDifficulty(lvl)}
                      >
                        <span className="diff-icon">{DIFFICULTY_CONFIG[lvl].icon}</span>
                        <span className="diff-name">{DIFFICULTY_CONFIG[lvl].label}</span>
                        <span className="diff-time">{DIFFICULTY_CONFIG[lvl].timeText}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button className="start-btn" style={{ marginTop: '15px' }} onClick={startGame}>
                  게임 시작 🚀
                </button>
              </div>
            )}
            
            {gameState === 'GAME_OVER' && (
              <div className="overlay">
                <h1 className="game-title">Time's Up!</h1>
                <h2>{nickname ? `🎉 ${nickname}님의 최종 점수: ${score}점` : `Final Score: ${score}`}</h2>
                <button className="start-btn" onClick={startGame}>다시 하기</button>
              </div>
            )}

            <div className="game-area">
              <MoleGrid 
                activeMoleIndex={activeMoleIndex} 
                activeElement={activeElement} 
                onMoleClick={() => {}} 
                gameMode={activeTab === 'GAME1' ? 'number' : 'symbol'} 
              />
            </div>

            {gameState === 'PLAYING' && (
              <CustomKeypad 
                mode={activeTab === 'GAME1' ? 'number' : 'alphabet'}
                inputValue={inputValue}
                setInputValue={setInputValue}
                onSubmit={handleInputSubmit}
              />
            )}
          </div>
        </>
      )}

      {activeTab === 'STUDY' && (
        <StudyTab />
      )}

      {activeTab === 'PT' && (
        <PeriodicTable collectedElements={collectedElements} />
      )}

      {activeTab === 'CRAFT' && (
        <CraftingTab collectedElements={collectedElements} />
      )}

      {activeTab === 'SECRET' && (
        isSecretUnlocked ? (
          <SecretCodeTab userNickname={nickname} />
        ) : (
          <div className="secret-lock-container">
            <div className="lock-card">
              <div className="lock-icon">🔒</div>
              <h2 className="lock-title">시크릿 코드가 잠겨있습니다!</h2>
              <p className="lock-desc">
                원자 번호 맞추기와 원소 기호 맞추기를 각각 최소 1회 이상 플레이한 학습자에게만 시크릿 코드가 오픈됩니다.
              </p>
              
              <div className="lock-checklist">
                <div className={`lock-task ${hasPlayedGame1 ? 'completed' : 'pending'}`}>
                  <span className="task-status">{hasPlayedGame1 ? '✅ 달성 완료' : '⏳ 미완료'}</span>
                  <span className="task-name">1. 원자 번호 맞추기 (게임 1) 플레이</span>
                </div>
                <div className={`lock-task ${hasPlayedGame2 ? 'completed' : 'pending'}`}>
                  <span className="task-status">{hasPlayedGame2 ? '✅ 달성 완료' : '⏳ 미완료'}</span>
                  <span className="task-name">2. 원소 기호 맞추기 (게임 2) 플레이</span>
                </div>
              </div>

              <div className="lock-actions">
                {!hasPlayedGame1 && (
                  <button className="start-btn" onClick={() => setActiveTab('GAME1')}>
                    '원자 번호 맞추기' 플레이 하러 가기 🚀
                  </button>
                )}
                {!hasPlayedGame2 && (
                  <button className="start-btn" onClick={() => setActiveTab('GAME2')}>
                    '원소 기호 맞추기' 플레이 하러 가기 💡
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default App;
