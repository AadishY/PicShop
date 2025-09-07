import React, { useState, useEffect } from 'react';

const messages = [
  "Conjuring pixels...",
  "Applying AI magic...",
  "Reticulating splines...",
  "Asking the silicon nicely...",
  "Warming up the diffusion model...",
  "Painting with algorithms...",
];

const LoadingPlaceholder: React.FC<{ message?: string }> = ({ message }) => {
  const [displayMessage, setDisplayMessage] = useState(message || messages[0]);

  useEffect(() => {
    if (!message) {
      const intervalId = setInterval(() => {
        setDisplayMessage(prev => {
          const currentIndex = messages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % messages.length;
          return messages[nextIndex];
        });
      }, 2500);
      return () => clearInterval(intervalId);
    }
  }, [message]);

  return (
    <div className="w-full h-full p-4 bg-gray-800/50 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gray-900/50 animate-pulse-bg"></div>
        <svg
            className="w-16 h-16 mb-4 text-indigo-500/50 animate-spin-slow"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            ></circle>
            <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
        </svg>
        <p className="text-lg font-medium text-gray-300 text-center transition-opacity duration-500">{displayMessage}</p>
        <style>
        {`
            @keyframes pulse-bg {
                0%, 100% { background-color: rgba(31, 41, 55, 0.3); }
                50% { background-color: rgba(31, 41, 55, 0.5); }
            }
            .animate-pulse-bg {
                animation: pulse-bg 4s ease-in-out infinite;
            }
            @keyframes spin-slow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .animate-spin-slow {
                animation: spin-slow 3s linear infinite;
            }
        `}
        </style>
    </div>
  );
};

export default LoadingPlaceholder;