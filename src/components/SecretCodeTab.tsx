import React, { useState } from 'react';
import { secretCodes } from '../data/secretCodes';
import CustomKeypad from './CustomKeypad';
import confetti from 'canvas-confetti';

const SecretCodeTab: React.FC = () => {
  const [currentMissionIndex, setCurrentMissionIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [clearedMissions, setClearedMissions] = useState<string[]>(() => {
    const saved = localStorage.getItem('clearedMissions');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const mission = secretCodes[currentMissionIndex];
  const isCleared = clearedMissions.includes(mission.id);

  const handleInputSubmit = () => {
    if (inputValue.toUpperCase() === mission.answer.toUpperCase()) {
      // Success
      if (!isCleared) {
        const newCleared = [...clearedMissions, mission.id];
        setClearedMissions(newCleared);
        localStorage.setItem('clearedMissions', JSON.stringify(newCleared));
      }
      
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      
      const heart = document.createElement('div');
      heart.className = 'big-heart-container';
      heart.innerHTML = '<div class="big-heart">❤️</div>';
      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 1500);

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setInputValue('');
        if (currentMissionIndex < secretCodes.length - 1) {
          setCurrentMissionIndex(currentMissionIndex + 1);
        }
      }, 2500);
    } else {
      // Wrong
      alert('비밀번호가 틀렸습니다!');
      setInputValue('');
    }
  };

  return (
    <div className="secret-code-container">
      <h2 className="game-title">시크릿 코드 해독</h2>
      <p className="subtitle">주어진 힌트를 보고 원자 번호를 조합하거나 단어를 만들어 자물쇠를 푸세요!</p>

      <div className="mission-card">
        <h3>미션 {currentMissionIndex + 1} / {secretCodes.length}</h3>
        <div className="mission-question">
          {mission.question}
        </div>
        
        {isCleared && <div className="cleared-badge">CLEAR!</div>}
      </div>

      <div className="mission-progress">
        {secretCodes.map((m, idx) => (
          <div 
            key={m.id} 
            className={`progress-dot ${clearedMissions.includes(m.id) ? 'cleared' : ''} ${idx === currentMissionIndex ? 'active' : ''}`}
            onClick={() => {
              setCurrentMissionIndex(idx);
              setInputValue('');
            }}
          />
        ))}
      </div>

      {!showSuccess && (
        <div className="secret-keypad-wrapper">
          <CustomKeypad
            mode={mission.type === 'word' ? 'alphabet' : 'number'}
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSubmit={handleInputSubmit}
          />
        </div>
      )}

      {showSuccess && (
        <div className="success-overlay">
          <h2>정답!</h2>
          <p>{mission.rewardText}</p>
        </div>
      )}
    </div>
  );
};

export default SecretCodeTab;
