import React from 'react';
import { elements } from '../data/elements';

interface PeriodicTableProps {
  collectedElements: number[]; // Array of atomic numbers
}

const PeriodicTable: React.FC<PeriodicTableProps> = ({ collectedElements }) => {
  // Elements 1-20
  const ptElements = elements.filter(e => !e.isCommon);
  const commonElements = elements.filter(e => e.isCommon);

  const getElementByNum = (num: number) => ptElements.find(e => e.atomicNumber === num);

  // Simplified periodic table grid map (Group 1-18)
  const gridPositions: Record<number, { row: number, col: number }> = {
    1: { row: 1, col: 1 }, 2: { row: 1, col: 18 },
    3: { row: 2, col: 1 }, 4: { row: 2, col: 2 }, 5: { row: 2, col: 13 }, 6: { row: 2, col: 14 }, 7: { row: 2, col: 15 }, 8: { row: 2, col: 16 }, 9: { row: 2, col: 17 }, 10: { row: 2, col: 18 },
    11: { row: 3, col: 1 }, 12: { row: 3, col: 2 }, 13: { row: 3, col: 13 }, 14: { row: 3, col: 14 }, 15: { row: 3, col: 15 }, 16: { row: 3, col: 16 }, 17: { row: 3, col: 17 }, 18: { row: 3, col: 18 },
    19: { row: 4, col: 1 }, 20: { row: 4, col: 2 }
  };

  const renderCell = (row: number, col: number) => {
    const num = Object.keys(gridPositions).find(k => gridPositions[parseInt(k)].row === row && gridPositions[parseInt(k)].col === col);
    if (!num) return <div key={`${row}-${col}`} style={{ gridRow: row, gridColumn: col }} />;
    
    const element = getElementByNum(parseInt(num));
    if (!element) return null;

    const isCollected = collectedElements.includes(element.atomicNumber);

    return (
      <div 
        key={num} 
        className={`pt-cell ${isCollected ? 'collected' : ''}`}
        style={{ gridRow: row, gridColumn: col }}
      >
        <span className="sym">{isCollected ? element.symbol : '?'}</span>
        <span>{element.atomicNumber}</span>
      </div>
    );
  };

  const cells = [];
  for (let r = 1; r <= 4; r++) {
    for (let c = 1; c <= 18; c++) {
      cells.push(renderCell(r, c));
    }
  }

  return (
    <div className="pt-container">
      <h2 className="game-title">나만의 주기율표</h2>
      <div className="pt-grid">
        {cells}
      </div>

      <div className="common-elements">
        <h3>자주 쓰이는 원소 도감</h3>
        <div className="common-grid">
          {commonElements.map(element => {
            const isCollected = collectedElements.includes(element.atomicNumber);
            return (
              <div key={element.atomicNumber} className={`common-item ${isCollected ? 'collected' : ''}`}>
                <span style={{ fontSize: '1.5rem' }}>{element.emoji}</span>
                <span className="sym">{isCollected ? element.symbol : '?'}</span>
                <span>({element.atomicNumber})</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PeriodicTable;
