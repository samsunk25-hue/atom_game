import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { elements, type ElementData } from './data/elements';
import CustomKeypad from './components/CustomKeypad';
import MoleGrid from './components/MoleGrid';
import PeriodicTable from './components/PeriodicTable';
import CraftingTab from './components/CraftingTab';
import SecretCodeTab from './components/SecretCodeTab';
import confetti from 'canvas-confetti';

type GameState = 'START' | 'PLAYING' | 'GAME_OVER';
type TabState = 'GAME1' | 'GAME2' | 'PT' | 'CRAFT' | 'SECRET';

function App() {
  const [activeTab, setActiveTab] = useState<TabState>('GAME1');
  const [gameState, setGameState] = useState<GameState>('START');
  
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

  const [hasPlayedGame1, setHasPlayedGame1] = useState<boolean>(() => {
    return localStorage.getItem('hasPlayedGame1') === 'true';
  });
  const [hasPlayedGame2, setHasPlayedGame2] = useState<boolean>(() => {
    return localStorage.getItem('hasPlayedGame2') === 'true';
  });

  const isSecretUnlocked = hasPlayedGame1 && hasPlayedGame2;

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

    // Dynamic speed based on combo
    const baseSpeed = 3000;
    const speedReduction = combo * 100;
    const moleTime = Math.max(1200, baseSpeed - speedReduction);

    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
    moleTimerRef.current = setTimeout(() => {
      // Missed the mole
      setCombo(0);
      setInputValue('');
      setActiveMoleIndex(-1);
      setTimeout(spawnMole, 500);
    }, moleTime) as unknown as number;
  }, [activeTab, collectedElements, combo]);

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
      </header>

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
            <div className="stat-box">Time: {timeLeft}s</div>
          </div>

          <div className="main-content">
            {gameState === 'START' && (
              <div className="overlay">
                <h1 className="game-title">
                  {activeTab === 'GAME1' ? '원자 번호를 맞춰라!' : '원소 기호를 맞춰라!'}
                </h1>
                <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
                  {activeTab === 'GAME1' 
                    ? '두더지가 나오면 원소 기호를 보고 원자 번호를 입력하세요!' 
                    : '두더지가 나오면 원자 번호를 보고 원소 기호를 입력하세요!'}
                </p>
                <button className="start-btn" onClick={startGame}>게임 시작</button>
              </div>
            )}
            
            {gameState === 'GAME_OVER' && (
              <div className="overlay">
                <h1 className="game-title">Time's Up!</h1>
                <h2>Final Score: {score}</h2>
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

      {activeTab === 'PT' && (
        <PeriodicTable collectedElements={collectedElements} />
      )}

      {activeTab === 'CRAFT' && (
        <CraftingTab collectedElements={collectedElements} />
      )}

      {activeTab === 'SECRET' && (
        isSecretUnlocked ? (
          <SecretCodeTab />
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
