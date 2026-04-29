import React from 'react';

const CookieBanner = ({ onAccept, onReject }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gray-900 text-white shadow-lg transform transition-transform duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm sm:text-base text-center sm:text-left">
          <span className="text-xl mr-2"></span>
          Utilitzem cookies pròpies i de tercers per recordar les teves identificacions 
          i oferir-te una millor experiència. Pots acceptar o rebutjar-les.
        </div>
        <div className="flex gap-3">
          <button
            onClick={onReject}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm font-medium transition"
          >
            Rebutjar
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
          >
            Acceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;