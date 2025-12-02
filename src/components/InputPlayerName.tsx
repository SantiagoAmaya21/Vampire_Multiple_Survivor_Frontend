import React from "react";
interface InputPlayerNameProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEnter: () => void;
}

export default function InputPlayerName({ value, onChange, onEnter }: InputPlayerNameProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onEnter();
  };

  return (
    <input
      type="text"
      placeholder="Ingresa tu nombre..."
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyPress}
      className="
        px-6 py-3 rounded-xl w-64 text-lg text-white text-center font-semibold
        bg-black/60 placeholder-gray-300
        border-2 border-[#d4af37]
        shadow-lg shadow-black
        outline-none focus:ring-4 focus:ring-red-700/60
      "
    />
  );
}
