import React, { useState, useEffect } from 'react';
import { defaultSecretCodes, type SecretCodeMission } from '../data/secretCodes';
import CustomKeypad from './CustomKeypad';
import confetti from 'canvas-confetti';

interface SecretCodeTabProps {
  userNickname?: string;
}

const SecretCodeTab: React.FC<SecretCodeTabProps> = ({ userNickname = '학습자' }) => {
  const [missions, setMissions] = useState<SecretCodeMission[]>(() => {
    const savedCustom = localStorage.getItem('customSecretCodes');
    const customList: SecretCodeMission[] = savedCustom ? JSON.parse(savedCustom) : [];
    return [...defaultSecretCodes, ...customList];
  });

  const [currentMissionIndex, setCurrentMissionIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [clearedMissions, setClearedMissions] = useState<string[]>(() => {
    const saved = localStorage.getItem('clearedMissions');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareNotification, setShowShareNotification] = useState(false);

  // Form states for creating new problem
  const [newType, setNewType] = useState<'word' | 'math'>('word');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newReward, setNewReward] = useState('');

  // Check URL params for shared quiz on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedQuizData = params.get('quiz');
    if (sharedQuizData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(sharedQuizData))));
        if (decoded && decoded.question && decoded.answer) {
          const importedMission: SecretCodeMission = {
            id: 'shared_' + Date.now(),
            type: decoded.type || 'word',
            question: decoded.question,
            answer: decoded.answer.toUpperCase(),
            rewardText: decoded.rewardText || '친구의 퀴즈를 해결했습니다! 🎉',
            author: decoded.author || '친구',
            isCustom: true
          };

          setMissions(prev => {
            const exists = prev.some(m => m.question === importedMission.question && m.answer === importedMission.answer);
            if (!exists) {
              const updated = [importedMission, ...prev];
              localStorage.setItem('customSecretCodes', JSON.stringify(updated.filter(m => m.isCustom)));
              return updated;
            }
            return prev;
          });

          setShowShareNotification(true);
          setTimeout(() => setShowShareNotification(false), 4000);
          
          // Clear query param without refresh
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        console.error('Failed to parse shared quiz', err);
      }
    }
  }, []);

  const mission = missions[currentMissionIndex] || missions[0];
  const isCleared = clearedMissions.includes(mission.id);

  const handleInputSubmit = () => {
    if (inputValue.toUpperCase() === mission.answer.toUpperCase()) {
      // Success
      if (!isCleared) {
        const newCleared = [...clearedMissions, mission.id];
        setClearedMissions(newCleared);
        localStorage.setItem('clearedMissions', JSON.stringify(newCleared));
      }
      
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
      
      const heart = document.createElement('div');
      heart.className = 'big-heart-container';
      heart.innerHTML = '<div class="big-heart">❤️</div>';
      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 1500);

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setInputValue('');
        if (currentMissionIndex < missions.length - 1) {
          setCurrentMissionIndex(currentMissionIndex + 1);
        }
      }, 2500);
    } else {
      // Wrong
      alert('비밀번호가 틀렸습니다! 다시 시도해 보세요.');
      setInputValue('');
    }
  };

  const handleRandomPick = () => {
    const randomIndex = Math.floor(Math.random() * missions.length);
    setCurrentMissionIndex(randomIndex);
    setInputValue('');
  };

  const handleCreateMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) {
      alert('문제와 정답을 모두 입력해 주세요!');
      return;
    }

    const created: SecretCodeMission = {
      id: 'custom_' + Date.now(),
      type: newType,
      question: newQuestion.trim(),
      answer: newAnswer.trim().toUpperCase(),
      rewardText: newReward.trim() || `${userNickname}님이 출제한 미션 성공! 🎉`,
      author: userNickname || '익명 출제자',
      isCustom: true
    };

    const updatedMissions = [...missions, created];
    setMissions(updatedMissions);

    const customOnly = updatedMissions.filter(m => m.isCustom);
    localStorage.setItem('customSecretCodes', JSON.stringify(customOnly));

    setShowCreateModal(false);
    setNewQuestion('');
    setNewAnswer('');
    setNewReward('');
    setCurrentMissionIndex(updatedMissions.length - 1);
    alert('새로운 시크릿 코드가 성공적으로 등록되었습니다!');
  };

  const handleShareQuiz = (targetMission: SecretCodeMission) => {
    try {
      const payload = {
        type: targetMission.type,
        question: targetMission.question,
        answer: targetMission.answer,
        rewardText: targetMission.rewardText,
        author: targetMission.author || userNickname
      };
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const shareUrl = `${window.location.origin}${window.location.pathname}?quiz=${encoded}`;
      
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('📋 문제 공유 링크가 클립보드에 복사되었습니다!\n친구들에게 전달하면 친구 화면에도 이 문제가 바로 나타납니다.');
      });
    } catch {
      alert('링크 복사에 실패했습니다.');
    }
  };

  const handleDeleteCustom = (missionId: string) => {
    if (confirm('이 문제를 삭제하시겠습니까?')) {
      const filtered = missions.filter(m => m.id !== missionId);
      setMissions(filtered);
      localStorage.setItem('customSecretCodes', JSON.stringify(filtered.filter(m => m.isCustom)));
      if (currentMissionIndex >= filtered.length) {
        setCurrentMissionIndex(Math.max(0, filtered.length - 1));
      }
    }
  };

  return (
    <div className="secret-code-container">
      <h2 className="game-title">시크릿 코드 해독</h2>
      <p className="subtitle">원자 번호 암호를 풀어 영단어와 수학 자물쇠를 해독하세요!</p>

      {showShareNotification && (
        <div className="share-alert-banner">
          🎉 친구가 출제한 새로운 시크릿 코드가 도착하여 추가되었습니다!
        </div>
      )}

      <div className="secret-control-bar">
        <button className="control-sub-btn random-btn" onClick={handleRandomPick}>
          🎲 랜덤 문제 뽑기
        </button>
        <button className="control-sub-btn create-btn" onClick={() => setShowCreateModal(true)}>
          ✍️ 내가 직접 문제 만들기
        </button>
        <button className="control-sub-btn share-btn" onClick={() => handleShareQuiz(mission)}>
          🔗 현재 문제 공유 링크 복사
        </button>
      </div>

      <div className="mission-card">
        <div className="mission-meta-info">
          <span className="mission-number">미션 {currentMissionIndex + 1} / {missions.length}</span>
          <span className="mission-author-tag">
            {mission.author ? `출제자: ${mission.author}` : '시스템'}
          </span>
          {mission.isCustom && (
            <button className="del-quiz-btn" onClick={() => handleDeleteCustom(mission.id)}>
              삭제
            </button>
          )}
        </div>

        <div className="mission-question">
          {mission.question}
        </div>
        
        {isCleared && <div className="cleared-badge">CLEAR!</div>}
      </div>

      <div className="mission-progress">
        {missions.map((m, idx) => (
          <div 
            key={m.id} 
            title={m.question}
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
          <h2>🎉 정답! 🎉</h2>
          <p>{mission.rewardText}</p>
        </div>
      )}

      {/* Create Mission Modal */}
      {showCreateModal && (
        <div className="reward-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-mission-modal" onClick={e => e.stopPropagation()}>
            <h2>✍️ 나만의 시크릿 코드 출제하기</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '20px', fontSize: '1.2rem' }}>
              다른 친구들이 풀 수 있는 멋진 원소 암호 문제를 만들어 보세요!
            </p>

            <form onSubmit={handleCreateMission} className="create-mission-form">
              <div className="form-group">
                <label>문제 유형:</label>
                <div className="radio-group">
                  <label className={`radio-label ${newType === 'word' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="qtype" 
                      checked={newType === 'word'} 
                      onChange={() => setNewType('word')} 
                    />
                    🔤 영단어 맞추기 (알파벳 키패드)
                  </label>
                  <label className={`radio-label ${newType === 'math' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="qtype" 
                      checked={newType === 'math'} 
                      onChange={() => setNewType('math')} 
                    />
                    🔢 숫자/연산 퀴즈 (숫자 키패드)
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>문제 내용 (힌트):</label>
                <input
                  type="text"
                  className="modal-text-input"
                  placeholder={newType === 'word' ? '예: 6(C) + 8(O) + 19(K)' : '예: 산소(O) + 탄소(C) = ?'}
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>정답:</label>
                <input
                  type="text"
                  className="modal-text-input"
                  placeholder={newType === 'word' ? '예: COOK (대소문자 무관)' : '예: 14'}
                  value={newAnswer}
                  onChange={e => setNewAnswer(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>정답 시 칭찬 메시지 (선택):</label>
                <input
                  type="text"
                  className="modal-text-input"
                  placeholder="예: 요리사 모자 획득! 👨‍🍳"
                  value={newReward}
                  onChange={e => setNewReward(e.target.value)}
                />
              </div>

              <div className="modal-btn-row">
                <button type="submit" className="action-btn combine-btn" style={{ fontSize: '1.25rem' }}>
                  문제 등록 완료 ✨
                </button>
                <button type="button" className="action-btn clear-btn" onClick={() => setShowCreateModal(false)}>
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecretCodeTab;
