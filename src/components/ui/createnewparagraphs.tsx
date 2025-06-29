import React, { useState } from 'react';

const HiButton = () => {
  const [hiMessages, setHiMessages] = useState<string[]>([]);

  const handleClick = () => {
    setHiMessages(prev => [...prev, 'Hi']);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      {hiMessages.map((msg, index) => (
        <p key={index}>{msg}</p>
      ))}
      <button 
        onClick={handleClick} 
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Say Hi
      </button>
    </div>
  );
};

export {
    HiButton
};