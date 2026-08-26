import React from 'react';
import { type ElementData } from '../data/elements';

interface MoleProps {
  element: ElementData | null;
  isActive: boolean;
  onClick: (element: ElementData) => void;
  gameMode: 'number' | 'symbol';
}

const Mole: React.FC<MoleProps> = ({ element, isActive, onClick, gameMode }) => {
  return (
    <div className="mole-hole">
      <div className={`mole ${isActive ? 'active' : ''}`} onClick={() => element && onClick(element)}>
        {element && (
          <div className="mole-content">
            <div className="mole-emoji">{element.emoji}</div>
            <div className="mole-hint">
              {gameMode === 'number' ? element.symbol : element.atomicNumber}
            </div>
            <div className="mole-usage">{element.usage}</div>
          </div>
        )}
      </div>
    </div>
  );
};

interface MoleGridProps {
  activeMoleIndex: number;
  activeElement: ElementData | null;
  onMoleClick: (element: ElementData) => void;
  gameMode: 'number' | 'symbol';
}

const MoleGrid: React.FC<MoleGridProps> = ({ activeMoleIndex, activeElement, onMoleClick, gameMode }) => {
  const numMoles = 6; // 2x3 grid for extra large moles and text

  return (
    <div className="mole-grid">
      {Array.from({ length: numMoles }).map((_, index) => (
        <Mole
          key={index}
          isActive={index === activeMoleIndex}
          element={index === activeMoleIndex ? activeElement : null}
          onClick={onMoleClick}
          gameMode={gameMode}
        />
      ))}
    </div>
  );
};

export default MoleGrid;
