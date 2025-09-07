import React from 'react';

const LoadingPlaceholder: React.FC<{ message?: string }> = ({ message = "Processing..." }) => {
  return (
    <div className="w-full h-full p-4 bg-black/20 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-grid-pattern opacity-10 animate-pan-bg"></div>
        <svg
            className="w-12 h-12 mb-4 text-indigo-400/80 animate-spin-slow"
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
            strokeWidth="3"
            ></circle>
            <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
        </svg>
        <p className="text-base font-medium text-gray-300 text-center transition-opacity duration-500">{message}</p>
        <style>
        {`
            .bg-grid-pattern {
                background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
                background-size: 2rem 2rem;
            }
            @keyframes pan-bg {
                0% { background-position: 0% 0%; }
                100% { background-position: 100% 100%; }
            }
            .animate-pan-bg {
                animation: pan-bg 30s linear infinite;
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