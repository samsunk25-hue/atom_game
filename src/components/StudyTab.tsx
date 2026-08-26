import React, { useState } from 'react';
import { elements } from '../data/elements';

const StudyTab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'card' | 'song' | 'compound' | 'flashcard'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'essential' | 'common'>('all');

  // Flashcard states
  const [flashIndex, setFlashIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);

  const essentialElements = elements.filter(e => !e.isCommon);
  const commonElements = elements.filter(e => e.isCommon);

  const filteredElements = elements.filter(el => {
    const matchesSearch = 
      el.name.includes(searchTerm) || 
      el.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
      String(el.atomicNumber).includes(searchTerm) ||
      el.usage.includes(searchTerm);

    if (filterType === 'essential') return matchesSearch && !el.isCommon;
    if (filterType === 'common') return matchesSearch && el.isCommon;
    return matchesSearch;
  });

  const flashElement = elements[flashIndex];

  const handleNextFlashcard = (known: boolean) => {
    if (known) setKnownCount(prev => prev + 1);
    setIsFlipped(false);
    setFlashIndex(prev => (prev + 1) % elements.length);
  };

  return (
    <div className="study-container">
      <h2 className="game-title">📚 사전 학습: 원소 & 화학 기초 공부방</h2>
      <p className="subtitle">
        게임을 시작하기 전에 원자 번호와 원소 기호, 실생활 쓰임새를 재미있게 예습해 보세요!
      </p>

      {/* Sub navigation bar */}
      <div className="study-nav-bar">
        <button 
          className={`study-nav-btn ${activeSection === 'card' ? 'active' : ''}`}
          onClick={() => setActiveSection('card')}
        >
          📖 원소 탐구 카드
        </button>
        <button 
          className={`study-nav-btn ${activeSection === 'song' ? 'active' : ''}`}
          onClick={() => setActiveSection('song')}
        >
          🎵 1~20번 암기 꿀팁송
        </button>
        <button 
          className={`study-nav-btn ${activeSection === 'compound' ? 'active' : ''}`}
          onClick={() => setActiveSection('compound')}
        >
          🧪 홑원소 vs 화합물
        </button>
        <button 
          className={`study-nav-btn ${activeSection === 'flashcard' ? 'active' : ''}`}
          onClick={() => setActiveSection('flashcard')}
        >
          🎴 플래시카드 자가진단
        </button>
      </div>

      {/* Section 1: Element Explorer Cards */}
      {activeSection === 'card' && (
        <div className="study-card-section">
          <div className="study-filter-bar">
            <input 
              type="text" 
              className="study-search-input"
              placeholder="🔍 원소 이름, 기호, 번호, 쓰임새 검색 (예: 산소, Fe, 8, 배터리)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="study-filter-chips">
              <button 
                className={`chip-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                전체보기 ({elements.length})
              </button>
              <button 
                className={`chip-btn ${filterType === 'essential' ? 'active' : ''}`}
                onClick={() => setFilterType('essential')}
              >
                1~20번 필수 원소 ({essentialElements.length})
              </button>
              <button 
                className={`chip-btn ${filterType === 'common' ? 'active' : ''}`}
                onClick={() => setFilterType('common')}
              >
                생활 속 주요 금속 ({commonElements.length})
              </button>
            </div>
          </div>

          <div className="study-grid">
            {filteredElements.map(el => (
              <div key={el.atomicNumber} className="study-element-card">
                <div className="study-card-header">
                  <span className="study-atom-num">{el.atomicNumber}번</span>
                  <span className="study-card-badge">{el.isCommon ? '생활 금속' : '필수 1~20번'}</span>
                </div>
                <div className="study-card-symbol">{el.symbol}</div>
                <div className="study-card-name">{el.name}</div>
                <div className="study-card-usage">
                  <span className="study-emoji">{el.emoji}</span>
                  <span className="study-usage-text">{el.usage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Periodic Table Mnemonic Song */}
      {activeSection === 'song' && (
        <div className="study-song-section">
          <div className="song-card">
            <div className="song-header">
              <span className="song-icon">🎤</span>
              <h3>중학교 필수 1~20번 주기율표 암기 랩</h3>
            </div>
            <p className="song-desc">
              입으로 소리 내어 3번만 리듬에 맞춰 읽어보세요! 원자 번호와 기호가 머릿속에 쏙쏙 들어옵니다.
            </p>

            <div className="rhyme-box">
              <div className="rhyme-line highlight">
                <span className="rhyme-main">"수 헬 리 베 / 붕 탄 질 산 / 플 네"</span>
                <span className="rhyme-sub">1번(H) ~ 10번(Ne) : 1~2주기 원소</span>
              </div>
              <div className="rhyme-line highlight">
                <span className="rhyme-main">"나 마 알 규 / 인 황 염 아 / 칼 칼"</span>
                <span className="rhyme-sub">11번(Na) ~ 20번(Ca) : 3~4주기 원소</span>
              </div>
            </div>

            <div className="period-breakdown">
              <div className="period-row">
                <span className="period-tag">1주기 (2개)</span>
                <span className="period-items"><strong>1. H (수소)</strong>, <strong>2. He (헬륨)</strong></span>
              </div>
              <div className="period-row">
                <span className="period-tag">2주기 (8개)</span>
                <span className="period-items">
                  <strong>3. Li (리튬)</strong>, <strong>4. Be (베릴륨)</strong>, <strong>5. B (붕소)</strong>, <strong>6. C (탄소)</strong>, 
                  <strong>7. N (질소)</strong>, <strong>8. O (산소)</strong>, <strong>9. F (플루오린)</strong>, <strong>10. Ne (네온)</strong>
                </span>
              </div>
              <div className="period-row">
                <span className="period-tag">3주기 (8개)</span>
                <span className="period-items">
                  <strong>11. Na (나트륨)</strong>, <strong>12. Mg (마그네슘)</strong>, <strong>13. Al (알루미늄)</strong>, <strong>14. Si (규소)</strong>, 
                  <strong>15. P (인)</strong>, <strong>16. S (황)</strong>, <strong>17. Cl (염소)</strong>, <strong>18. Ar (아르곤)</strong>
                </span>
              </div>
              <div className="period-row">
                <span className="period-tag">4주기 (2개)</span>
                <span className="period-items"><strong>19. K (칼륨)</strong>, <strong>20. Ca (칼슘)</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Compound Basics Guide */}
      {activeSection === 'compound' && (
        <div className="study-compound-section">
          <div className="concept-grid">
            <div className="concept-card homo-card">
              <div className="concept-icon">🚀</div>
              <h3>1. 홑원소 물질 (원소)</h3>
              <p className="concept-summary"><strong>한 종류의 원소</strong>로만 이루어진 순수한 물질</p>
              <ul className="concept-list">
                <li><strong>H₂ (수소 기체)</strong> : 수소(H) 2개가 결합</li>
                <li><strong>O₂ (산소 기체)</strong> : 산소(O) 2개가 결합</li>
                <li><strong>O₃ (오존)</strong> : 산소(O) 3개가 결합</li>
                <li><strong>He, Ne, Ar</strong> : 1원자 분자 (비활성 기체)</li>
                <li><strong>Fe, Cu, Au, Ag</strong> : 순수한 금속 홑원소</li>
              </ul>
            </div>

            <div className="concept-card comp-card">
              <div className="concept-icon">🧪</div>
              <h3>2. 화합물 (Compound)</h3>
              <p className="concept-summary"><strong>두 종류 이상의 서로 다른 원소</strong>가 화학적으로 결합한 물질</p>
              <ul className="concept-list">
                <li><strong>H₂O (물)</strong> : 수소(H) 2개 + 산소(O) 1개</li>
                <li><strong>NaCl (소금/염화나트륨)</strong> : 나트륨(Na) 1개 + 염소(Cl) 1개</li>
                <li><strong>CO₂ (이산화탄소)</strong> : 탄소(C) 1개 + 산소(O) 2개</li>
                <li><strong>CH₄ (메테인)</strong> : 탄소(C) 1개 + 수소(H) 4개</li>
                <li><strong>NH₃ (암모니아)</strong> : 질소(N) 1개 + 수소(H) 3개</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Flashcard Self-Quiz */}
      {activeSection === 'flashcard' && (
        <div className="study-flashcard-section">
          <div className="flashcard-status">
            <span>카드 {flashIndex + 1} / {elements.length}</span>
            <span className="flashcard-score">알고 있는 원소: {knownCount}개</span>
          </div>

          <div 
            className={`flashcard-box ${isFlipped ? 'flipped' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className="flashcard-inner">
              {/* Front side */}
              <div className="flashcard-front">
                <span className="flash-hint-tag">💡 카드를 터치/클릭하면 정답이 열립니다!</span>
                <div className="flash-big-symbol">{flashElement.symbol}</div>
                <div className="flash-name">{flashElement.name}</div>
                <span className="flash-instruction">이 원소의 원자 번호와 쓰임새는? 🤔</span>
              </div>

              {/* Back side */}
              <div className="flashcard-back">
                <div className="flash-back-number">원자 번호: {flashElement.atomicNumber}번</div>
                <div className="flash-back-emoji">{flashElement.emoji}</div>
                <div className="flash-back-usage">실생활 쓰임새: {flashElement.usage}</div>
                <div className="flash-back-symbol">기호: {flashElement.symbol} ({flashElement.name})</div>
              </div>
            </div>
          </div>

          <div className="flashcard-actions">
            <button className="flash-btn known-btn" onClick={() => handleNextFlashcard(true)}>
              ✅ 잘 알고 있어요!
            </button>
            <button className="flash-btn retry-btn" onClick={() => handleNextFlashcard(false)}>
              🔁 다시 볼게요!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyTab;
