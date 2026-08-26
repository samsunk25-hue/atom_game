import React from 'react';

interface CustomKeypadProps {
  mode: 'number' | 'alphabet';
  inputValue: string;
  setInputValue: (val: string) => void;
  onSubmit: () => void;
}

const CustomKeypad: React.FC<CustomKeypadProps> = ({ mode, inputValue, setInputValue, onSubmit }) => {
  const handleKeyClick = (key: string) => {
    if (inputValue.length < 3) {
      setInputValue(inputValue + key);
    }
  };

  const handleDelete = () => {
    setInputValue(inputValue.slice(0, -1));
  };

  const renderNumberKeypad = () => {
    const rows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['0']
    ];
    
    return (
      <>
        {rows.map((row, i) => (
          <div className="keypad-row" key={i}>
            {row.map(key => (
              <button key={key} className="key-btn" onClick={() => handleKeyClick(key)}>{key}</button>
            ))}
            {i === 3 && (
              <>
                <button className="key-btn action delete" onClick={handleDelete}>Del</button>
                <button className="key-btn action submit" onClick={onSubmit}>Enter</button>
              </>
            )}
          </div>
        ))}
      </>
    );
  };

  const renderAlphabetKeypad = () => {
    const rows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];

    return (
      <>
        {rows.map((row, i) => (
          <div className="keypad-row" key={i}>
            {row.map(key => (
              <button key={key} className="key-btn" onClick={() => handleKeyClick(key)}>{key}</button>
            ))}
            {i === 2 && (
              <>
                <button className="key-btn action delete" onClick={handleDelete}>Del</button>
                <button className="key-btn action submit" onClick={onSubmit}>Enter</button>
              </>
            )}
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="keypad-container">
      <div className="keypad-input-display">
        {inputValue || '_'}
      </div>
      <div className="keypad-keys">
        {mode === 'number' ? renderNumberKeypad() : renderAlphabetKeypad()}
      </div>
    </div>
  );
};

export default CustomKeypad;
