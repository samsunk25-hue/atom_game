import React, { useState } from 'react';
import { useDroppable, useDraggable, DndContext, type DragEndEvent } from '@dnd-kit/core';
import { elements, type ElementData } from '../data/elements';
import { compounds, type CompoundRecipe } from '../data/compounds';
import confetti from 'canvas-confetti';

interface CraftingTabProps {
  collectedElements: number[];
}

const DraggableElement = ({ element }: { element: ElementData }) => {
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
      className="crafting-item"
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
  const [modalReward, setModalReward] = useState<{title: string, emoji: string, name: string} | null>(null);

  const availableElements = elements.filter(e => collectedElements.includes(e.atomicNumber));

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    
    if (over && over.id === 'flask') {
      const symbol = active.id as string;
      setFlaskContents(prev => ({
        ...prev,
        [symbol]: (prev[symbol] || 0) + 1
      }));
    }
  };

  const clearFlask = () => {
    setFlaskContents({});
  };

  const tryCombine = () => {
    let matchedRecipe: CompoundRecipe | null = null;

    for (const recipe of compounds) {
      // Check if flask contents exactly match the recipe
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
      setModalReward({ title: matchedRecipe.title, emoji: matchedRecipe.emoji, name: matchedRecipe.name });
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
      alert('앗! 조합에 실패했어요. 화합물 레시피를 다시 생각해보세요!');
    }
  };

  const { setNodeRef: setFlaskRef, isOver } = useDroppable({
    id: 'flask',
  });

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="crafting-container">
        <h2 className="game-title">도전! 화합물 조합</h2>
        <p className="subtitle">수집한 원소를 플라스크로 드래그하여 분자를 만들어보세요!</p>
        
        <div className="crafting-layout">
          <div className="inventory-panel">
            <h3>나의 인벤토리 (수집한 원소)</h3>
            <div className="inventory-grid">
              {availableElements.map(el => (
                <DraggableElement key={el.atomicNumber} element={el} />
              ))}
              {availableElements.length === 0 && (
                <p style={{ color: '#888' }}>수집한 원소가 없습니다. 게임을 플레이하여 원소를 수집하세요!</p>
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
                  <div key={sym} className="flask-item">
                    {sym} <span className="item-count">x{count}</span>
                  </div>
                ))}
                {Object.keys(flaskContents).length === 0 && (
                  <p style={{ color: '#aaa' }}>원소를 이곳으로 드래그 앤 드롭 하세요</p>
                )}
              </div>
            </div>
            <div className="crafting-actions">
              <button className="action-btn combine-btn" onClick={tryCombine}>조합하기!</button>
              <button className="action-btn clear-btn" onClick={clearFlask}>비우기</button>
            </div>
          </div>
        </div>

        <div className="recipe-book">
          <h3>화합물 도감</h3>
          <div className="recipe-grid">
            {compounds.map(comp => (
              <div key={comp.id} className={`recipe-card ${unlockedCompounds.includes(comp.id) ? 'unlocked' : ''}`}>
                <div className="recipe-emoji">{unlockedCompounds.includes(comp.id) ? comp.emoji : '❓'}</div>
                <div className="recipe-info">
                  <div className="recipe-formula">{unlockedCompounds.includes(comp.id) ? comp.formula : '???'}</div>
                  <div className="recipe-name">{unlockedCompounds.includes(comp.id) ? comp.name : '미발견'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {modalReward && (
          <div className="reward-modal-overlay" onClick={() => setModalReward(null)}>
            <div className="reward-modal" onClick={e => e.stopPropagation()}>
              <h2>🎉 조합 성공! 🎉</h2>
              <div className="reward-emoji">{modalReward.emoji}</div>
              <h3>{modalReward.name} 완성!</h3>
              <div className="reward-title">칭호 획득: {modalReward.title}</div>
              <button className="action-btn combine-btn" style={{ marginTop: '20px' }} onClick={() => setModalReward(null)}>확인</button>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
};

export default CraftingTab;
