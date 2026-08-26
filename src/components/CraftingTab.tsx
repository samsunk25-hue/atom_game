import React, { useState } from 'react';
import { useDroppable, useDraggable, DndContext, type DragEndEvent } from '@dnd-kit/core';
import { elements, type ElementData } from '../data/elements';
import { compounds, type CompoundRecipe } from '../data/compounds';
import confetti from 'canvas-confetti';

interface CraftingTabProps {
  collectedElements: number[];
}

const DraggableElement = ({ 
  element, 
  onClick 
}: { 
  element: ElementData; 
  onClick: (sym: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: element.symbol,
    data: element,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      onClick={() => onClick(element.symbol)}
      className="crafting-item"
      title={`${element.name} (${element.symbol}) - 클릭하거나 드래그하여 플라스크에 추가`}
    >
      {element.symbol}
    </div>
  );
};

const CraftingTab: React.FC<CraftingTabProps> = ({ collectedElements }) => {
  const [flaskContents, setFlaskContents] = useState<Record<string, number>>({});
  const [unlockedCompounds, setUnlockedCompounds] = useState<string[]>(() => {
    const saved = localStorage.getItem('unlockedCompounds');
    return saved ? JSON.parse(saved) : [];
  });
  const [modalReward, setModalReward] = useState<{title: string, emoji: string, name: string, formula: string} | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'homo' | 'compound'>('all');

  const availableElements = elements.filter(e => collectedElements.includes(e.atomicNumber));

  const handleAddElement = (symbol: string) => {
    setFlaskContents(prev => ({
      ...prev,
      [symbol]: (prev[symbol] || 0) + 1
    }));
  };

  const handleIncrement = (symbol: string) => {
    setFlaskContents(prev => ({
      ...prev,
      [symbol]: (prev[symbol] || 0) + 1
    }));
  };

  const handleDecrement = (symbol: string) => {
    setFlaskContents(prev => {
      const current = prev[symbol] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[symbol];
        return next;
      }
      return { ...prev, [symbol]: current - 1 };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    if (over && over.id === 'flask') {
      const symbol = active.id as string;
      handleAddElement(symbol);
    }
  };

  const clearFlask = () => {
    setFlaskContents({});
  };

  const tryCombine = () => {
    let matchedRecipe: CompoundRecipe | null = null;

    for (const recipe of compounds) {
      const recipeSymbols = Object.keys(recipe.ingredients);
      const flaskSymbols = Object.keys(flaskContents);
      
      if (recipeSymbols.length !== flaskSymbols.length) continue;
      
      let isMatch = true;
      for (const sym of recipeSymbols) {
        if (recipe.ingredients[sym] !== flaskContents[sym]) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        matchedRecipe = recipe;
        break;
      }
    }

    if (matchedRecipe) {
      setModalReward({ 
        title: matchedRecipe.title, 
        emoji: matchedRecipe.emoji, 
        name: matchedRecipe.name,
        formula: matchedRecipe.formula
      });
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      
      const heart = document.createElement('div');
      heart.className = 'big-heart-container';
      heart.innerHTML = '<div class="big-heart">❤️</div>';
      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 1500);
      
      if (!unlockedCompounds.includes(matchedRecipe.id)) {
        const newUnlocked = [...unlockedCompounds, matchedRecipe.id];
        setUnlockedCompounds(newUnlocked);
        localStorage.setItem('unlockedCompounds', JSON.stringify(newUnlocked));
      }
      clearFlask();
    } else {
      alert('앗! 조합에 맞는 물질이 없습니다. 도감의 레시피를 확인해 보세요!\n(예: H 2개 ➡️ H₂ 수소 기체, H 2개 + O 1개 ➡️ H₂O 물)');
    }
  };

  const { setNodeRef: setFlaskRef, isOver } = useDroppable({
    id: 'flask',
  });

  const filteredRecipes = compounds.filter(c => {
    if (categoryFilter === 'all') return true;
    return c.category === categoryFilter;
  });

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="crafting-container">
        <h2 className="game-title">도전! 홑원소 물질 & 화합물 조합</h2>
        <p className="subtitle">
          수집한 원소를 <strong>클릭</strong>하거나 <strong>드래그</strong>하여 플라스크에 넣고, 다양한 물질을 합성해 보세요!
        </p>
        
        <div className="crafting-layout">
          <div className="inventory-panel">
            <div className="panel-title-bar">
              <h3>나의 인벤토리 (수집한 원소)</h3>
              <span className="inv-hint">💡 원소를 클릭하면 플라스크에 추가됩니다 (여러 개 추가 가능)</span>
            </div>
            
            <div className="inventory-grid">
              {availableElements.map(el => (
                <DraggableElement key={el.atomicNumber} element={el} onClick={handleAddElement} />
              ))}
              {availableElements.length === 0 && (
                <p style={{ color: '#94a3b8', fontSize: '1.2rem', padding: '20px' }}>
                  아직 수집한 원소가 없습니다. '원자 번호 맞추기'나 '원소 기호 맞추기' 게임을 플레이하여 원소를 모아보세요!
                </p>
              )}
            </div>
          </div>

          <div className="flask-panel">
            <div 
              ref={setFlaskRef} 
              className={`flask-dropzone ${isOver ? 'flask-over' : ''}`}
            >
              <h3>플라스크 🧪</h3>
              <div className="flask-contents">
                {Object.entries(flaskContents).map(([sym, count]) => (
                  <div key={sym} className="flask-item-advanced">
                    <button className="qty-btn minus" onClick={() => handleDecrement(sym)}>-</button>
                    <span className="flask-sym">{sym}</span>
                    <span className="item-count">x{count}</span>
                    <button className="qty-btn plus" onClick={() => handleIncrement(sym)}>+</button>
                  </div>
                ))}
                {Object.keys(flaskContents).length === 0 && (
                  <p style={{ color: '#cbd5e1', fontSize: '1.2rem', padding: '30px 10px' }}>
                    원소를 <strong>클릭</strong>하거나 이곳으로 <strong>드래그</strong>하여 추가하세요!
                  </p>
                )}
              </div>
            </div>

            <div className="crafting-actions">
              <button className="action-btn combine-btn" onClick={tryCombine}>
                조합하기! ✨
              </button>
              <button className="action-btn clear-btn" onClick={clearFlask}>
                비우기 🗑️
              </button>
            </div>
          </div>
        </div>

        {/* Recipe Book */}
        <div className="recipe-book">
          <div className="recipe-header-row">
            <h3>도감 & 조합 레시피 (발견: {unlockedCompounds.length} / {compounds.length})</h3>
            <div className="recipe-filters">
              <button 
                className={`filter-btn ${categoryFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('all')}
              >
                전체보기
              </button>
              <button 
                className={`filter-btn ${categoryFilter === 'homo' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('homo')}
              >
                홑원소 물질 (H₂, O₂, He 등)
              </button>
              <button 
                className={`filter-btn ${categoryFilter === 'compound' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('compound')}
              >
                화합물 (H₂O, NaCl 등)
              </button>
            </div>
          </div>

          <div className="recipe-grid">
            {filteredRecipes.map(comp => {
              const isUnlocked = unlockedCompounds.includes(comp.id);
              const recipeText = Object.entries(comp.ingredients)
                .map(([s, n]) => `${s} × ${n}`)
                .join(' + ');

              return (
                <div key={comp.id} className={`recipe-card ${isUnlocked ? 'unlocked' : ''}`}>
                  <div className="recipe-emoji">{isUnlocked ? comp.emoji : '❓'}</div>
                  <div className="recipe-info">
                    <div className="recipe-formula">{isUnlocked ? comp.formula : '???'}</div>
                    <div className="recipe-name">{isUnlocked ? comp.name : '미발견 물질'}</div>
                    <div className="recipe-ingredients">레시피: {recipeText}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reward Modal */}
        {modalReward && (
          <div className="reward-modal-overlay" onClick={() => setModalReward(null)}>
            <div className="reward-modal" onClick={e => e.stopPropagation()}>
              <h2>🎉 합성 성공! 🎉</h2>
              <div className="reward-emoji">{modalReward.emoji}</div>
              <h3 style={{ fontSize: '2.4rem', color: '#38bdf8' }}>{modalReward.formula} ({modalReward.name})</h3>
              <div className="reward-title">획득 칭호: 👑 {modalReward.title}</div>
              <button className="action-btn combine-btn" style={{ marginTop: '25px', padding: '14px 45px' }} onClick={() => setModalReward(null)}>
                확인
              </button>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
};

export default CraftingTab;
